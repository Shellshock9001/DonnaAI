import { LayoutContent } from '@/shared/components/LayoutContent'
import { AuthGuard } from '@/shared/auth'
import { Generate } from '@/features/generate'

export default function GeneratePage(): JSX.Element {
  return (
    <AuthGuard>
      <LayoutContent>
        <Generate />
      </LayoutContent>
    </AuthGuard>
  )
}

