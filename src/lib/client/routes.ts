// Public pages
export const ROUTES = {
  HOME: '/',
  ADMIN_LOGIN: '/admin/login', 
  WORKER_LOGIN: '/worker/login',
  ADMIN_REGISTER: '/admin/register',
  VERIFY_EMAIL: '/verify-email',
  SET_PASSWORD: '/set-password',
  INVITE: '/invite',

  // Admin routes
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    WORKERS: '/admin/dashboard/workers',
    WORKERS_INVITE: '/admin/dashboard/workers/invite',
    WORKERS_DETAIL: (id: string) => `/admin/dashboard/workers/${id}`,
    APPLICATIONS: '/admin/dashboard/applications',
    APPLICATIONS_PENDING: '/admin/dashboard/applications/pending',
    APPLICATIONS_DETAIL: (id: string) => `/admin/dashboard/applications/${id}`,
    PAYMENTS: '/admin/payments',
    PAYMENTS_PENDING: '/admin/payments/pending',
    TIMESHEETS: '/admin/timesheets',
    TIMESHEETS_LOGS: '/admin/timesheets/logs',
    ANALYTICS: '/admin/analytics',
    SETTINGS: '/admin/settings',
    SETTINGS_CRYPTO: '/admin/settings/crypto',
    SETTINGS_EXCHANGE: '/admin/settings/exchange',
    HASH_SEARCH: '/admin/dashboard/hash-search',
  },

  // Worker routes
  WORKER: {
    DASHBOARD: '/worker/dashboard',
    DASHBOARD_APPLICATIONS: '/worker/dashboard/applications',
    TIMESHEETS: '/worker/timesheets',
    TIMESHEETS_EDIT: (id: string) => `/worker/timesheets/edit/${id}`,
    PAYMENTS: '/worker/payments',
    PAYMENTS_REQUEST: '/worker/payments/request',
    PAYMENTS_HISTORY: '/worker/payments/history',
    WALLET: '/worker/wallet',
    PROFILE: '/worker/profile',
    SETTINGS: '/worker/settings',
    COMPANY: '/worker/company',
    HASH_SEARCH: '/worker/dashboard/hash-search',
  },
} as const;
