import { Module, forwardRef } from '@nestjs/common'; // Added forwardRef
import { TypeOrmModule } from '@nestjs/typeorm';
import { Visitor } from '../database/entities/visitor.entity';
import { VisitorsService } from './visitors.service';
import { VisitorsController } from './visitors.controller';
import { GatewayModule } from '../gateway/gateway.module'; // Assuming GatewayModule exports EventsGateway
import { RealtimeSessionModule } from '../realtime-session/realtime-session.module'; // ADDED

@Module({
  imports: [
    TypeOrmModule.forFeature([Visitor]),
    forwardRef(() => GatewayModule), // Updated to use forwardRef
    RealtimeSessionModule
  ],
  providers: [VisitorsService],
  controllers: [VisitorsController],
  exports: [VisitorsService],
})
export class VisitorsModule {}
