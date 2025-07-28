import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatQueryDto, SendMessageDto } from './chat.dto';

@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService) {}
  @Get('chat-room')
  async chatRoom(@Query() query: ChatQueryDto) {
    const data = await this.chatService.chatRoom(query);
    const objResult = {
      totalItems: +data?.[0]?.count,
      page: +query.page,
      perPage: query.rowsPerPage,
      items: data,
    };
    return {
      message: 'chatRoom success',
      data: objResult,
    };
  }
  @Get('/:id')
  async chatList(@Param('id') id: string, @Query() query: ChatQueryDto) {
    const data = await this.chatService.chatList(id, query);
    const objResult = {
      totalItems: +data?.[0]?.count,
      page: +query.page,
      perPage: query.rowsPerPage,
      items: data,
    };
    return {
      message: 'chatList success',
      data: objResult,
    };
  }
  @Post('send-message')
  async login(@Body() sendMessageDto: SendMessageDto) {
    await this.chatService.sendMessage(sendMessageDto);

    return {
      message: 'login success',
    };
  }
}
