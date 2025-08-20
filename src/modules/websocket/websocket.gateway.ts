import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';
import { Injectable } from '@nestjs/common';

import * as dotenv from 'dotenv';
dotenv.config();
export interface EventData {
  userId?: string;
  message: string;
  data?: unknown;
  event: string;
}
@WebSocketGateway({
  cors: {
    origin: process.env.FE_ORIGIN,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    credentials: true,
  },
})
@Injectable()
export class WebsocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private userSockets: Map<string, string> = new Map();

  handleConnection(client: Socket) {
    const token = client.handshake.headers.cookie
      ?.split('refresh_token=')[1]
      ?.split(';')[0];

    if (token) {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET_KEY!,
      ) as jwt.JwtPayload;
      const userId = decoded.id;

      this.userSockets.set(userId, client.id);
      console.log(`User ${userId} connected with socket ${client.id}`);
    }
  }

  handleDisconnect(client: Socket) {
    for (const [userId, socketId] of this.userSockets) {
      if (socketId === client.id) {
        this.userSockets.delete(userId);
        console.log(`User ${userId} disconnected`);
      }
    }
  }

  sendToUser(eventData: EventData) {
    if (!eventData.userId) {
      return;
    }
    const socketId = this.userSockets.get(eventData.userId);
    if (socketId) {
      this.server.to(socketId).emit(eventData.event, {
        message: eventData.message,
        data: eventData.data,
      });
    } else {
      console.log('User not connected');
    }
  }

  sendToAll(eventData: EventData) {
    this.server.emit(eventData.event, {
      message: eventData.message,
      data: eventData.data,
    });
  }
}
