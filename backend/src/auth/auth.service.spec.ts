import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';

describe('AuthService', () => {
  it('rejects non-string usernames without querying repositories', async () => {
    const findByUsername = jest.fn();
    const service = new AuthService({ findByUsername } as unknown as UsersService, {} as JwtService);
    await expect(service.validateUser({} as any, 'x')).resolves.toBeNull();
    expect(findByUsername).not.toHaveBeenCalled();
  });

  it('validates an admin username via the users service boundary', async () => {
    const findByUsername = jest.fn().mockResolvedValue(null);
    const service = new AuthService(
      { findByUsername } as unknown as UsersService,
      {} as JwtService,
    );

    await expect(service.validateUser('admin', 'password')).resolves.toBeNull();
    expect(findByUsername).toHaveBeenCalledWith('admin');
  });
});
