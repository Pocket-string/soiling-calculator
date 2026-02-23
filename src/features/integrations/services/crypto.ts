import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12 // GCM recommended
const TAG_LENGTH = 16

function getEncryptionKey(): Buffer {
  const key = process.env.INTEGRATION_ENCRYPTION_KEY
  if (!key || key.length !== 64) {
    throw new Error('INTEGRATION_ENCRYPTION_KEY must be a 64-char hex string (32 bytes)')
  }
  return Buffer.from(key, 'hex')
}

export function encryptCredentials(data: Record<string, string>): {
  encrypted: string
  iv: string
  tag: string
} {
  const key = getEncryptionKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH })

  const plaintext = JSON.stringify(data)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()

  return {
    encrypted: encrypted.toString('base64'),
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
  }
}

export function decryptCredentials(encrypted: string, iv: string, tag: string): Record<string, string> {
  const key = getEncryptionKey()
  const decipher = createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(iv, 'hex'),
    { authTagLength: TAG_LENGTH },
  )
  decipher.setAuthTag(Buffer.from(tag, 'hex'))

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encrypted, 'base64')),
    decipher.final(),
  ])

  return JSON.parse(decrypted.toString('utf8'))
}
