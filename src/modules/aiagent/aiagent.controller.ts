import { Body, Controller, Post } from '@nestjs/common';
import { SendMessageDto } from './aiagent.dto';
import { AiAgentService } from './aiagent.service';
import { Message } from '../chat/chat.response.dto';
import { SSEStreamService } from '../sse/sse.service';

@Controller('aiagent')
export class AiagentController {
  constructor(
    private readonly aiAgentService: AiAgentService,
    private sseService: SSEStreamService,
  ) {}
  @Post('message-response')
  async handleMessageResponse(
    @Body() sendMessageDto: SendMessageDto,
  ): Promise<{ status: string; data: Message[] }> {
    const messages = await this.aiAgentService.addMessageToDatabase(
      sendMessageDto.sessionId,
      JSON.parse(sendMessageDto.message),
    );
    const userId = await this.aiAgentService.getUserIdBySession(
      sendMessageDto.sessionId,
    );
    await this.sseService.sendMessageToUser(userId, {
      type: 'new-message-response',
      message: 'new message response for session ' + sendMessageDto.sessionId,
      data: messages,
    });
    return {
      status: 'Message response handled',
      data: messages,
    };
  }
}
