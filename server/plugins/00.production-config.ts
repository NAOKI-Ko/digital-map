export default defineNitroPlugin(() => {
  if (process.env.NODE_ENV !== 'production') return
  const config = useRuntimeConfig()
  validateProductionBaseUrl('PUBLIC_BASE_URL', config.publicBaseUrl)
  validateProductionBaseUrl('ADMIN_BASE_URL', config.adminBaseUrl)
})
