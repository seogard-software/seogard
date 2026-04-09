import type { H3Event } from 'h3'
import { randomBytes } from 'node:crypto'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import { createLogger } from './logger'
import { LOGGED_IN_COOKIE_NAME } from '~~/shared/utils/constants'

const log = createLogger('web', 'auth')

const SALT_ROUNDS = 12
const ACCESS_TOKEN_EXPIRY = '5m'
const REFRESH_TOKEN_EXPIRY_DAYS = 30

export const AUTH_COOKIE_NAME = 'auth-token'
export const REFRESH_COOKIE_NAME = 'refresh-token'

function getJwtSecret(): string {
  const secret = process.env.NUXT_JWT_SECRET || useRuntimeConfig().jwtSecret
  if (!secret) {
    log.fatal({}, 'JWT_SECRET is not configured')
    throw createError({ statusCode: 500, message: 'Server misconfigured' })
  }
  return secret
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateAccessToken(userId: string): string {
  return jwt.sign({ userId }, getJwtSecret(), { expiresIn: ACCESS_TOKEN_EXPIRY })
}

export function verifyAccessToken(token: string): { userId: string } | null {
  try {
    const payload = jwt.verify(token, getJwtSecret()) as { userId: string }
    return { userId: payload.userId }
  }
  catch {
    return null
  }
}

export function generateRefreshTokenValue(): string {
  return randomBytes(48).toString('base64url')
}

const IS_DEV = process.env.NODE_ENV === 'development'

export function setAuthCookies(event: H3Event, accessToken: string, refreshToken: string) {
  setCookie(event, AUTH_COOKIE_NAME, accessToken, {
    httpOnly: true,
    secure: !IS_DEV,
    sameSite: 'lax',
    maxAge: 5 * 60,
    path: '/',
  })

  setCookie(event, REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: !IS_DEV,
    sameSite: 'lax',
    maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60,
    path: '/',
  })

  setCookie(event, LOGGED_IN_COOKIE_NAME, '1', {
    httpOnly: false,
    secure: !IS_DEV,
    sameSite: 'lax',
    maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60,
    path: '/',
  })
}

export function clearAuthCookies(event: H3Event) {
  deleteCookie(event, AUTH_COOKIE_NAME, { path: '/' })
  deleteCookie(event, REFRESH_COOKIE_NAME, { path: '/' })
  deleteCookie(event, LOGGED_IN_COOKIE_NAME, { path: '/' })
}

export function getRefreshTokenExpiresAt(): Date {
  const date = new Date()
  date.setDate(date.getDate() + REFRESH_TOKEN_EXPIRY_DAYS)
  return date
}

export function requireAuth(event: H3Event): string {
  if (!event.context.auth?.userId) {
    throw createError({ statusCode: 401, message: 'Non authentifie' })
  }
  return event.context.auth.userId
}

export function requireValidId(event: H3Event, param = 'id'): string {
  const id = getRouterParam(event, param)

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw createError({ statusCode: 400, message: 'ID invalide' })
  }

  return id
}

// Kept for backward compat with generateToken calls
export const generateToken = generateAccessToken
