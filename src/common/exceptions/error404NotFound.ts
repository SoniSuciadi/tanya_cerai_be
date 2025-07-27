import { HttpException, HttpStatus } from '@nestjs/common';
export class Error404NotFound extends HttpException {
  constructor(message: string) {
    super(
      {
        error: 'Not Found',
        message: message,
        statusCode: HttpStatus.NOT_FOUND,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}
