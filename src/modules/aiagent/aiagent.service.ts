import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { DatabaseService } from 'src/common/database/database.service';
import { Message } from '../chat/chat.response.dto';

@Injectable()
export class AiAgentService {
  private readonly url: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly databaseService: DatabaseService,
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
  async addMessageToDatabase(
    sessionId: string,
    messages: string[],
  ): Promise<Message[]> {
    try {
      const agentChats = await this.databaseService.insertBulk<Message>({
        table: 'chats',
        data: messages.map((item) => ({
          sessionId,
          text: item,
          sender: 'consultant',
        })),
        returning: [
          'id',
          'text AS "content"',
          'sender',
          'created_at AS "timestamp"',
          'session_id AS "sessionId"',
        ],
      });
      console.log(
        'object ~ AiAgentService ~ addMessageToDatabase ~ agentChats:',
        agentChats,
      );
      return agentChats || [];
    } catch (error) {
      throw new Error(
        'Error while adding message to database: ' + error.message,
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
}
