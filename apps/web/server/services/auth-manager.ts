import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcrypt';
import { OTP } from 'otplib';
import QRCode from 'qrcode';
import { env } from '../lib/env.js';
import type { JwtPayload } from '../types';

const accessSecret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);
const refreshSecret = new TextEncoder().encode(env.JWT_REFRESH_SECRET);

const otp = new OTP({ strategy: 'totp' });

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function generateAccessToken(payload: JwtPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setExpirationTime(env.JWT_ACCESS_EXPIRATION)
    .setIssuedAt()
    .sign(accessSecret);
}

export async function generateRefreshToken(payload: JwtPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setExpirationTime(env.JWT_REFRESH_EXPIRATION)
    .setIssuedAt()
    .sign(refreshSecret);
}

export async function verifyAccessToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, accessSecret);
  return {
    sub: payload.sub as string,
    email: payload.email as string,
    role: payload.role as 'USER' | 'ADMIN',
  };
}

export async function verifyRefreshToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, refreshSecret);
  return {
    sub: payload.sub as string,
    email: payload.email as string,
    role: payload.role as 'USER' | 'ADMIN',
  };
}

export function generateTotpSecret(): string {
  return otp.generateSecret();
}

export async function verifyTotp(token: string, secret: string): Promise<boolean> {
  const result = await otp.verify({ token, secret });
  return result.valid;
}

export async function generateQrCode(email: string, secret: string): Promise<string> {
  const otpauthUrl = otp.generateURI({ secret, label: email, issuer: env.TOTP_APP_NAME });
  return QRCode.toDataURL(otpauthUrl);
}

export function generateTokens(payload: JwtPayload): Promise<[string, string]> {
  return Promise.all([generateAccessToken(payload), generateRefreshToken(payload)]);
}
