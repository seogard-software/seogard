import { randomBytes, createHash } from 'node:crypto'
import * as OTPAuth from 'otpauth'

const ISSUER = 'Seogard'
const BACKUP_CODE_COUNT = 8

export function generateTotpSecret(): string {
  const secret = new OTPAuth.Secret({ size: 20 })
  return secret.base32
}

export function getTotpUri(secret: string, email: string): string {
  const totp = new OTPAuth.TOTP({
    issuer: ISSUER,
    label: email,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  })
  return totp.toString()
}

export function verifyTotpCode(secret: string, code: string): boolean {
  const totp = new OTPAuth.TOTP({
    issuer: ISSUER,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  })
  const delta = totp.validate({ token: code, window: 1 })
  return delta !== null
}

export function generateBackupCodes(): string[] {
  const codes: string[] = []
  for (let i = 0; i < BACKUP_CODE_COUNT; i++) {
    codes.push(randomBytes(4).toString('hex'))
  }
  return codes
}

export function hashBackupCode(code: string): string {
  return createHash('sha256').update(code).digest('hex')
}
