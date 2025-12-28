import { LayoutContent } from '@/shared/components/LayoutContent'
import { AuthGuard } from '@/shared/auth'
import { Dashboard } from '@/features/dashboard'

export default function HomePage(): JSX.Element {
  return (
    <AuthGuard>
      <LayoutContent>
        <Dashboard />
      </LayoutContent>
    </AuthGuard>
  )
}

