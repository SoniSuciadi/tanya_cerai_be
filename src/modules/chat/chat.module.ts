import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { AiAgentModule } from '../aiagent/aiagent.module';
import { AiModule } from '../ai/ai.module';
import { UserModule } from '../user/user.module';

@Module({
  providers: [ChatService],
  controllers: [ChatController],
  imports: [AiAgentModule, AiModule, UserModule],
})
export class ChatModule {}
