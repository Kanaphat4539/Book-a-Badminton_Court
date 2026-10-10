import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WelcomeContent } from './entities/welcome-content.entity';
import { WelcomeService } from './welcome.service';
import { WelcomeController } from './welcome.controller';

@Module({
  imports: [TypeOrmModule.forFeature([WelcomeContent])],
  controllers: [WelcomeController],
  providers: [WelcomeService],
  exports: [WelcomeService],
})
export class WelcomeModule {}
