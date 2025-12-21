
import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailController } from './mail.controller';
import { EmailTemplateService } from './email-template.service';

@Module({
  providers: [MailService, EmailTemplateService],
  exports: [MailService, EmailTemplateService],
  controllers: [MailController],
})
export class MailModule {}
