const TOKEN_KEY = 'talentai.token'
const ROLE_KEY = 'talentai.role'
const ROLES_KEY = 'talentai.roles'
const EMAIL_KEY = 'talentai.email'

export const tokenStorage = {
  getToken: (): string | null => localStorage.getItem(TOKEN_KEY),
  getRole: (): string | null => localStorage.getItem(ROLE_KEY),
  getRoles: (): string[] => {
    const raw = localStorage.getItem(ROLES_KEY)
    if (!raw) return []
    try {
      return JSON.parse(raw) as string[]
    } catch {
      return []
    }
  },
  getEmail: (): string | null => localStorage.getItem(EMAIL_KEY),

  setSession: (params: { token: string; role: string; roles: string[]; email: string }): void => {
    localStorage.setItem(TOKEN_KEY, params.token)
    localStorage.setItem(ROLE_KEY, params.role)
    localStorage.setItem(ROLES_KEY, JSON.stringify(params.roles))
    localStorage.setItem(EMAIL_KEY, params.email)
  },

  clear: (): void => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(ROLE_KEY)
    localStorage.removeItem(ROLES_KEY)
    localStorage.removeItem(EMAIL_KEY)
  },
}
