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
            content: `buat judul singkat maks 4 kata untuk pertanyaan ini (ini pertanyaan scope perceraian) dalam bentuk JSON dengan property title :${inputText}`,
          },
          {
            role: 'user',
            content: `buat judul singkat maks 4 kata untuk pertanyaan ini (ini pertanyaan scope perceraian) dalam bentuk JSON dengan property title :${inputText}`,
          },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      });
      const answer = completion.choices[0].message.content ?? '';
      return answer?.includes('title')
        ? JSON.parse(answer).title
        : answer?.toString();
    } catch (error) {
      throw new Error(
        'Error while communicating with OpenAI: ' + error.message,
      );
    }
  }
}
