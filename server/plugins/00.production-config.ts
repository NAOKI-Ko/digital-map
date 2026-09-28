import { assertDeploymentOrigins } from '../../shared/utils/origin'

export default defineNitroPlugin(() => {
  const config = useRuntimeConfig()
  const environment = process.env.DEPLOYMENT_ENV || config.deploymentEnvironment
  if (environment === 'development' || environment === 'test') return
  const publicOrigin = configuredPublicBaseUrl()
  const adminOrigin = configuredAdminBaseUrl()
  assertDeploymentOrigins(environment, { adminOrigin, publicOrigin }, {
    adminOrigin: process.env.ADMIN_BASE_URL,
    publicOrigin: process.env.PUBLIC_BASE_URL,
  })
  if (environment !== 'production') return
  validateProductionBaseUrl('PUBLIC_BASE_URL', publicOrigin)
  validateProductionBaseUrl('ADMIN_BASE_URL', adminOrigin)
})
