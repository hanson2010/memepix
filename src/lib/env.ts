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

export function getEnv(): Env {
  return {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    GOOGLE_CLOUD_PROJECT: process.env.GOOGLE_CLOUD_PROJECT || '',
    GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY || '',
    R2_ENDPOINT: process.env.R2_ENDPOINT || '',
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID || '',
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY || '',
    R2_BUCKET_NAME: process.env.R2_BUCKET_NAME || 'memepix-images',
    R2_PUBLIC_URL: process.env.R2_PUBLIC_URL || '',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || '',
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID || '',
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET || '',
    TURNSTILE_SITE_KEY: process.env.TURNSTILE_SITE_KEY || '',
    TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY || '',
  }
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
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}
