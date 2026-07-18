import crypto from 'node:crypto'

const ITERATIONS = 120000
const KEY_LENGTH = 64
const DIGEST = 'sha512'

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password, storedValue) {
  const [salt, storedHash] = String(storedValue || '').split(':')
  if (!salt || !storedHash) {
    return false
  }

  const candidateHash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString('hex')
  const storedBuffer = Buffer.from(storedHash, 'hex')
  const candidateBuffer = Buffer.from(candidateHash, 'hex')

  if (storedBuffer.length !== candidateBuffer.length) {
    return false
  }

  return crypto.timingSafeEqual(storedBuffer, candidateBuffer)
}
