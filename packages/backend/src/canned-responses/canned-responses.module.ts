import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CannedResponsesService } from './canned-responses.service';
import { CannedResponsesController } from './canned-responses.controller';
import { CannedResponse } from './entities/canned-response.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CannedResponse])],
  controllers: [CannedResponsesController],
  providers: [CannedResponsesService],
})
export class CannedResponsesModule {}
