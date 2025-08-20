// websocket.module.ts
import { Module } from '@nestjs/common';
import { WebsocketGateway } from './websocket.gateway';

@Module({
  providers: [WebsocketGateway], // WebsocketGateway sebagai provider
  exports: [WebsocketGateway], // Mengekspor WebsocketGateway agar dapat digunakan di modul lain
})
export class WebsocketModule {}
