export default defineNuxtRouteMiddleware(async (to) => {
  const { fetch, loggedIn, ready } = useUserSession()

  if (!ready.value) {
    await fetch()
  }

  if (!loggedIn.value) {
    return navigateTo({
      path: '/admin/login',
      query: { redirect: to.fullPath },
    })
  }
})
