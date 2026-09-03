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
    
    const newStudent = this.studentRepository.create({
      ...studentData,
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
}
