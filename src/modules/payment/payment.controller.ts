import { Controller, Post, Body, Logger } from '@nestjs/common';
import {
  MidtransWebhookPayload,
  PaymentService,
  PaymentStatusResponse,
} from './payment.service';
import { CreatePayment } from './payment.dto';

@Controller('payment')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(private readonly paymentService: PaymentService) {}

  @Post('')
  async createPayment(@Body() paymentData: CreatePayment) {
    try {
      const paymentUrl =
        await this.paymentService.createTransaction(paymentData);
      return {
        message: 'success createPayment',
        data: {
          url: paymentUrl,
        },
      };
    } catch (error) {
      this.logger.error('Error creating payment: ', error);
      throw new Error('Error creating payment: ' + error.message);
    }
  }

  @Post('webhook')
  async webhookTest(
    @Body() body: MidtransWebhookPayload,
  ): Promise<PaymentStatusResponse> {
    try {
      if (body.order_id.startsWith('payment_notif_test')) {
        return { message: `Payment for order ${body.order_id} is successful` };
      }
      const isValidSignature = this.paymentService.validateSignature(body);

      if (!isValidSignature) {
        this.logger.warn('Invalid signature received');
        throw new Error('Invalid signature');
      }

      const paymentStatus = await this.paymentService.handlePaymentStatus(body);
      return paymentStatus;
    } catch (error) {
      this.logger.error('Error processing webhook: ', error);
      throw new Error('Error processing webhook: ' + error.message);
    }
  }
}
