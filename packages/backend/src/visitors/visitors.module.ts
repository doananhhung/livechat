
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Visitor } from '../database/entities/visitor.entity';
import { VisitorsService } from './visitors.service';
import { VisitorsController } from './visitors.controller';
import { RealtimeSessionModule } from '../realtime-session/realtime-session.module';
import { VisitorsEventHandler } from './visitors-event.handler';

@Module({
  imports: [
    TypeOrmModule.forFeature([Visitor]),
    RealtimeSessionModule
  ],
  providers: [VisitorsService, VisitorsEventHandler],
  controllers: [VisitorsController],
  exports: [VisitorsService],
})
export class VisitorsModule {}

