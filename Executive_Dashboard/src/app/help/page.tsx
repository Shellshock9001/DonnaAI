import { LayoutContent } from '@/shared/components/LayoutContent'
import { AuthGuard } from '@/shared/auth'
import { Help } from '@/features/help'

export default function HelpPage(): JSX.Element {
  return (
    <AuthGuard>
      <LayoutContent>
        <Help />
      </LayoutContent>
    </AuthGuard>
  )
}

