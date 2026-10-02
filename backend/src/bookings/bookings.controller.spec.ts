import { Test, TestingModule } from '@nestjs/testing';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import type { Response } from 'express';

describe('BookingsController', () => {
  let controller: BookingsController;
  let response: Partial<Response> & { statusCode?: number; body?: unknown; headers: Record<string, string> };

  const makeResponse = () => {
    const res = {
      statusCode: undefined as number | undefined,
      body: undefined as unknown,
      headers: {} as Record<string, string>,
      status(code: number) {
        res.statusCode = code;
        return res;
      },
      json(payload: unknown) {
        res.body = payload;
        return res;
      },
      setHeader(name: string, value: string) {
        res.headers[name] = value;
        return res;
      },
      send(payload: unknown) {
        res.body = payload;
        return res;
      },
    };
    return res;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingsController],
      providers: [{ provide: BookingsService, useValue: { getAllBookings: jest.fn().mockResolvedValue([]) } }]
    }).compile();

    controller = module.get<BookingsController>(BookingsController);
    response = makeResponse();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('rejects invalid export filters with 400 before reading any booking', async () => {
    const service = controller['bookingsService'] as unknown as { getAllBookings: jest.Mock };
    for (const query of [
      { status: 'DROPPED' },
      { court: '9' },
      { court: 'vip' },
      { lang: 'fr' },
      { from: '2026-02-30' },
      { from: '2026-10' },
      { from: '2026-10-03', to: '2026-10-01' },
      { dateFrom: 'not-a-date' },
    ]) {
      const res = makeResponse();
      await controller.exportBookings(res as unknown as Response, ...([
        query.court, query.status, undefined, query.lang, query.from, query.to, query.dateFrom, undefined,
      ] as [string?, string?, string?, string?, string?, string?, string?, string?]));
      expect(res.statusCode).toBe(400);
      expect(res.headers['Content-Type']).toBeUndefined();
    }
    expect(service.getAllBookings).not.toHaveBeenCalled();
  });

  it('streams an xlsx buffer with attachment headers for valid filters', async () => {
    await controller.exportBookings(
      response as unknown as Response,
      'ALL', 'ALL', '', 'en', '2026-10-01', '2026-10-01', undefined, undefined,
    );
    expect(response.statusCode).toBeUndefined();
    expect(response.headers['Content-Type']).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    expect(response.headers['Content-Disposition']).toMatch(/attachment; filename="booking-logs-\d{4}-\d{2}-\d{2}\.xlsx"/);
    expect(response.headers['Cache-Control']).toBe('no-store');
    expect(Buffer.isBuffer(response.body)).toBe(true);
    expect((response.body as Buffer).length).toBeGreaterThan(1000);
  });
});