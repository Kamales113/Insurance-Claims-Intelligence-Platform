// Service layer — currently stubbed for future FastAPI integration.

export async function login(_email: string, _password: string) {
  throw new Error('authService.login is not implemented yet')
}

export async function logout() {
  return Promise.resolve()
}

export async function getCurrentUser() {
  return null
}
