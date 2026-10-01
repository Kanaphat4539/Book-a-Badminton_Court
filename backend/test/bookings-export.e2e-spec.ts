import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import request from 'supertest';
import ExcelJS from 'exceljs';
import { BookingsController } from '../src/bookings/bookings.controller';
import { BookingsService } from '../src/bookings/bookings.service';
import { RolesGuard } from '../src/auth/roles.guard';
import { UserRole } from '../src/users/users.service';

const TEST_SECRET = 'isolated-booking-export-test-secret';

class TestJwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({ jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), ignoreExpiration: false, secretOrKey: TEST_SECRET });
  }

  validate(payload: any) {
    return { userId: payload.sub, username: payload.username, role: payload.role };
  }
}

describe('GET /bookings/export.xlsx (HTTP integration)', () => {
  let app: INestApplication;
  let jwt: JwtService;

  const rows = [
    {
      booking_id: 11, stu_id: 'S-11', court: 1, booking_date: '2026-10-01', time_in: '09:00:00', time_out: '10:00:00',
      status: 'PENDING', updated_at: new Date('2026-10-01T02:00:00Z'), password: 'do-not-export', qr_token: 'private-qr',
      student: { first_name: '=2+2', last_name: 'Alpha', username: 'alpha', password: 'nested-secret' },
    },
    {
      booking_id: 12, stu_id: 'S-12', court: 2, booking_date: '2026-10-02', time_in: '11:00:00', time_out: '12:00:00',
      status: 'CANCELLED', updated_at: null, qr_token: 'private-qr-2',
      student: { first_name: 'Beta', last_name: 'Tester', username: 'beta' },
    },
    {
      booking_id: 13, stu_id: 'S-13', court: 1, booking_date: '2026-10-03', time_in: '13:00:00', time_out: '14:00:00',
      status: 'COMPLETED', updated_at: null,
      student: { first_name: 'Gamma', last_name: 'Tester', username: 'gamma' },
    },
    {
      booking_id: 14, stu_id: 'S-14', court: 3, booking_date: '2026-10-01', time_in: '15:00:00', time_out: '16:00:00',
      status: 'PENDING', created_at: new Date('2026-10-01T08:05:00Z'), updated_at: null,
      student: { first_name: 'Delta', last_name: 'Tester', username: 'delta' },
    },
  ];

  const token = (role: UserRole) => jwt.sign({ sub: role === UserRole.ADMIN ? 'A-1' : 'S-1', username: role.toLowerCase(), role });

  const xlsx = (path: string) => request(app.getHttpServer()).get(path).buffer(true).parse((response, callback) => {
    const chunks: Buffer[] = [];
    response.on('data', (chunk: Buffer) => chunks.push(chunk));
    response.on('end', () => callback(null, Buffer.concat(chunks)));
  });

  const openWorkbook = async (body: Buffer) => {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(body);
    return workbook.worksheets[0];
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [BookingsController],
      providers: [
        RolesGuard,
        TestJwtStrategy,
        { provide: BookingsService, useValue: { getAllBookings: jest.fn().mockResolvedValue(rows) } },
      ],
    }).compile();
    app = module.createNestApplication();
    await app.init();
    jwt = new JwtService({ secret: TEST_SECRET });
  });

  afterAll(async () => app.close());

  it('rejects missing bearer credentials with HTTP 401', async () => {
    await request(app.getHttpServer()).get('/bookings/export.xlsx').expect(401);
  });

  it('rejects a valid student JWT at the real role guard with HTTP 403', async () => {
    await request(app.getHttpServer())
      .get('/bookings/export.xlsx')
      .set('Authorization', `Bearer ${token(UserRole.STUDENT)}`)
      .expect(403);
  });

  it('returns a real downloadable English workbook to an admin and applies every UI filter', async () => {
    const response = await xlsx('/bookings/export.xlsx')
      .set('Authorization', `Bearer ${token(UserRole.ADMIN)}`)
      .query({ court: '1', status: 'COMPLETED', search: 'gamma', lang: 'en', from: '2026-10-03', to: '2026-10-03' })
      .expect(200)
      .expect('Content-Type', /application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet/)
      .expect('Cache-Control', 'no-store');
    expect(String(response.headers['content-disposition'])).toMatch(/attachment; filename="booking-logs-\d{4}-\d{2}-\d{2}\.xlsx"/);
    const sheet = await openWorkbook(response.body);
    expect(sheet.name).toBe('Booking logs');
    expect(sheet.rowCount).toBe(2);
    expect(sheet.getRow(2).getCell(1).value).toBe(13);
    expect(sheet.getRow(2).getCell(3).value).toBe('Gamma Tester');
    expect(sheet.autoFilter).toBeTruthy();
  });

  it('accepts the exact dateFrom/dateTo query names sent by the dashboard', async () => {
    const response = await xlsx('/bookings/export.xlsx')
      .set('Authorization', `Bearer ${token(UserRole.ADMIN)}`)
      .query({ dateFrom: '2026-10-02', dateTo: '2026-10-02' })
      .expect(200);
    const sheet = await openWorkbook(response.body);
    expect(sheet.rowCount).toBe(2);
    expect(sheet.getRow(2).getCell(1).value).toBe(12);
  });

  it('validates malformed, partial, and reversed date filters over HTTP', async () => {
    const auth = `Bearer ${token(UserRole.ADMIN)}`;
    for (const query of [{ from: '2026-02-30' }, { from: '2026-10' }, { from: '2026-10-03', to: '2026-10-01' }]) {
      await request(app.getHttpServer()).get('/bookings/export.xlsx').set('Authorization', auth).query(query).expect(400);
    }
  });

  it('rejects unknown status and court filters instead of silently returning everything', async () => {
    const auth = `Bearer ${token(UserRole.ADMIN)}`;
    await request(app.getHttpServer()).get('/bookings/export.xlsx').set('Authorization', auth).query({ status: 'DROPPED' }).expect(400);
    await request(app.getHttpServer()).get('/bookings/export.xlsx').set('Authorization', auth).query({ court: '9' }).expect(400);
    await request(app.getHttpServer()).get('/bookings/export.xlsx').set('Authorization', auth).query({ lang: 'fr' }).expect(400);
  });

  it('keeps formula-like text inert and excludes credential/QR fields from the workbook', async () => {
    const response = await xlsx('/bookings/export.xlsx').set('Authorization', `Bearer ${token(UserRole.ADMIN)}`).expect(200);
    const sheet = await openWorkbook(response.body);
    expect(sheet.getRow(2).getCell(3).value).toBe("'=2+2 Alpha");
    expect(sheet.getCell('C2').type).not.toBe(ExcelJS.ValueType.Formula);
    const content = sheet.getSheetValues().flat(Infinity).join('|');
    expect(content).not.toMatch(/do-not-export|private-qr|nested-secret/);
  });

  it('defaults to Thai workbook language and supports inclusive date boundaries', async () => {
    const response = await xlsx('/bookings/export.xlsx')
      .set('Authorization', `Bearer ${token(UserRole.ADMIN)}`)
      .query({ from: '2026-10-01', to: '2026-10-01' })
      .expect(200);
    const sheet = await openWorkbook(response.body);
    expect(sheet.name).toBe('ประวัติการจอง');
    expect(sheet.rowCount).toBe(3);
    expect(sheet.getRow(2).getCell(1).value).toBe(11);
    expect(sheet.getRow(2).getCell(8).value).toBe('รอตรวจสอบ');
  });

  it('only exports bookings that are inside the READY_CHECK_IN grace window', async () => {
    const auth = `Bearer ${token(UserRole.ADMIN)}`;
    const slotStart = new Date('2026-10-01T15:00:00+07:00').getTime();
    const exportAt = async (nowMs: number) => {
      const spy = jest.spyOn(Date, 'now').mockReturnValue(nowMs);
      try {
        const response = await xlsx('/bookings/export.xlsx')
          .set('Authorization', auth)
          .query({ status: 'READY_CHECK_IN' })
          .expect(200);
        return await openWorkbook(response.body);
      } finally {
        spy.mockRestore();
      }
    };

    // Booking 14 starts at 15:00 Bangkok and was created 5 minutes late, so its check-in
    // deadline is created_at + 15 minutes (08:20Z), not slot start + 15 minutes.
    const insideGrace = await exportAt(slotStart + 10 * 60 * 1000);
    const beforeSlot = await exportAt(slotStart - 60 * 1000);
    const afterGrace = await exportAt(slotStart + 40 * 60 * 1000);

    expect(insideGrace.rowCount).toBe(2);
    expect(insideGrace.getRow(2).getCell(1).value).toBe(14);
    expect(beforeSlot.rowCount).toBe(1);
    expect(afterGrace.rowCount).toBe(1);
  });

  it('filters by court and by free-text search', async () => {
    const auth = `Bearer ${token(UserRole.ADMIN)}`;
    const courtOne = await openWorkbook((await xlsx('/bookings/export.xlsx').set('Authorization', auth).query({ court: '1' })).body);
    expect(courtOne.rowCount).toBe(3);
    const byName = await openWorkbook((await xlsx('/bookings/export.xlsx').set('Authorization', auth).query({ search: 'beta' })).body);
    expect(byName.rowCount).toBe(2);
    expect(byName.getRow(2).getCell(1).value).toBe(12);
  });

  it('produces a workbook ExcelJS can recompute end to end with nine labelled columns', async () => {
    const response = await xlsx('/bookings/export.xlsx').set('Authorization', `Bearer ${token(UserRole.ADMIN)}`).query({ lang: 'en' }).expect(200);
    const sheet = await openWorkbook(response.body);
    expect(sheet.columnCount).toBe(9);
    expect(Array.from({ length: 9 }, (_, index) => sheet.getRow(1).getCell(index + 1).value)).toEqual([
      'Booking ID', 'Student ID', 'Student name', 'Court', 'Booking date', 'Start time', 'End time', 'Status', 'Last updated',
    ]);
    expect(sheet.views[0]).toMatchObject({ state: 'frozen', ySplit: 1 });
    expect(response.body.length).toBeGreaterThan(1000);
  });
});
