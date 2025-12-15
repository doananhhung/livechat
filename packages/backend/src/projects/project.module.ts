import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invitation, Project, ProjectMember } from '@social-commerce/shared';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { AuthModule } from '../auth/auth.module';
import { PublicProjectController } from './public-project.controller';
import { InvitationService } from './invitation.service';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, ProjectMember, Invitation]),
    AuthModule,
    MailModule,
  ],
  providers: [ProjectService, InvitationService],
  controllers: [ProjectController, PublicProjectController],
  exports: [ProjectService, InvitationService],
})
export class ProjectModule {}
