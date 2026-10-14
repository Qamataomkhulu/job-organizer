import crypto from "node:crypto";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ENV } from "./_core/env";

function client() {
  if (!ENV.s3Bucket || !ENV.s3AccessKeyId || !ENV.s3SecretAccessKey) throw new Error("S3 storage is not configured");
  return new S3Client({ region: ENV.s3Region, endpoint: ENV.s3Endpoint || undefined, forcePathStyle: Boolean(ENV.s3Endpoint), credentials: { accessKeyId: ENV.s3AccessKeyId, secretAccessKey: ENV.s3SecretAccessKey } });
}
function normalizeKey(key: string) {
  const normalized = key.replace(/^\/+/, "");
  if (!normalized || normalized.includes("..")) throw new Error("Invalid storage key");
  return normalized;
}
function appendHashSuffix(relKey: string) {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  return lastDot === -1 ? `${relKey}_${hash}` : `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}
export async function storagePut(relKey: string, data: Buffer | Uint8Array | string, contentType = "application/octet-stream") {
  const key = appendHashSuffix(normalizeKey(relKey));
  await client().send(new PutObjectCommand({ Bucket: ENV.s3Bucket, Key: key, Body: typeof data === "string" ? Buffer.from(data) : data, ContentType: contentType, ServerSideEncryption: "AES256" }));
  return { key, url: `/manus-storage/${key}` };
}
export async function storageGet(relKey: string) { const key = normalizeKey(relKey); return { key, url: `/manus-storage/${key}` }; }
export async function storageGetSignedUrl(relKey: string) {
  const key = normalizeKey(relKey);
  return getSignedUrl(client(), new GetObjectCommand({ Bucket: ENV.s3Bucket, Key: key }), { expiresIn: 300 });
}
