import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class AiAgentService {
  private readonly url: string;

  constructor(private readonly httpService: HttpService) {
    this.url = process.env.N8N_ORIGIN || '';
  }

  async sendMessageToWebhook(
    sessionId: string,
    chatInput: string,
  ): Promise<string[]> {
    const payload = {
      sessionId,
      action: 'sendMessage',
      chatInput,
    };

    try {
      const response = await this.httpService
        .post(this.url, payload, {
          headers: {
            'Content-Type': 'application/json',
          },
        })
        .toPromise();

      const textResult = response?.data.output;

      if (textResult.startsWith('[')) {
        return JSON.parse(textResult);
      } else {
        return textResult.split('\n').filter((line) => line.trim() !== '');
      }
    } catch (error) {
      throw new Error(
        'Error while sending message to webhook: ' + error.message,
      );
    }
  }
}
