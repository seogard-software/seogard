import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// Stockage objet S3-compatible (Cloudflare R2 en Cloud, MinIO/S3 en self-hosted).
// Sert à stocker les rapports figés (.md/.pdf) hors de Mongo : Mongo ne garde que la clé.
// Config par env ; si absente → stockage désactivé (la feature rapport-fichier est juste off).
//
//   STORAGE_S3_ENDPOINT     ex. https://<account>.r2.cloudflarestorage.com
//   STORAGE_S3_REGION       ex. auto (R2) | eu-west-3 (S3)
//   STORAGE_S3_BUCKET
//   STORAGE_S3_ACCESS_KEY_ID
//   STORAGE_S3_SECRET_ACCESS_KEY

let client: S3Client | null = null
export function getObjectStorage(): { client: S3Client, bucket: string } | null {
  const endpoint = process.env.STORAGE_S3_ENDPOINT
  const accessKeyId = process.env.STORAGE_S3_ACCESS_KEY_ID
  const secretAccessKey = process.env.STORAGE_S3_SECRET_ACCESS_KEY
  const bucket = process.env.STORAGE_S3_BUCKET || ''
  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) return null

  if (!client) {
    client = new S3Client({
      region: process.env.STORAGE_S3_REGION || 'auto',
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true, // R2 / MinIO
    })
  }
  return { client, bucket }
}

/** True si le stockage objet est configuré (sinon les downloads par crawl sont indisponibles). */
export function isObjectStorageEnabled(): boolean {
  return getObjectStorage() !== null
}

export async function putObject(key: string, body: Buffer | string, contentType: string, contentDisposition?: string): Promise<void> {
  const s3 = getObjectStorage()
  if (!s3) throw new Error('Object storage not configured')
  await s3.client.send(new PutObjectCommand({
    Bucket: s3.bucket, Key: key, Body: body, ContentType: contentType, ContentDisposition: contentDisposition,
  }))
}

/** URL signée de téléchargement (le web ne manipule pas les octets). Le nom de fichier vient du
 *  ContentDisposition posé à l'upload. expiresIn en secondes. */
export async function getObjectSignedUrl(key: string, expiresIn = 300): Promise<string> {
  const s3 = getObjectStorage()
  if (!s3) throw new Error('Object storage not configured')
  return getSignedUrl(s3.client, new GetObjectCommand({ Bucket: s3.bucket, Key: key }), { expiresIn })
}

export async function deleteObjects(keys: string[]): Promise<void> {
  if (keys.length === 0) return
  const s3 = getObjectStorage()
  if (!s3) return
  // L'API S3 DeleteObjects plafonne à 1 000 clés par appel → découpage en lots.
  for (let i = 0; i < keys.length; i += 1000) {
    await s3.client.send(new DeleteObjectsCommand({
      Bucket: s3.bucket,
      Delete: { Objects: keys.slice(i, i + 1000).map(Key => ({ Key })) },
    }))
  }
}
