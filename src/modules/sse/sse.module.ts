import { Module } from '@nestjs/common';
import { SSEStreamController } from './sse.controller';
import { SSEStreamService } from './sse.service';
@Module({
  controllers: [SSEStreamController],
  providers: [SSEStreamService],
  exports: [SSEStreamService],
})
export class SseModule {}
