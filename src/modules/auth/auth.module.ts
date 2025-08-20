import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { DatabaseModule } from 'src/common/database/database.module';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  providers: [AuthService],
  controllers: [AuthController],
  exports: [AuthService],
  imports: [UserModule, DatabaseModule, WebsocketModule],
})
export class AuthModule {}
