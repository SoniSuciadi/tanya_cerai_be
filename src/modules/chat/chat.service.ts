import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/common/database/database.service';
import { ChatListQueryDto, ChatQueryDto, SendMessageDto } from './chat.dto';
import { ChatResponseDto, Message } from './chat.response.dto';

@Injectable()
export class ChatService {
  constructor(private databaseService: DatabaseService) {}

  sendMessage(sendMessageDto: SendMessageDto) {
    console.log(sendMessageDto);
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
