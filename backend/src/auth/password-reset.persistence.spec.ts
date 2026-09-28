import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { Student } from '../users/entities/student.entity';
import { Admin } from '../users/entities/admin.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { Court } from '../courts/entities/court.entity';

describe('password reset storage', () => {
  let db: DataSource;
  let users: UsersService;

  beforeEach(async () => {
    db = await new DataSource({
      type: 'sqljs',
      entities: [Student, Admin, Booking, Court],
      synchronize: true,
    }).initialize();
    users = new UsersService(
      db.getRepository(Admin),
      db.getRepository(Student),
    );
    await db.getRepository(Student).save({
      stu_id: '65010001',
      email: 'student@kmitl.ac.th',
      username: 'student',
      first_name: 'Test',
      last_name: 'Student',
      tel: '',
      major: 'Engineering',
      year: 2,
      password: await bcrypt.hash('old-password', 10),
    });
    await users.backfillNormalizedEmails();
  });

  afterEach(async () => {
    if (db?.isInitialized) await db.destroy();
  });

  it('throttles requests and consumes a current hash exactly once', async () => {
    const expiry = new Date(Date.now() + 15 * 60_000);
    expect(
      await users.setPasswordResetToken('65010001', 'a'.repeat(64), expiry),
    ).toBe(true);
    expect(
      await users.setPasswordResetToken('65010001', 'b'.repeat(64), expiry),
    ).toBe(false);
    expect(
      await users.hasValidPasswordResetToken('a'.repeat(64), new Date()),
    ).toBe(true);
    expect(
      await users.hasValidPasswordResetToken('b'.repeat(64), new Date()),
    ).toBe(false);
    const newHash = await bcrypt.hash('new-password', 10);
    const attempts = await Promise.all([
      users.consumePasswordResetToken('a'.repeat(64), newHash, new Date()),
      users.consumePasswordResetToken('a'.repeat(64), newHash, new Date()),
    ]);
    expect(attempts.sort()).toEqual([false, true]);
    const student = await users.findStudentByEmail('student@kmitl.ac.th');
    expect(student?.password_version).toBe(1);
    expect(student?.reset_token_hash).toBeNull();
    expect(await bcrypt.compare('new-password', student!.password)).toBe(true);
  });

  it('rejects expired hashes without changing the password', async () => {
    const repo = db.getRepository(Student);
    await repo.update('65010001', {
      reset_token_hash: 'c'.repeat(64),
      reset_token_expires_at: new Date(Date.now() - 1000),
    });
    expect(
      await users.hasValidPasswordResetToken('c'.repeat(64), new Date()),
    ).toBe(false);
    expect(
      await users.consumePasswordResetToken(
        'c'.repeat(64),
        await bcrypt.hash('new-password', 10),
        new Date(),
      ),
    ).toBe(false);
    const student = await repo.findOneByOrFail({ stu_id: '65010001' });
    expect(await bcrypt.compare('old-password', student.password)).toBe(true);
    expect(student.password_version).toBe(0);
  });

  it('finds an existing mixed-case email after backfill', async () => {
    const repo = db.getRepository(Student);
    await repo.update('65010001', {
      email: 'Student@kmitl.ac.th',
      email_normalized: null,
    });
    await users.backfillNormalizedEmails();
    expect(
      (await users.findStudentByEmail('student@kmitl.ac.th'))?.stu_id,
    ).toBe('65010001');
  });
});
