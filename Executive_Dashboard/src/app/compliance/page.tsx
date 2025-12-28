import { LayoutContent } from '@/shared/components/LayoutContent'
import { AuthGuard } from '@/shared/auth'
import { Compliance } from '@/features/compliance'

export default function CompliancePage(): JSX.Element {
  return (
    <AuthGuard>
      <LayoutContent>
        <Compliance />
      </LayoutContent>
    </AuthGuard>
  )
}

