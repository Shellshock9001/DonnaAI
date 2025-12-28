import { LayoutContent } from '@/shared/components/LayoutContent'
import { AuthGuard } from '@/shared/auth'
import { Settings } from '@/features/settings'

export default function SettingsPage(): JSX.Element {
  return (
    <AuthGuard>
      <LayoutContent>
        <Settings />
      </LayoutContent>
    </AuthGuard>
  )
}

