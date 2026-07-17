import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    const admin = await this.findOne('admin');
    if (!admin) {
      await this.create({
        username: 'admin',
        name: 'Administrator',
        password: 'password',
        role: UserRole.ADMIN,
      });
    }

    const user = await this.findOne('user');
    if (!user) {
      await this.create({
        username: 'user',
        name: 'Normal User',
        password: 'password',
        role: UserRole.USER,
      });
    }
  }

  async findOne(username: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ username });
  }

  async create(user: Partial<User>): Promise<User> {
    const saltOrRounds = 10;
    const passwordToHash = user.password || 'password';
    const hashedPassword = await bcrypt.hash(passwordToHash, saltOrRounds);
    
    const newUser = this.usersRepository.create({
      username: user.username,
      name: user.name,
      role: user.role,
      password: hashedPassword,
    });
    
    return this.usersRepository.save(newUser);
  }

  async findById(id: number): Promise<User | null> {
    return this.usersRepository.findOneBy({ id });
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      where: { role: UserRole.USER },
      order: { id: 'DESC' }
    });
  }

  async remove(id: number): Promise<void> {
    const user = await this.findById(id);
    if (user) {
      await this.usersRepository.remove(user);
    }
  }
}
