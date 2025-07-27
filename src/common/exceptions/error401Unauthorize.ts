import { HttpException, HttpStatus } from '@nestjs/common';
export class Error401Unauthorized extends HttpException {
  constructor(message: string) {
    super(
      {
        error: 'Unautorize',
        message: message,
        statusCode: HttpStatus.UNAUTHORIZED,
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}
