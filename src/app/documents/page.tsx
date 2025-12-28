import { LayoutContent } from '@/shared/components/LayoutContent'
import { AuthGuard } from '@/shared/auth'
import { Documents } from '@/features/documents'

export default function DocumentsPage(): JSX.Element {
  return (
    <AuthGuard>
      <LayoutContent>
        <Documents />
      </LayoutContent>
    </AuthGuard>
  )
}

