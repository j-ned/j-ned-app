import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { env, s3PublicUrl } from '../lib/env.js';

const s3 = new S3Client({
  endpoint: env.S3_ENDPOINT,
  region: env.S3_REGION,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY,
    secretAccessKey: env.S3_SECRET_KEY,
  },
  forcePathStyle: true,
});

type UploadOptions = {
  bucket: string;
  key: string;
  body: Buffer | Uint8Array;
  contentType: string;
};

export async function uploadFile({ bucket, key, body, contentType }: UploadOptions): Promise<void> {
  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
  }));
}

export async function deleteFile(bucket: string, key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  }));
}

export async function getFile(bucket: string, key: string) {
  const response = await s3.send(new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  }));
  return response;
}

export async function listFiles(bucket: string, prefix?: string) {
  const response = await s3.send(new ListObjectsV2Command({
    Bucket: bucket,
    Prefix: prefix,
  }));
  return response.Contents ?? [];
}

export function getPublicUrl(publicBaseUrl: string, key: string): string {
  return `${publicBaseUrl}/${key}`;
}

export const buckets = {
  cv: { bucket: env.S3_CV_BUCKET, publicUrl: s3PublicUrl(env.S3_CV_BUCKET) },
  projects: { bucket: env.S3_PROJECTS_BUCKET, publicUrl: s3PublicUrl(env.S3_PROJECTS_BUCKET) },
  about: { bucket: env.S3_ABOUT_BUCKET, publicUrl: s3PublicUrl(env.S3_ABOUT_BUCKET) },
};
