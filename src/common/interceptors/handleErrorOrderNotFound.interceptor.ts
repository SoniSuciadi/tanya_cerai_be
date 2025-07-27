import { HttpStatus } from '@nestjs/common';

export class OrderNotFoundError extends Error {
  statusCode: number;
  details: string;

  constructor(message: string, details: string) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = HttpStatus.NOT_FOUND;
    this.details = details;

    // Ensure the name of this error is the same as the class name
    Object.setPrototypeOf(this, new.target.prototype);
    // Capturing the stack trace keeps the reference to your error class
    Error.captureStackTrace(this);
  }
}
