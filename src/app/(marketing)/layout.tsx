import { MarketingNav } from '@/features/marketing/components/MarketingNav'
import { MarketingFooter } from '@/features/marketing/components/MarketingFooter'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <MarketingNav />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  )
}
