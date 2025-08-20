import { Injectable, Logger } from '@nestjs/common';
import * as midtransClient from 'midtrans-client';
import * as crypto from 'crypto';
import { CreatePayment } from './payment.dto';
import { DatabaseService } from 'src/common/database/database.service';
import { UserService } from '../user/user.service';
import { SSEStreamService } from '../sse/sse.service';
import * as dayjs from 'dayjs';

export interface MidtransWebhookPayload {
  transaction_type: string;
  transaction_time: string;
  transaction_status: string;
  transaction_id: string;
  status_message: string;
  status_code: string;
  signature_key: string;
  settlement_time: string;
  payment_type: string;
  order_id: string;
  merchant_id: string;
  merchant_cross_reference_id: string;
  issuer: string;
  gross_amount: string; // Keep as string for consistency as it appears to be a string in the payload
  fraud_status: string;
  expiry_time: string;
  currency: string;
  acquirer: string;
}

export interface PaymentStatusResponse {
  message: string;
}

@Injectable()
export class PaymentService {
  private readonly snap: midtransClient.Snap;

  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private databaseService: DatabaseService,
    private userService: UserService,
    private sseService: SSEStreamService,
  ) {
    this.snap = new midtransClient.Snap({
      isProduction: process.env.MIDTRANS_PRODUCTION === 'TRUE',
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.MIDTRANS_CLIENT_KEY,
    });
  }

  validateSignature(payload: MidtransWebhookPayload): boolean {
    // Ensure gross_amount is string
    const grossAmount = String(payload.gross_amount);

    // Concatenate WITHOUT separators (order_id + status_code + gross_amount + serverKey)
    const dataToHash = `${payload.order_id}${payload.status_code}${grossAmount}${process.env.MIDTRANS_SERVER_KEY}`;

    // Log for debugging (optional)
    this.logger.log(`Payload for Hash: ${dataToHash}`);

    // Generate hash using PLAIN SHA512 (not HMAC)
    const hash = crypto.createHash('sha512').update(dataToHash).digest('hex');

    this.logger.log(`Generated Hash: ${hash}`);
    this.logger.log(`Received Signature: ${payload.signature_key}`);

    return hash === payload.signature_key;
  }
  async handlePaymentStatus(
    payload: MidtransWebhookPayload,
  ): Promise<PaymentStatusResponse> {
    const { order_id, transaction_status } = payload;
    this.logger.log(
      `Payment status for order ${order_id}: ${transaction_status}`,
    );
    const orderId = order_id.split('_')[0];
    const order = await this.databaseService.db.oneOrNone<{
      userId: string;
      sessionEnd: string | null;
      session: string | null;
    }>(
      `SELECT
            o.user_id AS "userId",
            p.session,
            u.session_end AS "sessionEnd"
        FROM
            orders o
            LEFT JOIN packages p ON o.package_id = p.id
            LEFT JOIN users u ON u.id=o.user_id
        WHERE o.id = $<orderId>`,
      {
        orderId,
      },
    );

    if (transaction_status === 'settlement') {
      await this.databaseService.db.tx(async (t) => {
        await this.databaseService.updateOne({
          table: 'orders',
          data: {
            paymentStatus: 'settlement',
            paidData: payload,
            paidDate: new Date().toISOString(),
          },
          where: {
            id: orderId,
          },
          transaction: t,
        });

        let newSession = order?.sessionEnd ? dayjs(order?.sessionEnd) : dayjs();

        if (newSession.isBefore(dayjs())) {
          newSession = dayjs();
        }

        if (order?.userId) {
          const [addSessionRaw = 0, unitOfTimeRaw = 'millisecond'] =
            order?.session?.split(' ') ?? [];

          const addSession = Number(addSessionRaw);
          const unitOfTime = unitOfTimeRaw as dayjs.ManipulateType;

          newSession = newSession.add(addSession, unitOfTime);
          await this.databaseService.updateOne({
            table: 'users',
            data: {
              sessionEnd: newSession.toISOString(),
            },
            where: {
              id: order?.userId,
            },
            transaction: t,
          });
          this.sseService.sendMessageToUser(order?.userId, {
            type: 'payment-success',
            message: `Payment for order ${orderId} is successful`,
          });
        }
      });
      return { message: `Payment for order ${orderId} is successful` };
    } else {
      return { message: `Payment for order ${orderId} is not completed` };
    }
  }

  async createTransaction(
    createData: CreatePayment,
    origin: string,
  ): Promise<string> {
    const url = await this.databaseService.db.tx<string>(async (t) => {
      const selectedPackage = await t.oneOrNone<{
        id: string;
        name: string;
        price: number;
      }>(
        `SELECT
            id,
            name,
            price
        FROM
            packages
        WHERE
            name = $<packageName>
        `,
        { packageName: createData.packageName },
      );
      const existingaActiveOrder = await t.oneOrNone<{ paymentUrl: string }>(
        `SELECT payment_url AS "paymentUrl"
        FROM orders 
        WHERE user_id = $<userId>
          AND package_id = $<packageId>
          AND amount = $<pacakgeAmount>
          AND payment_status = 'pending'
          AND created_at >= CURRENT_TIMESTAMP - INTERVAL '20 hours';
    `,
        {
          userId: this.userService.get().id,
          packageId: selectedPackage?.id,
          pacakgeAmount: selectedPackage?.price,
        },
      );
      if (existingaActiveOrder) {
        return existingaActiveOrder.paymentUrl;
      }
      const order = await this.databaseService.insertOne<{ id: string }>({
        table: 'orders',
        data: {
          packageId: selectedPackage?.id,
          userId: this.userService.get().id,
          paymentStatus: 'pending',
          amount: selectedPackage?.price,
        },
        transaction: t,
        returning: ['id'],
      });
      const user = await t.oneOrNone<{
        name: string;
        email: string;
        phoneNumber: string;
      }>(
        `SELECT
            name,
            email,
            phone_number AS "phoneNumber"
        FROM
            users
        WHERE
            id = $<userId>
        `,
        { userId: this.userService.get().id },
      );

      const transactionData = {
        transaction_details: {
          order_id: `${order?.id}_TaCer`,
          gross_amount: selectedPackage?.price,
        },
        credit_card: {
          secure: true,
        },
        callbacks: {
          finish: origin,
        },
        customer_details: {
          first_name: user?.name,
          last_name: user?.name,
          email: user?.email,
          phone: user?.phoneNumber,
        },
      };
      const chargeResponse = await this.snap.createTransaction(transactionData);
      await this.databaseService.updateOne({
        table: 'orders',
        data: {
          paymentUrl: chargeResponse.redirect_url,
        },
        where: {
          id: order?.id || '',
        },
        transaction: t,
      });
      return chargeResponse.redirect_url;
    });
    return url;
  }
}
