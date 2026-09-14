import { materialSymbolNames } from './shared/constants/spot'

const materialSymbolsStylesheetUrl = `https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined&icon_names=${materialSymbolNames.join(',')}&display=block`

export default defineNuxtConfig({
  compatibilityDate: '2026-07-01',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', 'nuxt-auth-utils'],
  css: ['~/assets/css/tailwind.css'],
  app: {
    head: {
      link: [
        {
          rel: 'stylesheet',
          href: materialSymbolsStylesheetUrl,
        },
      ],
    },
  },
  typescript: {
    typeCheck: true,
  },
  runtimeConfig: {
    resendApiKey: '',
    mailFrom: '',
    mailReplyTo: '',
    publicBaseUrl: 'http://localhost:3000',
    trustedOrigins: '',
    opsAlertWebhookUrl: '',
    rateLimits: {
      loginFailures: { limit: 5, windowSeconds: 15 * 60 },
      passwordReset: { limit: 5, windowSeconds: 60 * 60 },
      inviteAcceptance: { limit: 10, windowSeconds: 15 * 60 },
    },
    auth: {
      invitationTtlHours: 72,
      passwordResetTtlMinutes: 60,
    },
    uploadDir: '',
    nominatimBaseUrl: 'https://nominatim.openstreetmap.org',
    nominatimUserAgent: 'digital-map-platform/0.1 (self-hosted Nuxt application)',
    session: {
      maxAge: 60 * 60 * 24 * 7,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      },
    },
    public: {
      publicBaseUrl: process.env.PUBLIC_BASE_URL || 'http://localhost:3000',
    },
  },
})
