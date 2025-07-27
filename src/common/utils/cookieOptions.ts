import { CookieOptions } from 'express';

export const cookieOption: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV == 'production',
  domain: process.env.NODE_ENV == 'production' ? process.env.COOKIE_DOMAIN : '',
};
