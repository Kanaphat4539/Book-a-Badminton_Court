import { Test, TestingModule } from '@nestjs/testing';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';

describe('BookingsController (unit)', () => {
  let controller: BookingsController;
  let service: Record<string, jest.Mock>;

  beforeEach(async () => {
    service = {
      createBooking: jest.fn(),
      getAllBookings: jest.fn(),
      getMyBookings: jest.fn(),
      checkIn: jest.fn(),
      cancelBooking: jest.fn(),
      finishBooking: jest.fn(),
      resetBookings: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingsController],
      providers: [{ provide: BookingsService, useValue: service }],
    }).compile();

    controller = module.get<BookingsController>(BookingsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('passes the authenticated userId (not a client value) to createBooking', async () => {
    const req = { user: { userId: 5 } };
    await controller.createBooking(req, { courtId: 2, date: '2026-09-10', startTime: '10:00' });
    expect(service.createBooking).toHaveBeenCalledWith(5, 2, '2026-09-10', '10:00');
  });

  it('returns only the caller bookings from /me', async () => {
    const req = { user: { userId: 7 } };
    await controller.getMyBookings(req);
    expect(service.getMyBookings).toHaveBeenCalledWith(7);
  });

  it('forwards court id and auth user to check-in', async () => {
    const req = { user: { userId: 5 } };
    await controller.checkIn(req, '3', { courtId: 2 });
    expect(service.checkIn).toHaveBeenCalledWith(3, 5, 2);
  });

  it('scopes cancel to the authenticated user', async () => {
    const req = { user: { userId: 5 } };
    await controller.cancelBooking(req, '3');
    expect(service.cancelBooking).toHaveBeenCalledWith(3, 5);
  });
});
