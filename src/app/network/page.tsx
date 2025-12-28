import { LayoutContent } from '@/shared/components/LayoutContent'
import { AuthGuard } from '@/shared/auth'
import { Network } from '@/features/network'

export default function NetworkPage(): JSX.Element {
  return (
    <AuthGuard>
      <LayoutContent>
        <Network />
      </LayoutContent>
    </AuthGuard>
  )
}

