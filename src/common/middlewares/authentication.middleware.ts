import {
  Injectable,
  NestMiddleware,
  Next,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { JsonWebTokenError, JwtPayload } from 'jsonwebtoken';
import * as jwt from 'jsonwebtoken';
import { AuthService } from 'src/modules/auth/auth.service';
import { UserService } from 'src/modules/user/user.service';
export type UserPayload = {
  id: string;
  name: string;
  email: string;
};

declare module 'express-serve-static-core' {
  interface Request {
    user?: UserPayload;
  }
}

@Injectable()
export class AuthenticationMiddleware implements NestMiddleware {
  constructor(
    private authService: AuthService,
    private userService: UserService,
  ) {}
  async use(
    @Req() req: Request,
    @Res() res: Response,
    @Next() next: NextFunction,
  ) {
    const refreshToken = req.cookies.refresh_token;

    if (!refreshToken) {
      throw new JsonWebTokenError('Missing refresh token');
    }
    const accessToken = req.headers['authorization']?.split(' ')?.[1];

    if (!accessToken) {
      throw new JsonWebTokenError('Missing access token');
    }
    const tokenPayload = this.verifyAccessToken(accessToken);

    if (!tokenPayload?.id) {
      throw new JsonWebTokenError('Invalid token');
    }
    const user = await this.authService.getUserByIdAndRefreshToken(
      tokenPayload.id,
      refreshToken,
    );
    if (!user) {
      throw new JsonWebTokenError('Invalid token');
    }
    this.userService.set(user);
    next();
  }

  verifyAccessToken(accessToken: string) {
    try {
      if (!accessToken) {
        throw 'need_refresh';
      }

      const payload = jwt.verify(
        accessToken,
        process.env.JWT_SECRET_KEY!,
      ) as JwtPayload;

      return payload;
    } catch (error) {
      if (error instanceof JsonWebTokenError || error === 'need_refresh') {
        throw new UnauthorizedException('need_refresh');
      }
    }
  }
}
