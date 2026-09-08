import { Shield } from 'lucide-react'

import { PagePlaceholder } from '@/components/layout/PagePlaceholder'
import { APP_NAME } from '@/constants/app'

export default function LoginPage() {
  return (
    <PagePlaceholder
      title="Login"
      description={`Sign in to ${APP_NAME}`}
    >
      <div className="rounded-lg border bg-card p-8 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-lg bg-primary/10">
          <Shield className="size-6 text-primary" aria-hidden="true" />
        </div>
        <p className="text-sm text-muted-foreground">
          Authentication UI will be implemented in the next milestone.
        </p>
      </div>
    </PagePlaceholder>
  )
}
