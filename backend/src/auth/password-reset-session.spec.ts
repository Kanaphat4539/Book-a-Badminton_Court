import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { UserRole, UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';

describe('password reset session invalidation', () => {
  const student = {
    stu_id: '65010001',
    username: 'student',
    first_name: 'Test',
    last_name: 'Student',
    role: UserRole.STUDENT,
    password_version: 2,
  };

  it('signs the current password version into new sessions', async () => {
    const jwt = { sign: jest.fn(() => 'signed-token') };
    const auth = new AuthService(
      {} as UsersService,
      jwt as unknown as JwtService,
    );
    await auth.login(student);
    expect(jwt.sign).toHaveBeenCalledWith(
      expect.objectContaining({ sessionVersion: 2 }),
    );
  });

  it('rejects older student sessions after a password reset', async () => {
    const users = {
      findByUsername: jest.fn(() =>
        Promise.resolve({
          user: student,
          role: UserRole.STUDENT,
        }),
      ),
    };
    const strategy = new JwtStrategy(users as unknown as UsersService);
    const payload = {
      sub: student.stu_id,
      username: student.username,
      role: UserRole.STUDENT,
      sessionVersion: 1,
    };
    await expect(strategy.validate(payload)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    await expect(
      strategy.validate({ ...payload, sessionVersion: 2 }),
    ).resolves.toMatchObject({ userId: student.stu_id });
  });
});
