export default defineNitroPlugin(() => {
  const config = useRuntimeConfig()
  if (config.deploymentEnvironment !== 'production') return
  validateProductionBaseUrl('PUBLIC_BASE_URL', config.publicBaseUrl)
  validateProductionBaseUrl('ADMIN_BASE_URL', config.adminBaseUrl)
})
