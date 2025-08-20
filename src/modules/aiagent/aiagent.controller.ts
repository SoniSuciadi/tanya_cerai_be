import { Body, Controller, Post } from '@nestjs/common';
import { SendMessageDto } from './aiagent.dto';
import { AiAgentService } from './aiagent.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';

@Controller('aiagent')
export class AiagentController {
  constructor(
    private readonly aiAgentService: AiAgentService,
    private wsGateaway: WebsocketGateway,
  ) {}
  @Post('message-response')
  async handleMessageResponse(
    @Body() sendMessageDto: SendMessageDto,
  ): Promise<{ status: string }> {
    const userId = await this.aiAgentService.getUserIdBySession(
      sendMessageDto.sessionId,
    );
    this.wsGateaway.sendToUser({
      userId,
      event: `consultan-typing-${sendMessageDto.sessionId}`,
      message: `new message response for session ${sendMessageDto.sessionId}`,
      data: {
        sessionId: sendMessageDto.sessionId,
        typing: true,
      },
    });
    await this.aiAgentService.sendMessagesWithRandomDelay(
      userId,
      JSON.parse(sendMessageDto.message),
      sendMessageDto.sessionId,
    );
    this.wsGateaway.sendToUser({
      userId,
      event: `consultan-typing-${sendMessageDto.sessionId}`,
      message: `new message response for session ${sendMessageDto.sessionId}`,
      data: {
        sessionId: sendMessageDto.sessionId,
        typing: false,
      },
    });
    return {
      status: 'Message response handled',
    };
  }
}
