import { Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { sendMessageToAllUsersDto } from './dto/sse.dto';
import { Channel, createChannel, createSession } from 'better-sse';

type TokenPayload = {
  id: string;
};

export const clients = new Map<
  number | string,
  Map<string, Channel<Record<string, unknown>, Record<string, unknown>>>
>();
@Injectable()
export class SSEStreamService {
  constructor() {}

  private clientLogger = () => {
    console.log('Client disconnected');
    console.log(`Total users connected: ${clients.size}`);
    let count = 0;
    clients.forEach((sessions) => {
      sessions.forEach(() => {
        count++;
      });
    });
    console.log(`Total clients connected: ${count}`);
  };

  async handleStream(req: Request, res: Response) {
    try {
      const session = await createSession(req, res);
      const refreshToken = req.cookies.refresh_token;
      if (!refreshToken) {
        res.status(401).send('Unauthorized');
        return;
      }

      const user = jwt.decode(refreshToken) as TokenPayload;
      const userId = user?.id;
      if (!userId) {
        res.status(401).send('Unauthorized');
        return;
      }

      if (!clients.has(userId)) {
        clients.set(userId, new Map());
      }
      if (!clients.get(userId)?.has(refreshToken)) {
        clients.get(userId)?.set(refreshToken, createChannel());
      }
      clients.get(userId)?.get(refreshToken)?.register(session);
      console.log(`client userId ${userId} connected`);

      clients.get(user.id)?.forEach((client, token) => {
        if (token !== refreshToken) {
          client.broadcast({
            type: 'another-device-logged-in',
            message: 'Akun anda telah login di tempat lain',
          });
        }
      });

      session.push('SSE Connected');

      req.on('close', () => {
        if (refreshToken) {
          clients.get(userId)?.get(refreshToken)?.deregister(session);
          if (!clients.get(userId)?.get(refreshToken)?.sessionCount) {
            clients.get(userId)?.delete(refreshToken);
          }
          if (!clients.get(userId)?.size) {
            clients.delete(userId);
          }
          if (process.env.NODE_ENV === 'production') {
            this.clientLogger();
          }
        }
      });

      if (process.env.NODE_ENV === 'production') {
        this.clientLogger();
      }
    } catch (error) {
      console.log(error, '=================');
      res.status(500).send('Internal Server Error');
    }
  }

  sendMessageToUser(
    userId: string | number,
    message: sendMessageToAllUsersDto,
  ) {
    const userSessions = clients.get(userId);
    if (userSessions) {
      userSessions.forEach((client) => {
        client.broadcast({
          type: message.type,
          message: message.message,
          data: message.data,
        });
      });
    }
  }

  sendMessageToAllUsers(message: sendMessageToAllUsersDto) {
    console.log(message, clients);
    clients.forEach((userSessions) => {
      userSessions.forEach((client) => {
        client.broadcast({
          type: message.type,
          message: message.message,
        });
      });
    });
  }
}
