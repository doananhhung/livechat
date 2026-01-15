
import { Module, forwardRef } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../users/user.module';
import { WsJwtAuthGuard } from './guards/ws-jwt-auth.guard';
import { EventProducerModule } from '../event-producer/event-producer.module';
import { RealtimeSessionModule } from '../realtime-session/realtime-session.module';
import { ProjectModule } from '../projects/project.module';
import { InboxModule } from '../inbox/inbox.module'; // Import InboxModule
import { VisitorsModule } from '../visitors/visitors.module'; // ADDED

@Module({
  imports: [
    AuthModule,
    UserModule,
    EventProducerModule,
    RealtimeSessionModule,
    ProjectModule,
    forwardRef(() => InboxModule), // Use forwardRef to resolve circular dependency
    forwardRef(() => VisitorsModule), // ADDED
  ],
  providers: [EventsGateway, WsJwtAuthGuard],
  exports: [EventsGateway],
})
export class GatewayModule {}
