import { Injectable } from '@nestjs/common';
import { OpenAI } from 'openai';

@Injectable()
export class AiService {
  private openAI: OpenAI;

  constructor() {
    this.openAI = new OpenAI({
      apiKey: process.env.OPEN_API_KEY,
    });
  }

  async generateQuestionTitle(inputText: string): Promise<string> {
    try {
      const completion = await this.openAI.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Buatkan title pendek untuk pertanyaan ini',
          },
          { role: 'user', content: inputText },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      });
      console.log(
        '👻 ~ AiService ~ generateQuestionTitle ~ completion:',
        completion,
      );

      return completion.choices[0].message.content || '';
    } catch (error) {
      throw new Error(
        'Error while communicating with OpenAI: ' + error.message,
      );
    }
  }
}
