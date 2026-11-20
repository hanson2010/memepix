export type Env = {
  NEXTAUTH_URL: string
  GOOGLE_CLOUD_PROJECT: string
  GOOGLE_AI_API_KEY: string
  R2_ENDPOINT: string
  R2_ACCESS_KEY_ID: string
  R2_SECRET_ACCESS_KEY: string
  R2_BUCKET_NAME: string
  R2_PUBLIC_URL: string
  NEXTAUTH_SECRET: string
  GITHUB_CLIENT_ID: string
  GITHUB_CLIENT_SECRET: string
  TURNSTILE_SITE_KEY: string
  TURNSTILE_SECRET_KEY: string
}

// Non-sensitive configuration, kept in source. Each value can still be
// overridden by an environment variable of the same name.
const PUBLIC_CONFIG = {
  NEXTAUTH_URL: 'http://localhost:3000',
  GOOGLE_CLOUD_PROJECT: 'memepix',
  R2_ENDPOINT: 'https://96e2c7ef58d5e32531e881d705f36851.r2.cloudflarestorage.com',
  R2_ACCESS_KEY_ID: '85b1237cbf8d52bee5d441bbeab95d4e',
  R2_BUCKET_NAME: 'meme-pictures',
  R2_PUBLIC_URL: 'https://meme-pictures.pythoner.work',
  GITHUB_CLIENT_ID: 'Ov23liIaJxzYgbciamGO',
  TURNSTILE_SITE_KEY: '0x4AAAAAACjCl4OZj1GWMam0',
} satisfies Partial<Env>

const SECRET_KEYS = [
  'GOOGLE_AI_API_KEY',
  'R2_SECRET_ACCESS_KEY',
  'NEXTAUTH_SECRET',
  'GITHUB_CLIENT_SECRET',
  'TURNSTILE_SECRET_KEY',
] as const

type SecretKey = (typeof SECRET_KEYS)[number]
type Secrets = Record<SecretKey, string>

let cachedSecrets: Secrets | null = null

// Sensitive values live in a single Secret Manager secret holding a JSON
// object, exposed to the container as APP_SECRETS. For local development,
// either set APP_SECRETS or set each secret as its own environment variable.
function getSecrets(): Secrets {
  if (cachedSecrets) return cachedSecrets

  let parsed: Partial<Record<SecretKey, unknown>> = {}
  if (process.env.APP_SECRETS) {
    try {
      parsed = JSON.parse(process.env.APP_SECRETS)
    } catch {
      throw new Error('APP_SECRETS is not valid JSON')
    }
  }

  const secrets = {} as Secrets
  for (const key of SECRET_KEYS) {
    const value = parsed[key]
    secrets[key] = typeof value === 'string' && value ? value : process.env[key] || ''
  }
  cachedSecrets = secrets
  return secrets
}

export function getEnv(): Env {
  const pub = Object.fromEntries(
    Object.entries(PUBLIC_CONFIG).map(([key, value]) => [key, process.env[key] || value])
  ) as typeof PUBLIC_CONFIG

  return { ...pub, ...getSecrets() }
}

export function validateEnv(): void {
  const env = getEnv()
  const required: (keyof Env)[] = [
    'GOOGLE_CLOUD_PROJECT',
    'GOOGLE_AI_API_KEY',
    'R2_ENDPOINT',
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY',
    'R2_PUBLIC_URL',
    'NEXTAUTH_SECRET',
    'GITHUB_CLIENT_ID',
    'GITHUB_CLIENT_SECRET',
    'TURNSTILE_SECRET_KEY',
  ]

  const missing = required.filter(key => !env[key])

  if (missing.length > 0) {
    throw new Error(`Missing required configuration: ${missing.join(', ')}`)
  }
}
