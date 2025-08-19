import { Module } from '@nestjs/common';
import { AiAgentService } from './aiagent.service';
import { HttpModule } from '@nestjs/axios';
import { AiagentController } from './aiagent.controller';
import { SseModule } from '../sse/sse.module';

@Module({
  imports: [HttpModule, SseModule],
  providers: [AiAgentService],
  exports: [AiAgentService],
  controllers: [AiagentController],
})
export class AiAgentModule {}
