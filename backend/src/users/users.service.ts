import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Admin } from './entities/admin.entity';
import { Student } from './entities/student.entity';
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
    await this.backfillNormalizedEmails();
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
        email_normalized: 'testuser@kmitl.ac.th',
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

  async findStudentByEmail(email: string): Promise<Student | null> {
    const matches = await this.studentRepository.find({ where: { email_normalized: email }, take: 2 });
    return matches.length === 1 ? matches[0] : null;
  }

  async backfillNormalizedEmails(): Promise<void> {
    await this.studentRepository.createQueryBuilder()
      .update(Student)
      .set({ email_normalized: () => 'LOWER(email)' })
      .where('email_normalized IS NULL OR email_normalized <> LOWER(email)')
      .execute();
  }

  async setPasswordResetToken(stuId: string, hash: string, expiresAt: Date): Promise<boolean> {
    const now = new Date();
    const earliest = new Date(now.getTime() - 60_000);
    const result = await this.studentRepository.createQueryBuilder()
      .update(Student)
      .set({ reset_token_hash: hash, reset_token_expires_at: expiresAt, reset_requested_at: now })
      .where('stu_id = :stuId', { stuId })
      .andWhere('(reset_requested_at IS NULL OR reset_requested_at <= :earliest)', { earliest })
      .execute();
    return result.affected === 1;
  }

  async clearPasswordResetToken(hash: string): Promise<void> {
    await this.studentRepository.createQueryBuilder()
      .update(Student)
      .set({ reset_token_hash: null, reset_token_expires_at: null })
      .where('reset_token_hash = :hash', { hash })
      .execute();
  }

  async hasValidPasswordResetToken(hash: string, now: Date): Promise<boolean> {
    const count = await this.studentRepository.createQueryBuilder('student')
      .where('student.reset_token_hash = :hash', { hash })
      .andWhere('student.reset_token_expires_at > :now', { now })
      .getCount();
    return count > 0;
  }

  async consumePasswordResetToken(hash: string, nextPasswordHash: string, now: Date): Promise<boolean> {
    const result = await this.studentRepository.createQueryBuilder()
      .update(Student)
      .set({
        password: nextPasswordHash,
        reset_token_hash: null,
        reset_token_expires_at: null,
        password_version: () => 'password_version + 1',
      })
      .where('reset_token_hash = :hash', { hash })
      .andWhere('reset_token_expires_at > :now', { now })
      .execute();
    return result.affected === 1;
  }

  async createStudent(studentData: any): Promise<Student> {
    const saltOrRounds = 10;
    const passwordToHash = studentData.password || 'password';
    const hashedPassword = await bcrypt.hash(passwordToHash, saltOrRounds);
    
    // Split "name" from frontend into first_name and last_name
    const nameParts = (studentData.name || '').trim().split(' ');
    const first_name = nameParts[0] || '';
    const last_name = nameParts.slice(1).join(' ') || '';
    
    const newStudent = this.studentRepository.create({
      stu_id: studentData.studentId || studentData.stu_id,
      email: typeof studentData.email === 'string' ? studentData.email.trim().toLowerCase() : studentData.email,
      email_normalized: typeof studentData.email === 'string' ? studentData.email.trim().toLowerCase() : null,
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

  async findAllStudents(): Promise<Student[]> {
    return this.studentRepository.find();
  }

  async removeStudent(stu_id: string): Promise<void> {
    const student = await this.findStudentById(stu_id);
    if (student) {
      await this.studentRepository.remove(student);
    }
  }

  async createAdmin(adminData: any): Promise<Admin> {
    const saltOrRounds = 10;
    const passwordToHash = adminData.password || 'password';
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
