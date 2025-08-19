import { Module, RequestMethod } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { APP_FILTER, APP_INTERCEPTOR, MiddlewareBuilder } from '@nestjs/core';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { HandleError } from './common/interceptors/handleError.interceptor';
import { AuthenticationMiddleware } from './common/middlewares/authentication.middleware';
import { UserModule } from './modules/user/user.module';
import { DatabaseModule } from './common/database/database.module';
import { ChatModule } from './modules/chat/chat.module';
import { AiAgentModule } from './modules/aiagent/aiagent.module';
import { AiModule } from './modules/ai/ai.module';
import { PaymentController } from './modules/payment/payment.controller';
import { PaymentService } from './modules/payment/payment.service';
import { PaymentModule } from './modules/payment/payment.module';
import { SseModule } from './modules/sse/sse.module';

@Module({
  imports: [
    AuthModule,
    UserModule,
    DatabaseModule,
    ChatModule,
    AiAgentModule,
    AiModule,
    PaymentModule,
    SseModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HandleError,
    },
    PaymentService,
  ],
  controllers: [PaymentController],
})
export class AppModule {
  configure(consumer: MiddlewareBuilder) {
    consumer
      .apply(AuthenticationMiddleware)
      .exclude(
        {
          path: 'auth/login',
          method: RequestMethod.POST,
        },
        {
          path: 'auth/register',
          method: RequestMethod.POST,
        },
        {
          path: 'auth/refresh-token',
          method: RequestMethod.GET,
        },
        {
          path: 'auth/logout',
          method: RequestMethod.GET,
        },
        {
          path: 'payment/webhook',
          method: RequestMethod.POST,
        },
        {
          path: 'aiagent/message-response',
          method: RequestMethod.POST,
        },
        'stream',
      )
      .forRoutes('*');
  }
}
