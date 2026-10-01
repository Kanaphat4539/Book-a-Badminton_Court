const fs = require('fs');

const specs = {
  'src/users/users.controller.spec.ts': `import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: {} }]
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});`,

  'src/auth/auth.controller.spec.ts': `import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: {} }]
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});`,

  'src/bookings/bookings.controller.spec.ts': `import { Test, TestingModule } from '@nestjs/testing';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';

describe('BookingsController', () => {
  let controller: BookingsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingsController],
      providers: [{ provide: BookingsService, useValue: {} }]
    }).compile();

    controller = module.get<BookingsController>(BookingsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});`,

  'src/courts/courts.controller.spec.ts': `import { Test, TestingModule } from '@nestjs/testing';
import { CourtsController } from './courts.controller';
import { CourtsService } from './courts.service';

describe('CourtsController', () => {
  let controller: CourtsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CourtsController],
      providers: [{ provide: CourtsService, useValue: {} }]
    }).compile();

    controller = module.get<CourtsController>(CourtsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});`,

  'src/users/users.service.spec.ts': `import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Student } from './entities/student.entity';
import { Admin } from './entities/admin.entity';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(Student), useValue: {} },
        { provide: getRepositoryToken(Admin), useValue: {} }
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});`,

  'src/auth/auth.service.spec.ts': `import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: {} },
        { provide: JwtService, useValue: {} }
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});`,

  'src/bookings/bookings.service.spec.ts': `import { Test, TestingModule } from '@nestjs/testing';
import { BookingsService } from './bookings.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Booking } from './entities/booking.entity';
import { Student } from '../users/entities/student.entity';

describe('BookingsService', () => {
  let service: BookingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: getRepositoryToken(Booking), useValue: {} },
        { provide: getRepositoryToken(Student), useValue: {} }
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});`,

  'src/cron/cron.service.spec.ts': `import { Test, TestingModule } from '@nestjs/testing';
import { CronService } from './cron.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Booking } from '../bookings/entities/booking.entity';
import { Student } from '../users/entities/student.entity';

describe('CronService', () => {
  let service: CronService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CronService,
        { provide: getRepositoryToken(Booking), useValue: {} },
        { provide: getRepositoryToken(Student), useValue: {} }
      ],
    }).compile();

    service = module.get<CronService>(CronService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});`,

  'src/courts/courts.service.spec.ts': `import { Test, TestingModule } from '@nestjs/testing';
import { CourtsService } from './courts.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Court } from './entities/court.entity';

describe('CourtsService', () => {
  let service: CourtsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CourtsService,
        { provide: getRepositoryToken(Court), useValue: {} }
      ],
    }).compile();

    service = module.get<CourtsService>(CourtsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});`
};

for (const [file, content] of Object.entries(specs)) {
  fs.writeFileSync(file, content);
  console.log('rewrote', file);
}
