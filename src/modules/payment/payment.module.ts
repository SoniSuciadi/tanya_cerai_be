import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { UserModule } from '../user/user.module';

import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  providers: [PaymentService],
  controllers: [PaymentController],
  imports: [UserModule, WebsocketModule],
})
export class PaymentModule {}
