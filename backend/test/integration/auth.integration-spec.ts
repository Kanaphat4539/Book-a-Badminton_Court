import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException } from '@nestjs/common';
import { AuthModule } from '../../src/auth/auth.module';
import { AuthService } from '../../src/auth/auth.service';
import { User } from '../../src/users/entities/user.entity';
import { Court } from '../../src/courts/entities/court.entity';
import { Booking } from '../../src/bookings/entities/booking.entity';

// Integration: real UsersModule + AuthModule wiring (bcrypt hashing + JWT signing)
// against in-memory SQLite. No HTTP layer.
describe('Auth integration (sqlite :memory:)', () => {
  let moduleRef: TestingModule;
  let authService: AuthService;
  let jwtService: JwtService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'better-sqlite3',
          database: ':memory:',
          entities: [User, Court, Booking],
          synchronize: true,
          dropSchema: true,
        }),
        AuthModule,
      ],
    }).compile();

    authService = moduleRef.get(AuthService);
    jwtService = moduleRef.get(JwtService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('registers a real user, hashes the password, and issues a usable JWT', async () => {
    const result = await authService.register({
      username: 'integ',
      password: 'my-password',
      name: 'Integ User',
    });

    expect(result.access_token).toBeTruthy();
    const decoded = jwtService.verify(result.access_token);
    expect(decoded.username).toBe('integ');
  });

  it('lets the same user log back in with the correct password', async () => {
    await authService.register({ username: 'roundtrip', password: 'pw123', name: 'RT' });

    const validated = await authService.validateUser('roundtrip', 'pw123');
    expect(validated).toBeTruthy();
    expect(validated.username).toBe('roundtrip');
    expect(validated.password).toBeUndefined(); // password stripped before return
  });

  it('rejects login with the wrong password', async () => {
    await authService.register({ username: 'wrongpw', password: 'correct', name: 'W' });
    const validated = await authService.validateUser('wrongpw', 'incorrect');
    expect(validated).toBeNull();
  });

  it('rejects registering a duplicate username', async () => {
    await authService.register({ username: 'dupe', password: 'pw', name: 'D' });
    await expect(authService.register({ username: 'dupe', password: 'pw2', name: 'D2' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
