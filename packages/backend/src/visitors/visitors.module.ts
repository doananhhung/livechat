import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Visitor } from '../database/entities/visitor.entity';
import { VisitorsService } from './visitors.service';
import { VisitorsController } from './visitors.controller';
import { GatewayModule } from '../gateway/gateway.module'; // Assuming GatewayModule exports EventsGateway

@Module({
  imports: [TypeOrmModule.forFeature([Visitor]), GatewayModule],
  providers: [VisitorsService],
  controllers: [VisitorsController],
  exports: [VisitorsService],
})
export class VisitorsModule {}
