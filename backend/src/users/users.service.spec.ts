import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { User, UserRole } from './entities/user.entity';

describe('UsersService (unit)', () => {
  let service: UsersService;
  let repo: {
    findOneBy: jest.Mock;
    find: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    repo = {
      findOneBy: jest.fn(),
      find: jest.fn(),
      create: jest.fn((x) => x),
      save: jest.fn((x) => Promise.resolve({ id: 1, ...x })),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: getRepositoryToken(User), useValue: repo }],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('hashes the password and never persists the plaintext', async () => {
      await service.create({ username: 'alice', name: 'Alice', password: 'plaintext', role: UserRole.USER });

      const persisted = repo.create.mock.calls[0][0];
      expect(persisted.password).not.toBe('plaintext');
      const matches = await bcrypt.compare('plaintext', persisted.password);
      expect(matches).toBe(true);
    });
  });

  describe('findOne', () => {
    it('looks a user up by username', async () => {
      repo.findOneBy.mockResolvedValue({ id: 1, username: 'alice' });
      const user = await service.findOne('alice');
      expect(repo.findOneBy).toHaveBeenCalledWith({ username: 'alice' });
      expect(user?.username).toBe('alice');
    });
  });

  describe('findById', () => {
    it('looks a user up by id', async () => {
      repo.findOneBy.mockResolvedValue({ id: 5, username: 'bob' });
      const user = await service.findById(5);
      expect(repo.findOneBy).toHaveBeenCalledWith({ id: 5 });
      expect(user?.id).toBe(5);
    });
  });
});
