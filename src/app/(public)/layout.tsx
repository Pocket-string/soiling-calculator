import { MarketingNav } from '@/features/marketing/components/MarketingNav'
import { Footer } from '@/components/public/Footer'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <MarketingNav />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
