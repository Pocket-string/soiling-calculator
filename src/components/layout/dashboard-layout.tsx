import { MainShell } from './MainShell'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return <MainShell>{children}</MainShell>
}
