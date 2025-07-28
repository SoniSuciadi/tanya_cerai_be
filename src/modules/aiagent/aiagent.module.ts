import { Module } from '@nestjs/common';
import { AiAgentService } from './aiagent.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [AiAgentService],
  exports: [AiAgentService],
})
export class AiAgentModule {}
