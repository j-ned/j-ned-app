import { S3Client } from '@aws-sdk/client-s3';

export type S3Settings = {
  readonly s3Endpoint: string;
  readonly s3Region: string;
  readonly s3AccessKey: string;
  readonly s3SecretKey: string;
};

export type S3Timeouts = {
  readonly connectionTimeout: number;
  readonly requestTimeout: number;
};

// Le SDK ne borne rien par défaut : un stockage bloqué tiendrait la requête, et le verrou du portrait,
// indéfiniment. 30 s couvrent 4 Mo dès ~3 Mbit/s montants ; 3 essais au plus, durée totale bornée.
export const S3_TIMEOUTS: S3Timeouts = {
  connectionTimeout: 5_000,
  requestTimeout: 30_000,
};

export function createS3Client(
  cfg: S3Settings,
  timeouts: S3Timeouts = S3_TIMEOUTS,
): S3Client {
  return new S3Client({
    endpoint: cfg.s3Endpoint,
    region: cfg.s3Region,
    credentials: {
      accessKeyId: cfg.s3AccessKey,
      secretAccessKey: cfg.s3SecretKey,
    },
    forcePathStyle: true, // requis pour MinIO local ; R2 accepte path-style aussi
    requestHandler: {
      connectionTimeout: timeouts.connectionTimeout,
      requestTimeout: timeouts.requestTimeout,
      throwOnRequestTimeout: true,
    },
  });
}
