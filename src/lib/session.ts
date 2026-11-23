import { auth } from '@/lib/auth'

export async function getAuthSession() {
  return auth()
}
