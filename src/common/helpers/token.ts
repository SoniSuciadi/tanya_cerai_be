import * as jwt from 'jsonwebtoken';

type TokenPayload = {
  id: string;
};

export const genRefreshToken = (payload: TokenPayload) => {
  return jwt.sign(payload, process.env.JWT_SECRET_KEY!);
};

export const genAccessToken = (payload: TokenPayload) => {
  return jwt.sign(payload, process.env.JWT_SECRET_KEY!, {
    expiresIn: '1h',
  });
};
