import { HttpException, HttpStatus } from '@nestjs/common';
export class Error400BadRequest extends HttpException {
  constructor(message: string) {
    super(
      {
        error: 'Bad Request',
        message: message,
        statusCode: HttpStatus.BAD_REQUEST,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
