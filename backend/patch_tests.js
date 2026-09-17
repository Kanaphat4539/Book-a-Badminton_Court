const fs = require('fs');
const path = require('path');

const files = {
  'src/users/users.service.spec.ts': {
    imports: `import { getRepositoryToken } from '@nestjs/typeorm';\nimport { Student } from './entities/student.entity';\nimport { Admin } from './entities/admin.entity';`,
    providers: `[UsersService, { provide: getRepositoryToken(Student), useValue: {} }, { provide: getRepositoryToken(Admin), useValue: {} }]`
  },
  'src/users/users.controller.spec.ts': {
    imports: `import { UsersService } from './users.service';`,
    providers: `[{ provide: UsersService, useValue: {} }]`
  },
  'src/auth/auth.service.spec.ts': {
    imports: `import { UsersService } from '../users/users.service';\nimport { JwtService } from '@nestjs/jwt';`,
    providers: `[AuthService, { provide: UsersService, useValue: {} }, { provide: JwtService, useValue: {} }]`
  },
  'src/auth/auth.controller.spec.ts': {
    imports: `import { AuthService } from './auth.service';`,
    providers: `[{ provide: AuthService, useValue: {} }]`
  },
  'src/bookings/bookings.service.spec.ts': {
    imports: `import { getRepositoryToken } from '@nestjs/typeorm';\nimport { Booking } from './entities/booking.entity';\nimport { Student } from '../users/entities/student.entity';`,
    providers: `[BookingsService, { provide: getRepositoryToken(Booking), useValue: {} }, { provide: getRepositoryToken(Student), useValue: {} }]`
  },
  'src/bookings/bookings.controller.spec.ts': {
    imports: `import { BookingsService } from './bookings.service';`,
    providers: `[{ provide: BookingsService, useValue: {} }]`
  },
  'src/cron/cron.service.spec.ts': {
    imports: `import { getRepositoryToken } from '@nestjs/typeorm';\nimport { Booking } from '../bookings/entities/booking.entity';\nimport { Student } from '../users/entities/student.entity';`,
    providers: `[CronService, { provide: getRepositoryToken(Booking), useValue: {} }, { provide: getRepositoryToken(Student), useValue: {} }]`
  },
  'src/courts/courts.service.spec.ts': {
    imports: `import { getRepositoryToken } from '@nestjs/typeorm';\nimport { Court } from './entities/court.entity';`,
    providers: `[CourtsService, { provide: getRepositoryToken(Court), useValue: {} }]`
  },
  'src/courts/courts.controller.spec.ts': {
    imports: `import { CourtsService } from './courts.service';`,
    providers: `[{ provide: CourtsService, useValue: {} }]`
  }
};

for (const [file, config] of Object.entries(files)) {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) continue;
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (!content.includes(config.imports.split('\\n')[0])) {
    content = config.imports + '\\n' + content;
  }
  
  if (content.includes('providers:')) {
    content = content.replace(/providers: \\[[^]*?\\]/, \`providers: \${config.providers}\`);
  } else if (content.includes('controllers:')) {
    content = content.replace(/controllers: \\[(.*?)\\],?/, \`controllers: [$1], providers: \${config.providers},\`);
  }
  
  fs.writeFileSync(filePath, content);
  console.log('patched ' + file);
}
