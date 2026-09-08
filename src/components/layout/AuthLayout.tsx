import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto flex min-h-screen max-w-lg items-center px-4 py-8">
        <div className="w-full">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
