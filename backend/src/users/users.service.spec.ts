import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Student } from './entities/student.entity';
import { Admin } from './entities/admin.entity';
import { Booking } from '../bookings/entities/booking.entity';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(Student), useValue: {} },
        { provide: getRepositoryToken(Admin), useValue: {} }
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('rejects Admin creation when the password is missing', async () => {
    (service as any).adminRepository = { create: (data: any) => data, save: async (data: any) => data };
    await expect(service.createAdmin({ admin_id: 'A999', username: 'qa_missing_password', name: 'QA Admin' }))
      .rejects.toThrow('Password is required');
  });

  it('rejects deleting a student who has booking history and preserves that history', async () => {
    const student = { stu_id: '99000123' } as Student;
    const deleteBookings = jest.fn();
    (service as any).studentRepository = {
      manager: { getRepository: (entity: any) => {
        if (entity === Booking) return { count: async () => 1, delete: deleteBookings };
        throw new Error('unexpected repository');
      } },
      findOneBy: async () => student,
      remove: jest.fn(),
    };
    deleteBookings.mockResolvedValue({ affected: 1 });

    await expect(service.removeStudent(student.stu_id)).rejects.toThrow('Student has booking history');
    expect(deleteBookings).not.toHaveBeenCalled();
    expect((service as any).studentRepository.remove).not.toHaveBeenCalled();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});