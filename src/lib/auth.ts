import { createServerFn } from '@tanstack/react-start'
import { deleteCookie, getCookie, setCookie } from '@tanstack/react-start/server'

const SESSION_COOKIE = 'heos_session'
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8

type SessionPayload = {
  email: string
  name: string
  expiresAt: number
}

export type AuthUser = {
  email: string
  name: string
}

type LoginInput = {
  email: string
  password: string
}

function getRequiredEnv(name: string) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} is not configured`)
  }
  return value
}

function base64UrlEncode(input: string) {
  return btoa(input)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '')
}

function base64UrlDecode(input: string) {
  const padded = input.padEnd(input.length + ((4 - (input.length % 4)) % 4), '=')
  return atob(padded.replaceAll('-', '+').replaceAll('_', '/'))
}

function toHex(buffer: ArrayBuffer) {
  return [...new Uint8Array(buffer)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

async function sha256Hex(value: string) {
  const data = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return toHex(digest)
}

async function hmacSha256Hex(secret: string, value: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(value),
  )
  return toHex(signature)
}

function safeEqual(left: string, right: string) {
  if (left.length !== right.length) {
    return false
  }

  let diff = 0
  for (let index = 0; index < left.length; index += 1) {
    diff |= left.charCodeAt(index) ^ right.charCodeAt(index)
  }
  return diff === 0
}

async function createSessionToken(payload: SessionPayload) {
  const body = base64UrlEncode(JSON.stringify(payload))
  const signature = await hmacSha256Hex(getRequiredEnv('HEOS_SESSION_SECRET'), body)
  return `${body}.${signature}`
}

async function readSessionToken(token: string | undefined) {
  if (!token) {
    return null
  }

  const [body, signature] = token.split('.')
  if (!body || !signature) {
    return null
  }

  const expectedSignature = await hmacSha256Hex(
    getRequiredEnv('HEOS_SESSION_SECRET'),
    body,
  )

  if (!safeEqual(signature, expectedSignature)) {
    return null
  }

  try {
    const payload = JSON.parse(base64UrlDecode(body)) as SessionPayload
    if (!payload.email || !payload.name || payload.expiresAt < Date.now()) {
      return null
    }
    return {
      email: payload.email,
      name: payload.name,
    }
  } catch {
    return null
  }
}

async function verifyAdminCredentials(input: LoginInput) {
  const adminEmail = getRequiredEnv('HEOS_ADMIN_EMAIL').toLowerCase()
  const passwordHash = getRequiredEnv('HEOS_ADMIN_PASSWORD_HASH').toLowerCase()
  const inputEmail = input.email.trim().toLowerCase()
  const inputPasswordHash = await sha256Hex(input.password)

  return (
    safeEqual(inputEmail, adminEmail) &&
    safeEqual(inputPasswordHash, passwordHash)
  )
}

export const getCurrentUser = createServerFn({
  method: 'GET',
}).handler(async () => {
  return readSessionToken(getCookie(SESSION_COOKIE))
})

export const signIn = createServerFn({
  method: 'POST',
})
  .inputValidator((input: LoginInput) => input)
  .handler(async ({ data }) => {
    const isValid = await verifyAdminCredentials(data)
    if (!isValid) {
      return {
        ok: false,
        message: '账号或密码错误',
      }
    }

    const email = data.email.trim().toLowerCase()
    const token = await createSessionToken({
      email,
      name: email,
      expiresAt: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
    })

    setCookie(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS,
    })

    return {
      ok: true,
      message: '登录成功',
    }
  })

export const signOut = createServerFn({
  method: 'POST',
}).handler(async () => {
  deleteCookie(SESSION_COOKIE, {
    path: '/',
  })
  return {
    ok: true,
  }
})

