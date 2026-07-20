export default defineNuxtConfig({
  compatibilityDate: '2026-07-01',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', 'nuxt-auth-utils'],
  css: ['~/assets/css/tailwind.css'],
  typescript: {
    typeCheck: true,
  },
  runtimeConfig: {
    session: {
      maxAge: 60 * 60 * 24 * 7,
    },
  },
})
