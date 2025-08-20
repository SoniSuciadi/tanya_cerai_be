import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { DatabaseService } from 'src/common/database/database.service';
import { LoginDto, RegisterDto } from './auth.dto';
import { compareHash, genHash } from 'src/common/helpers/bcrypt';
import { genAccessToken, genRefreshToken } from 'src/common/helpers/token';
import { v4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(private databaseService: DatabaseService) {}

  async loginService({ email: loginEmail, password }: LoginDto) {
    const user = await this.getUserByEmail(loginEmail);
    if (!user) {
      throw new UnauthorizedException('Email atau password salah');
    }
    if (!compareHash(password, user.password)) {
      throw new ForbiddenException('Email atau password salah');
    }
    const { id }: { id: string } = user;

    const refreshToken = genRefreshToken({ id });

    await this.updateRefreshTokenByUserId(refreshToken, id);
    const accessToken = genAccessToken({ id });

    return {
      data: {
        accessToken,
      },
      refreshToken,
      id,
    };
  }
  getUserByEmail(email: string) {
    const query = `SELECT id, name, email, password FROM users WHERE email ~~* $<email>`;
    return this.databaseService.db.oneOrNone(query, { email });
  }

  getUserByRefreshToken(refreshToken: string) {
    const query = `SELECT id from users where refresh_token = $<refreshToken>`;
    return this.databaseService.db.oneOrNone(query, {
      refreshToken,
    });
  }

  updateRefreshTokenByUserId(refreshToken: string, userId: string) {
    this.databaseService.updateOne({
      table: 'users',
      data: {
        refreshToken,
      },
      where: {
        id: userId,
      },
    });
  }
  getUserByIdAndRefreshToken(userId: string, refreshToken: string) {
    const query = `SELECT id, name, email, session_end AS "sessionEnd" FROM users WHERE id = $<userId> AND refresh_token = $<refreshToken>`;
    return this.databaseService.db.oneOrNone(query, {
      userId,
      refreshToken,
    });
  }
  clearUserRefreshToken(refreshToken: string) {
    return this.databaseService.updateOne({
      table: 'users',
      data: {
        refreshToken: null,
      },
      where: {
        refreshToken,
      },
    });
  }
  async registerService({
    name,
    email,
    password,
    phoneNumber,
  }: RegisterDto): Promise<string> {
    const userId = v4();
    await this.databaseService.insertOne({
      table: 'users',
      data: {
        id: userId,
        name,
        email,
        password: genHash(password),
        phoneNumber,
      },
    });
    return userId;
  }
}
