import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { WsAuthService } from './services/ws-auth.service';
import { GatewayEventListener } from './gateway.event-listener';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../users/user.module';
import { WsJwtAuthGuard } from './guards/ws-jwt-auth.guard';
import { EventProducerModule } from '../event-producer/event-producer.module';
import { RealtimeSessionModule } from '../realtime-session/realtime-session.module';
import { ProjectModule } from '../projects/project.module';
import { InboxModule } from '../inbox/inbox.module';
import { VisitorsModule } from '../visitors/visitors.module';
import { ActionsModule } from '../actions/actions.module';

@Module({
  imports: [
    AuthModule,
    UserModule,
    EventProducerModule,
    RealtimeSessionModule,
    ProjectModule,
    InboxModule,
    VisitorsModule,
    ActionsModule,
  ],
  providers: [
    EventsGateway,
    WsJwtAuthGuard,
    GatewayEventListener,
    WsAuthService,
  ],
  exports: [EventsGateway],
})
export class GatewayModule {}
