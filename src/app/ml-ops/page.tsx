import { LayoutContent } from '@/shared/components/LayoutContent'
import { AuthGuard } from '@/shared/auth'
import { MlOps } from '@/features/ml-ops'

export default function MlOpsPage(): JSX.Element {
  return (
    <AuthGuard>
      <LayoutContent>
        <MlOps />
      </LayoutContent>
    </AuthGuard>
  )
}

