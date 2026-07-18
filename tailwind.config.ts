import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
  content: [
    './app/components/**/*.{vue,js,ts}',
    './app/layouts/**/*.vue',
    './app/pages/**/*.vue',
    './app/app.vue',
  ],
  theme: {
    extend: {
      colors: {
        terracotta: {
          50: '#fdf5f3',
          100: '#fbe8e3',
          200: '#f7d4ca',
          300: '#efb4a5',
          400: '#e38972',
          500: '#d45f43',
          600: '#c7401f',
          700: '#a9361c',
          800: '#8c311f',
          900: '#742e21',
          950: '#3f150e',
        },
      },
    },
  },
}
