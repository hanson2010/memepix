import { redirect } from 'next/navigation'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { AccountPanel } from '@/components/AccountPanel'
import { getAuthSession } from '@/lib/session'

interface AccountPageProps {
  searchParams: Promise<{ linked?: string; already?: string; merge?: string; error?: string }>
}

export default async function AccountPage({ searchParams }: AccountPageProps) {
  if (!(await getAuthSession())) {
    redirect('/auth/signin?callbackUrl=/account')
  }
  const params = await searchParams

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Your account</h2>
        <AccountPanel {...params} />
      </main>
      <Footer />
    </div>
  )
}
