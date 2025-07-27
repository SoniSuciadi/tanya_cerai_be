import { HttpException, HttpStatus } from '@nestjs/common';
export class Error403Forbidden extends HttpException {
  constructor(message: string) {
    super(
      {
        error: 'Forbidden',
        message: message,
        statusCode: HttpStatus.FORBIDDEN,
      },
      HttpStatus.FORBIDDEN,
    );
  }
}
