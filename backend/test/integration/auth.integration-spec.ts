import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException } from '@nestjs/common';
import { AuthModule } from '../../src/auth/auth.module';
import { AuthService } from '../../src/auth/auth.service';
import { Admin } from '../../src/users/entities/admin.entity';
import { Student } from '../../src/users/entities/student.entity';
import { Booking } from '../../src/bookings/entities/booking.entity';

// Integration: real UsersModule + AuthModule wiring (bcrypt hashing + JWT signing)
// against in-memory SQLite. No HTTP layer, no mocks.
describe('Auth integration (sqlite :memory:)', () => {
  let moduleRef: TestingModule;
  let authService: AuthService;
  let jwtService: JwtService;

  const student = (over: Partial<Record<string, any>> = {}) => ({
    studentId: '64010001',
    email: 'integ@kmitl.ac.th',
    name: 'Integ User',
    phone: '0800000000',
    major: 'CS',
    year: '1',
    username: 'integ',
    password: 'my-password',
    ...over,
  });

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'better-sqlite3',
          database: ':memory:',
          entities: [Admin, Student, Booking],
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

  it('registers a real student, hashes the password, and issues a usable JWT', async () => {
    const result = await authService.register(student());

    expect(result.access_token).toBeTruthy();
    const decoded = jwtService.verify(result.access_token);
    expect(decoded.username).toBe('integ');
    expect(decoded.role).toBe('STUDENT');
  });

  it('lets the same student log back in with the correct password', async () => {
    await authService.register(student({ studentId: '64010002', username: 'roundtrip', email: 'rt@kmitl.ac.th' }));

    const validated = await authService.validateUser('roundtrip', 'my-password');
    expect(validated).toBeTruthy();
    expect(validated.username).toBe('roundtrip');
    expect(validated.password).toBeUndefined(); // password stripped before return
  });

  it('rejects login with the wrong password', async () => {
    await authService.register(student({ studentId: '64010003', username: 'wrongpw', email: 'wp@kmitl.ac.th' }));
    expect(await authService.validateUser('wrongpw', 'incorrect')).toBeNull();
  });

  it('rejects a non-@kmitl.ac.th email', async () => {
    await expect(authService.register(student({ studentId: '64010004', username: 'gmail', email: 'x@gmail.com' })))
      .rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects registering a duplicate username', async () => {
    await authService.register(student({ studentId: '64010005', username: 'dupe', email: 'd1@kmitl.ac.th' }));
    await expect(authService.register(student({ studentId: '64010006', username: 'dupe', email: 'd2@kmitl.ac.th' })))
      .rejects.toBeInstanceOf(BadRequestException);
  });
});
