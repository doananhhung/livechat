import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invitation, Project, ProjectMember } from '@social-commerce/shared';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { AuthModule } from '../auth/auth.module';
import { PublicProjectController } from './public-project.controller';
import { InvitationService } from './invitation.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, ProjectMember, Invitation]),
    AuthModule,
  ],
  providers: [ProjectService, InvitationService],
  controllers: [ProjectController, PublicProjectController],
  exports: [ProjectService],
})
export class ProjectModule {}
