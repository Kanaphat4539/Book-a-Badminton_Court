import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

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
}
