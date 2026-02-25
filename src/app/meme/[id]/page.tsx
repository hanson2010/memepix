import { notFound } from 'next/navigation'
import { getMeme } from '@/lib/meme-service'
import { MemeDetailPage } from './client-page'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function MemePage({ params }: PageProps) {
  const { id } = await params
  const meme = await getMeme(id)

  if (!meme) {
    notFound()
  }

  return <MemeDetailPage meme={meme} />
}
