import type { Provider } from '@/types'

/** Sign-in providers in the order they are offered */
export const PROVIDERS: Provider[] = ['google', 'github']

export const PROVIDER_NAMES: Record<Provider, string> = {
  google: 'Google',
  github: 'GitHub',
}
