export type JwtPayload = {
  sub: string;
  email: string;
  role: 'USER' | 'ADMIN';
};

export type AuthUser = JwtPayload;

declare module 'hono' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface ContextVariableMap {
    user: AuthUser;
  }
}
