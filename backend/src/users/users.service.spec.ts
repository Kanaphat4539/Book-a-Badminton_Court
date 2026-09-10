import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { UsersService, UserRole } from './users.service';
import { Admin } from './entities/admin.entity';
import { Student } from './entities/student.entity';

function repoMock() {
  return {
    findOneBy: jest.fn(),
    find: jest.fn(),
    create: jest.fn((x) => x),
    save: jest.fn((x) => Promise.resolve(x)),
    remove: jest.fn(),
  };
}

describe('UsersService (unit)', () => {
  let service: UsersService;
  let admins: ReturnType<typeof repoMock>;
  let students: ReturnType<typeof repoMock>;

  beforeEach(async () => {
    admins = repoMock();
    students = repoMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(Admin), useValue: admins },
        { provide: getRepositoryToken(Student), useValue: students },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('findByUsername', () => {
    it('returns an admin with the ADMIN role', async () => {
      admins.findOneBy.mockResolvedValue({ admin_id: 'A001', username: 'admin' });
      expect(await service.findByUsername('admin')).toEqual({
        user: { admin_id: 'A001', username: 'admin' },
        role: UserRole.ADMIN,
      });
    });

    it('falls back to a student with the STUDENT role', async () => {
      admins.findOneBy.mockResolvedValue(null);
      students.findOneBy.mockResolvedValue({ stu_id: '64010001', username: 'stu' });
      expect(await service.findByUsername('stu')).toEqual({
        user: { stu_id: '64010001', username: 'stu' },
        role: UserRole.STUDENT,
      });
    });

    it('returns null when neither exists', async () => {
      admins.findOneBy.mockResolvedValue(null);
      students.findOneBy.mockResolvedValue(null);
      expect(await service.findByUsername('ghost')).toBeNull();
    });
  });

  describe('createStudent', () => {
    it('hashes the password, splits the name, and coerces the year', async () => {
      await service.createStudent({
        studentId: '64010001',
        email: 'new@kmitl.ac.th',
        name: 'Some One',
        phone: '0812345678',
        major: 'CS',
        year: '3',
        username: 'newstu',
        password: 'raw-password',
      });

      const created = students.create.mock.calls[0][0];
      expect(created.stu_id).toBe('64010001');
      expect(created.first_name).toBe('Some');
      expect(created.last_name).toBe('One');
      expect(created.tel).toBe('0812345678');
      expect(created.year).toBe(3);
      expect(created.password).not.toBe('raw-password');
      expect(await bcrypt.compare('raw-password', created.password)).toBe(true);
    });
  });

  describe('createAdmin', () => {
    it('hashes the admin password', async () => {
      await service.createAdmin({ admin_id: 'A002', username: 'admin2', name: 'Admin Two', password: 'pw' });
      const created = admins.create.mock.calls[0][0];
      expect(created.password).not.toBe('pw');
      expect(await bcrypt.compare('pw', created.password)).toBe(true);
    });
  });

  describe('removeStudent', () => {
    it('removes an existing student', async () => {
      const student = { stu_id: '64010001' };
      students.findOneBy.mockResolvedValue(student);
      await service.removeStudent('64010001');
      expect(students.remove).toHaveBeenCalledWith(student);
    });

    it('does nothing when the student is missing', async () => {
      students.findOneBy.mockResolvedValue(null);
      await service.removeStudent('nope');
      expect(students.remove).not.toHaveBeenCalled();
    });
  });
});
