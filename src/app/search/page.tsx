import { LayoutContent } from '@/shared/components/LayoutContent'
import { AuthGuard } from '@/shared/auth'
import { Search } from '@/features/search'

export default function SearchPage(): JSX.Element {
  return (
    <AuthGuard>
      <LayoutContent>
        <Search />
      </LayoutContent>
    </AuthGuard>
  )
}

