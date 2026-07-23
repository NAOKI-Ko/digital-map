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
    uploadDir: '',
    nominatimBaseUrl: 'https://nominatim.openstreetmap.org',
    nominatimUserAgent: 'digital-map-platform/0.1 (self-hosted Nuxt application)',
    session: {
      maxAge: 60 * 60 * 24 * 7,
    },
  },
})
