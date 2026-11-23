import { redirect } from 'next/navigation'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { SignInOptions } from '@/components/SignInOptions'
import { getAuthSession } from '@/lib/session'

interface SignInPageProps {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>
}

/** Only same-site paths are allowed as the destination after sign-in */
function safeRedirect(callbackUrl: string | undefined): string {
  return callbackUrl?.startsWith('/') && !callbackUrl.startsWith('//') ? callbackUrl : '/'
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { error, callbackUrl } = await searchParams

  // Signed in already: a provider error here means linking another identity did not complete
  if (await getAuthSession()) {
    redirect(error ? '/account?error=link' : '/account')
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <SignInOptions error={error} redirectTo={safeRedirect(callbackUrl)} />
      </main>
      <Footer />
    </div>
  )
}
