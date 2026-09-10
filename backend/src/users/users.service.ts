import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
        tel: '0812345678'
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
    const saltOrRounds = 10;
    const passwordToHash = studentData.password || 'password';
    const hashedPassword = await bcrypt.hash(passwordToHash, saltOrRounds);
    
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
    } as any);
    
    return this.studentRepository.save(newStudent) as unknown as Promise<Student>;
  }

  async findStudentById(stu_id: string): Promise<Student | null> {
    return this.studentRepository.findOneBy({ stu_id });
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
