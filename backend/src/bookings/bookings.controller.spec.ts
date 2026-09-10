import { Test, TestingModule } from '@nestjs/testing';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';

describe('BookingsController (unit)', () => {
  let controller: BookingsController;
  let service: jest.Mocked<
    Pick<BookingsService, 'createBooking' | 'getAllBookings' | 'getMyBookings' | 'checkIn' | 'cancelBooking' | 'finishBooking' | 'resetBookings'>
  >;

  const req = { user: { userId: '64010001', role: 'STUDENT' } };

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

  it('createBooking forwards the authenticated user id and body', async () => {
    await controller.createBooking(req, { courtId: 3, date: '2026-09-10', startTime: '10:00' });
    expect(service.createBooking).toHaveBeenCalledWith('64010001', 3, '2026-09-10', '10:00');
  });

  it('getMyBookings uses the authenticated user id', async () => {
    await controller.getMyBookings(req);
    expect(service.getMyBookings).toHaveBeenCalledWith('64010001');
  });

  it('checkIn passes id, user id and court id', async () => {
    await controller.checkIn(req, '5', { courtId: 2 });
    expect(service.checkIn).toHaveBeenCalledWith(5, '64010001', 2);
  });

  it('cancelBooking passes id and user id', async () => {
    await controller.cancelBooking(req, '5');
    expect(service.cancelBooking).toHaveBeenCalledWith(5, '64010001');
  });

  it('finishBooking passes the numeric id', async () => {
    await controller.finishBooking('7');
    expect(service.finishBooking).toHaveBeenCalledWith(7);
  });

  it('getAllBookings forwards the optional date filter', async () => {
    await controller.getAllBookings('2026-09-10');
    expect(service.getAllBookings).toHaveBeenCalledWith('2026-09-10');
  });
});
