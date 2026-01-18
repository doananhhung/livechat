import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ActionsService } from "./actions.service";
import { ActionsController } from "./actions.controller";
import { ActionTemplate } from "./entities/action-template.entity";
import { ActionSubmission } from "./entities/action-submission.entity";
import { ProjectModule } from "../projects/project.module";
import { Conversation } from "../database/entities/conversation.entity";
import { Message } from "../database/entities/message.entity";
import { Visitor } from "../database/entities/visitor.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ActionTemplate,
      ActionSubmission,
      Conversation,
      Message,
      Visitor,
    ]),
    ProjectModule,
  ],
  controllers: [ActionsController],
  providers: [ActionsService],
  exports: [ActionsService],
})
export class ActionsModule {}

