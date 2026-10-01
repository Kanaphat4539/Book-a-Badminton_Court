import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Admin } from './entities/admin.entity';
import { Student } from './entities/student.entity';
import { Booking } from '../bookings/entities/booking.entity';
import * as bcrypt from 'bcrypt';

export enum UserRole {
  STUDENT = 'STUDENT',
  ADMIN = 'ADMIN',
}

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
  ) {}

  async onModuleInit() {
    // Seed default admin if not exists
    const admin = await this.adminRepository.findOneBy({ username: 'admin' });
    if (!admin) {
      const hashedPassword = await bcrypt.hash('password', 10);
      const newAdmin = this.adminRepository.create({
        admin_id: 'A001',
        username: 'admin',
        name: 'Administrator',
        password: hashedPassword,
      });
      await this.adminRepository.save(newAdmin);
    }

    // Seed default student if not exists for testing
    const testStudent = await this.studentRepository.findOneBy({ username: 'testuser' });
    if (!testStudent) {
      const hashedPassword = await bcrypt.hash('password', 10);
      const newStudent = this.studentRepository.create({
        stu_id: '65010000',
        email: 'testuser@kmitl.ac.th',
        username: 'testuser',
        first_name: 'Test',
        last_name: 'Student',
        password: hashedPassword,
        tel: '0812345678',
        major: 'IT',
        year: 3
      });
      await this.studentRepository.save(newStudent);
    }
  }

  async findByUsername(username: string): Promise<{ user: any; role: UserRole } | null> {
    const admin = await this.adminRepository.findOneBy({ username });
    if (admin) return { user: admin, role: UserRole.ADMIN };

    const student = await this.studentRepository.findOneBy({ username });
    if (student) return { user: student, role: UserRole.STUDENT };

    return null;
  }

  async createStudent(studentData: any): Promise<Student> {
    if (typeof studentData?.password !== 'string' || studentData.password.trim() === '') {
      throw new BadRequestException('Password is required');
    }
    const hashedPassword = await bcrypt.hash(studentData.password, 10);
    // Split "name" from frontend into first_name and last_name
    const nameParts = (studentData.name || '').trim().split(' ');
    const first_name = nameParts[0] || '';
    const last_name = nameParts.slice(1).join(' ') || '';
    const newStudent = this.studentRepository.create({
      stu_id: studentData.studentId || studentData.stu_id,
      email: studentData.email,
      first_name: studentData.first_name || first_name,
      last_name: studentData.last_name || last_name,
      tel: studentData.phone || studentData.tel,
      major: studentData.major,
      year: parseInt(studentData.year, 10) || 1,
      username: studentData.username,
      password: hashedPassword,
    } as any) as unknown as Student;
    
    try {
      // save() updates an existing primary key; registration must only insert.
      await this.studentRepository.insert(newStudent);
      return newStudent;
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const driverError = error.driverError as { code?: string; message?: string };
        if (driverError.code === 'ER_DUP_ENTRY' ||
            driverError.code === 'SQLITE_CONSTRAINT' ||
            /UNIQUE constraint failed/i.test(driverError.message || '')) {
          throw new BadRequestException('Account already exists');
        }
      }
      throw error;
    }
  }

  async findStudentById(stu_id: string): Promise<Student | null> {
    return this.studentRepository.findOneBy({ stu_id });
  }

  async saveStudent(student: Student): Promise<Student> {
    return this.studentRepository.save(student);
  }

  async findAllStudents(): Promise<Partial<Student>[]> {
    const students = await this.studentRepository.find();
    return students.map(({ password: _password, ...student }) => student);
  }

  async removeStudent(stu_id: string): Promise<void> {
    const bookingRepository = this.studentRepository.manager.getRepository(Booking);
    const historyCount = await bookingRepository.count({ where: { student: { stu_id } as any } });
    if (historyCount > 0) {
      throw new BadRequestException('Student has booking history');
    }
    const student = await this.findStudentById(stu_id) || await this.studentRepository.findOneBy({ id: parseInt(stu_id) || 0 } as any);
    if (student) {
      await this.studentRepository.remove(student);
    }
  }

  async resetQuota(stu_id: string): Promise<Student> {
    const student = await this.findStudentById(stu_id);
    if (!student) {
      throw new BadRequestException('Student not found');
    }
    if (student.quota !== 0) {
      throw new BadRequestException('ยังมีโควตาร์อยู่');
    }
    student.quota = 1;
    // Also cancel today's pending/checked-in bookings so user can actually book again
    const today = new Date().toISOString().split('T')[0];
    const bookingRepo = this.studentRepository.manager.getRepository(Booking);
    await bookingRepo.createQueryBuilder('b')
      .update()
      .set({ status: 'CANCELLED' })
      .where('b.stu_id = :stu', { stu: stu_id })
      .andWhere('b.booking_date = :date', { date: today })
      .andWhere("b.status IN (:...statuses)", { statuses: ['PENDING', 'CHECKED_IN'] })
      .execute();
    return this.saveStudent(student);
  }

  async banUser(stu_id: string): Promise<Student> {
    const student = await this.findStudentById(stu_id);
    if (!student) {
      throw new BadRequestException('Student not found');
    }
    student.strikes = 2;
    student.banned_until = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return this.saveStudent(student);
  }

  async createAdmin(adminData: any): Promise<Admin> {
    if (typeof adminData?.password !== 'string' || adminData.password.trim() === '') {
      throw new BadRequestException('Password is required');
    }
    const saltOrRounds = 10;
    const passwordToHash = adminData.password;
    const hashedPassword = await bcrypt.hash(passwordToHash, saltOrRounds);
    
    const newAdmin = this.adminRepository.create({
      admin_id: adminData.admin_id || adminData.adminId || `A${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      username: adminData.username,
      name: adminData.name,
      password: hashedPassword,
    });
    
    return this.adminRepository.save(newAdmin);
  }
}
