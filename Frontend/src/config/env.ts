export const env = {
  // Same-origin default for production (served behind Nginx which proxies /api).
  // Local dev overrides this via .env.development (http://localhost:8080/api/v1).
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
  appName: import.meta.env.VITE_APP_NAME ?? 'TalentAI',
} as const
