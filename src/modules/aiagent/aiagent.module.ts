import { Module } from '@nestjs/common';
import { AiAgentService } from './aiagent.service';
import { HttpModule } from '@nestjs/axios';
import { AiagentController } from './aiagent.controller';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [HttpModule, WebsocketModule],
  providers: [AiAgentService],
  exports: [AiAgentService],
  controllers: [AiagentController],
})
export class AiAgentModule {}
