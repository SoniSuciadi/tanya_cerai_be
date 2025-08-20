import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { DatabaseService } from 'src/common/database/database.service';
import { Message } from '../chat/chat.response.dto';
import { WebsocketGateway } from '../websocket/websocket.gateway';

@Injectable()
export class AiAgentService {
  private readonly url: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly databaseService: DatabaseService,
    private wsGateaway: WebsocketGateway,
  ) {
    this.url = process.env.N8N_ORIGIN || '';
  }

  async sendMessageToWebhook(sessionId: string, chatInput: string) {
    const payload = {
      sessionId,
      action: 'sendMessage',
      chatInput,
    };

    try {
      await this.httpService
        .post(this.url, payload, {
          headers: {
            'Content-Type': 'application/json',
          },
        })
        .toPromise();
    } catch (error) {
      throw new Error(
        'Error while sending message to webhook: ' + error.message,
      );
    }
  }

  async getUserIdBySession(id: string) {
    const userId = await this.databaseService.db.one<{ id: string }>(
      'SELECT user_id AS "id" from sessions Where id=$<id>',
      { id },
    );
    return userId?.id;
  }
  async sendMessageWithDelay(
    userId: string,
    message: string,
    sessionId: string,
    delay: number,
  ) {
    return new Promise<void>(async (resolve) => {
      const data = await this.databaseService.insertOne<Message>({
        table: 'chats',
        data: {
          sessionId: sessionId,
          text: message,
          sender: 'consultant',
        },
        returning: [
          'id',
          'text AS "content"',
          'sender',
          'created_at AS "timestamp"',
          'session_id AS "sessionId"',
        ],
      });
      setTimeout(() => {
        this.wsGateaway.sendToUser({
          userId,
          event: 'new-message-response',
          message: `new message response for session ${sessionId}`,
          data: data,
        });
        resolve();
      }, delay);
    });
  }
  async sendMessagesWithRandomDelay(
    userId: string,
    messages: string[],
    sessionId: string,
  ) {
    for (let i = 0; i < messages.length; i++) {
      const delay = Math.random() * (3000 - 1000) + 1000;

      await this.sendMessageWithDelay(
        userId,
        messages[i],
        sessionId,
        delay * i,
      );
    }
  }
}
