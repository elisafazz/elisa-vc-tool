import { notFound } from 'next/navigation'
import { readSpace, listCompanies } from '@/lib/store'
import SpaceView from './SpaceView'

export const dynamic = 'force-dynamic'

export default async function SpacePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const space = readSpace(slug)
  if (!space) notFound()

  const companies = listCompanies(space.id).sort(
    (a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
  )

  return <SpaceView space={space} initialCompanies={companies} />
}
