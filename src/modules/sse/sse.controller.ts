import { Controller, Get, Req, Res } from '@nestjs/common';
import { Response, Request } from 'express';
import { SSEStreamService } from './sse.service';

@Controller('stream')
export class SSEStreamController {
  constructor(private readonly sseStreamService: SSEStreamService) {}

  @Get()
  async handleStream(@Req() req: Request, @Res() res: Response) {
    return this.sseStreamService.handleStream(req, res);
  }
}
