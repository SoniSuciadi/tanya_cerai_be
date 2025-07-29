import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/common/database/database.service';
import { ChatListQueryDto, ChatQueryDto, SendMessageDto } from './chat.dto';
import { ChatResponseDto, Message } from './chat.response.dto';
import { AiAgentService } from '../aiagent/aiagent.service';
import { AiService } from '../ai/ai.service';
import { UserService } from '../user/user.service';

@Injectable()
export class ChatService {
  constructor(
    private databaseService: DatabaseService,
    private aiAgentService: AiAgentService,
    private aiService: AiService,
    private userService: UserService,
  ) {}

  async sendMessage(
    sendMessageDto: SendMessageDto,
    id: string,
  ): Promise<Message[]> {
    const response = await this.databaseService.db.tx(
      async (tx): Promise<Message[]> => {
        let sessionId = id;
        if (sessionId == 'new') {
          const title = await this.aiService.generateQuestionTitle(
            sendMessageDto.message,
          );

          const newSessionId = await this.databaseService.insertOne<{
            id: string;
          }>({
            table: 'sessions',
            data: {
              title,
              userId: this.userService.get().id,
            },
            transaction: tx,
            returning: ['id'],
          });
          sessionId = newSessionId?.id || id;
        }
        await this.databaseService.insertOne({
          table: 'chats',
          data: {
            sessionId,
            text: sendMessageDto.message,
            sender: 'user',
          },
          transaction: tx,
        });
        const agentResponse = await this.aiAgentService.sendMessageToWebhook(
          sessionId,
          id == 'new'
            ? `${this.userService.user.name} bertanya : "${sendMessageDto.message}"`
            : sendMessageDto.message,
        );

        const agentChats = await this.databaseService.insertBulk<Message>({
          table: 'chats',
          data: agentResponse.map((item) => ({
            sessionId,
            text: item,
            sender: 'consultant',
          })),
          transaction: tx,
          returning: [
            'id',
            'text AS "content"',
            'sender',
            'created_at AS "timestamp"',
            'session_id AS "sessionId"',
          ],
        });
        return agentChats ?? [];
      },
    );

    return response;
  }
  async chatRoom(query: ChatQueryDto): Promise<ChatResponseDto[]> {
    const { search, page, rowsPerPage, order, orderBy } = query;
    const offset = (page - 1) * rowsPerPage;

    const whereQuery: string[] = [`s.deleted_at IS NULL`];
    if (search) {
      whereQuery.push(`(s.title ILIKE '%$<search:value>%')`);
    }

    const q = `WITH LatestChat AS (
      SELECT
        c.id,
        c.session_id,
        c.created_at,
        c.text,
        c.sender,
        row_number() OVER (PARTITION BY c.session_id ORDER BY c.created_at DESC) AS rn
      FROM
        chats c
    )
    SELECT
      COUNT(*) OVER () AS count,
      s.id,
      s.title,
      lc.text AS "lastMessage",
      lc.created_at AS "timestamp"
    FROM
      sessions s
      LEFT JOIN LatestChat lc ON s.id = lc.session_id
        AND lc.rn = 1
    WHERE ${whereQuery.join(' AND ')}
    ORDER BY ${orderBy} ${order}
    LIMIT $<perPage> OFFSET $<offset>
`;
    return await this.databaseService.db.manyOrNone<ChatResponseDto>(q, {
      search,
      perPage: rowsPerPage,
      offset,
    });
  }
  async chatList(id: string, queries: ChatListQueryDto): Promise<Message[]> {
    const { page, rowsPerPage } = queries;
    const offset = (page - 1) * rowsPerPage;

    const whereQuery: string[] = [`deleted_at IS NULL`, `session_id =$<id>`];

    const q = `SELECT
      COUNT(*) OVER () AS count,
      id,
      text AS "content",
      sender,
      session_id AS "sessionId",
      created_at AS "timestamp"
    FROM
      chats
    WHERE ${whereQuery.join(' AND ')}
    ORDER BY created_at DESC
    LIMIT $<perPage> OFFSET $<offset>
`;
    return await this.databaseService.db.manyOrNone<Message>(q, {
      perPage: rowsPerPage,
      offset,
      id,
    });
  }
}
