import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { UserModule } from '../user/user.module';
import { SseModule } from '../sse/sse.module';

@Module({
  providers: [PaymentService],
  controllers: [PaymentController],
  imports: [UserModule, SseModule],
})
export class PaymentModule {}
