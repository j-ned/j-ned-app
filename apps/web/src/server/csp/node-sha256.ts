/// <reference types="node" />
import { createHash } from 'node:crypto';

export const nodeSha256 = (text: string): string =>
  `'sha256-${createHash('sha256').update(text).digest('base64')}'`;
