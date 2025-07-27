import { Injectable } from '@nestjs/common';
import { UserPayload } from 'src/common/middlewares/authentication.middleware';

@Injectable()
export class UserService {
  user: UserPayload;

  set(user: UserPayload) {
    this.user = user;
  }
  get() {
    return this.user;
  }
}
