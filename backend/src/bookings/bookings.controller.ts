import { Controller, Get, Post, Body, Param, UseGuards, Request, Query, ParseIntPipe, Res } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/users.service';
import { getBookingTimes } from './booking-time';
import type { Response } from 'express';
import ExcelJS from 'exceljs';

const EXPORT_STATUSES = ['ALL', 'ACTIVE', 'READY_CHECK_IN', 'PENDING', 'CHECKED_IN', 'CANCELLED', 'COMPLETED'];
const XLSX_CONTENT_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const STATUS_LABELS: Record<'th' | 'en', Record<string, string>> = {
  th: { PENDING: 'รอตรวจสอบ', CHECKED_IN: 'เช็กอินแล้ว', CANCELLED: 'ยกเลิก', COMPLETED: 'เสร็จสิ้น' },
  en: { PENDING: 'Pending', CHECKED_IN: 'Checked in', CANCELLED: 'Cancelled', COMPLETED: 'Completed' },
};

/** Excel treats a leading = + - @ as a formula, so untrusted text is prefixed and stored as a literal. */
const inertText = (value: unknown): string => {
  const text = String(value ?? '');
  return /^[\s\u0000-\u001f]*[=+\-@]/.test(text) ? `'${text}` : text;
};

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  async createBooking(@Request() req: any, @Body() body: { courtId: number; date: string; startTime: string }) {
    return this.bookingsService.createBooking(req.user.userId, body.courtId, body.date, body.startTime);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  async getAllBookings(@Query('date') date?: string) {
    return this.bookingsService.getAllBookings(date);
  }

  /**
   * Booking-log export used by the admin dashboard. It applies exactly the filters the table
   * uses (inclusive booking_date bounds, court, status, search text) and streams a real .xlsx
   * workbook, so the downloaded file can never disagree with what the admin sees on screen.
   */
  @Get('export.xlsx')
  @Roles(UserRole.ADMIN)
  async exportBookings(
    @Res() response: Response,
    @Query('court') court?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('lang') lang?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const start = dateFrom ?? from;
    const end = dateTo ?? to;
    const bad = (message: string) => {
      response.status(400).json({ message });
      return undefined;
    };

    if (status && status !== 'ALL' && !EXPORT_STATUSES.includes(status)) return bad('Invalid booking status filter.');
    if (court && court !== 'ALL' && !/^[1-4]$/.test(court)) return bad('Invalid court filter.');
    // Reject impossible calendar dates (2026-02-30) and reversed ranges before doing any work.
    const validDate = (value?: string) => !value || (/^\d{4}-\d{2}-\d{2}$/.test(value)
      && new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value);
    if (!validDate(start) || !validDate(end) || (start && end && start > end)) return bad('Invalid date range.');
    if (lang && lang !== 'th' && lang !== 'en') return bad('Invalid language.');

    const records = await this.bookingsService.getAllBookings();
    const query = search?.trim().toLocaleLowerCase() || '';
    const now = Date.now();
    const filtered = (records as any[]).filter((row) => {
      if (start && row.booking_date < start) return false;
      if (end && row.booking_date > end) return false;
      if (court && court !== 'ALL' && String(row.court) !== court) return false;
      if (status === 'ACTIVE' && !['PENDING', 'CHECKED_IN'].includes(row.status)) return false;
      if (status === 'READY_CHECK_IN') {
        const { start: slotStart, end: slotEnd, deadline } = getBookingTimes(row);
        if (row.status !== 'PENDING' || now < slotStart || now > deadline || now >= slotEnd) return false;
      } else if (status && status !== 'ALL' && status !== 'ACTIVE' && row.status !== status) {
        return false;
      }
      if (query) {
        const searchable = [
          row.booking_id,
          row.court,
          row.booking_date,
          row.student?.first_name,
          row.student?.last_name,
          row.student?.username,
        ].join(' ').toLocaleLowerCase();
        if (!searchable.includes(query)) return false;
      }
      return true;
    });

    const thai = !lang || lang === 'th';
    const labels = STATUS_LABELS[thai ? 'th' : 'en'];
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'KMITL Badminton';
    workbook.created = new Date();
    const sheet = workbook.addWorksheet(thai ? 'ประวัติการจอง' : 'Booking logs');
    sheet.columns = (thai
      ? ['รหัสการจอง', 'รหัสนักศึกษา', 'ชื่อผู้จอง', 'สนาม', 'วันที่จอง', 'เวลาเริ่ม', 'เวลาสิ้นสุด', 'สถานะ', 'บันทึกล่าสุด']
      : ['Booking ID', 'Student ID', 'Student name', 'Court', 'Booking date', 'Start time', 'End time', 'Status', 'Last updated']
    ).map((header, index) => ({ header, key: `c${index}`, width: [14, 16, 28, 12, 16, 14, 14, 18, 22][index] }));
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB45309' } };

    for (const row of filtered) {
      sheet.addRow([
        Number(row.booking_id),
        inertText(row.stu_id),
        inertText(`${row.student?.first_name || ''} ${row.student?.last_name || ''}`.trim()),
        Number(row.court),
        inertText(row.booking_date),
        inertText(row.time_in),
        inertText(row.time_out),
        inertText(labels[row.status] || row.status),
        row.updated_at ? new Date(row.updated_at) : '',
      ]);
    }

    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    sheet.autoFilter = { from: 'A1', to: 'I1' };

    const bytes = await workbook.xlsx.writeBuffer();
    response.setHeader('Content-Type', XLSX_CONTENT_TYPE);
    response.setHeader('Content-Disposition', `attachment; filename="booking-logs-${new Date().toISOString().slice(0, 10)}.xlsx"`);
    response.setHeader('Cache-Control', 'no-store');
    response.send(Buffer.from(bytes));
  }

  @Get('notifications')
  @Roles(UserRole.ADMIN)
  async getNotifications() {
    return this.bookingsService.getNotifications();
  }

  @Get('user-notifications')
  async getUserNotifications(@Request() req: any) {
    return this.bookingsService.getUserNotifications(req.user.userId);
  }

  @Get('me')
  async getMyBookings(@Request() req: any) {
    return this.bookingsService.getMyBookings(req.user.userId);
  }

  @Post(':id/check-in')
  async checkIn(@Request() req: any, @Param('id') id: string, @Body() body: { courtId: number }) {
    return this.bookingsService.checkIn(+id, req.user.userId, body.courtId);
  }

  @Post(':id/cancel')
  async cancelBooking(@Request() req: any, @Param('id') id: string) {
    return this.bookingsService.cancelBooking(+id, req.user.userId);
  }

  @Post(':id/finish')
  @Roles(UserRole.ADMIN)
  async finishBooking(@Param('id', ParseIntPipe) id: number) {
    return this.bookingsService.finishBooking(id);
  }

  @Post('reset')
  @Roles(UserRole.ADMIN)
  async resetBookings() {
    return this.bookingsService.resetBookings();
  }
}
