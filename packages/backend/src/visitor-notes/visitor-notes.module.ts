import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VisitorNotesService } from './visitor-notes.service';
import { VisitorNotesController } from './visitor-notes.controller';
import { VisitorNote } from './entities/visitor-note.entity';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [TypeOrmModule.forFeature([VisitorNote]), GatewayModule],
  controllers: [VisitorNotesController],
  providers: [VisitorNotesService],
})
export class VisitorNotesModule {}
