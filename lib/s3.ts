import "server-only";
import { randomUUID } from "node:crypto";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Los vouchers viven en un bucket privado. Solo se leen con URLs firmadas de corta duración.

export const VOUCHER_MAX_BYTES = 5 * 1024 * 1024;
export const VOUCHER_TIPOS = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "application/pdf"];

const EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
  "application/pdf": "pdf",
};

let client: S3Client | null = null;

// Usa las variables estándar AWS_* (sirven para AWS o un servicio compatible como Neon).
// AWS_ENDPOINT_URL_S3 solo hace falta si no es AWS.
function config() {
  const { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_ENDPOINT_URL_S3, S3_BUCKET } = process.env;
  if (!AWS_REGION || !S3_BUCKET || !AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) return null;
  return {
    region: AWS_REGION,
    endpoint: AWS_ENDPOINT_URL_S3 || undefined,
    bucket: S3_BUCKET,
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  };
}

export function s3Configurado() {
  return config() !== null;
}

function s3() {
  const c = config();
  if (!c) throw new Error("S3 no está configurado. Completa las variables AWS_* y S3_BUCKET en el archivo .env.");
  client ??= new S3Client({
    region: c.region,
    endpoint: c.endpoint,
    // Los servicios compatibles suelen requerir rutas tipo endpoint/bucket/clave.
    forcePathStyle: Boolean(c.endpoint),
    credentials: { accessKeyId: c.accessKeyId, secretAccessKey: c.secretAccessKey },
  });
  return { client, bucket: c.bucket };
}

export async function subirVoucher(usuarioId: string, file: File) {
  const { client, bucket } = s3();
  const key = `vouchers/${usuarioId}/${randomUUID()}.${EXTENSION[file.type] ?? "bin"}`;
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: Buffer.from(await file.arrayBuffer()),
      ContentType: file.type,
    }),
  );
  return key;
}

export async function borrarVoucher(key: string) {
  const { client, bucket } = s3();
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

export async function urlVoucher(key: string) {
  const { client, bucket } = s3();
  return getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn: 300 });
}
