<script setup lang="ts">
const route = useRoute()
const isNavigationOpen = ref(false)
const sidebarExpanded = useState('admin-sidebar-expanded', () => false)
const menuTrigger = useTemplateRef<HTMLButtonElement>('menuTrigger')
const drawer = useTemplateRef<HTMLElement>('drawer')
let resizeTimer: ReturnType<typeof setTimeout> | null = null

function signalMapResize() {
  if (!import.meta.client) return
  window.dispatchEvent(new CustomEvent('admin-sidebar-resize'))
  requestAnimationFrame(() => window.dispatchEvent(new CustomEvent('admin-sidebar-resize')))
  if (resizeTimer) clearTimeout(resizeTimer)
  resizeTimer = setTimeout(() => window.dispatchEvent(new CustomEvent('admin-sidebar-resize')), 220)
}
function toggleSidebar() { sidebarExpanded.value = !sidebarExpanded.value }
function openDrawer() { isNavigationOpen.value = true }
function closeDrawer(returnFocus = true) {
  if (!isNavigationOpen.value) return
  isNavigationOpen.value = false
  if (returnFocus) nextTick(() => menuTrigger.value?.focus())
}
function handleDrawerKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    closeDrawer()
    return
  }
  if (event.key !== 'Tab' || !drawer.value) return
  const focusable = [...drawer.value.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), select:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])')]
  if (!focusable.length) return
  const first = focusable[0]!
  const last = focusable.at(-1)!
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
}

watch(sidebarExpanded, (value) => {
  if (import.meta.client) localStorage.setItem('adminSidebarExpanded', String(value))
  signalMapResize()
})
watch(isNavigationOpen, async (open) => {
  if (!import.meta.client) return
  document.body.style.overflow = open ? 'hidden' : ''
  if (open) { await nextTick(); drawer.value?.querySelector<HTMLElement>('button, a[href], select')?.focus() }
  signalMapResize()
})
watch(() => route.fullPath, () => { if (isNavigationOpen.value) closeDrawer(false) })

onMounted(() => {
  sidebarExpanded.value = localStorage.getItem('adminSidebarExpanded') === 'true'
  window.addEventListener('resize', signalMapResize)
  signalMapResize()
})
onBeforeUnmount(() => {
  document.body.style.overflow = ''
  window.removeEventListener('resize', signalMapResize)
  if (resizeTimer) clearTimeout(resizeTimer)
})
</script>

<template>
  <div class="min-h-screen bg-stone-50">
    <aside class="fixed inset-y-0 left-0 z-30 hidden overflow-visible transition-[width] duration-200 motion-reduce:transition-none lg:block" :class="sidebarExpanded ? 'w-64' : 'w-[4.5rem]'" @transitionend="signalMapResize">
      <AdminNavigation :expanded="sidebarExpanded" @toggle="toggleSidebar" />
    </aside>

    <header class="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-stone-200 bg-white/95 px-4 backdrop-blur lg:hidden">
      <NuxtLink to="/admin/dashboard" class="flex min-h-11 items-center gap-2 font-bold text-stone-950"><span class="grid size-8 place-items-center rounded-lg bg-terracotta-600 text-xs font-black text-white">D</span>マップ管理</NuxtLink>
      <button ref="menuTrigger" type="button" class="grid size-11 place-items-center rounded-lg text-stone-700 hover:bg-stone-100" aria-label="管理メニューを開く" aria-controls="mobile-admin-navigation" :aria-expanded="isNavigationOpen" @click="openDrawer">
        <svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path stroke-linecap="round" d="M4 7h16M4 12h16M4 17h16" /></svg>
      </button>
    </header>

    <Transition enter-active-class="transition-opacity duration-200 motion-reduce:transition-none" enter-from-class="opacity-0" leave-active-class="transition-opacity duration-150 motion-reduce:transition-none" leave-to-class="opacity-0">
      <div v-if="isNavigationOpen" class="fixed inset-0 z-50 lg:hidden" @keydown="handleDrawerKeydown">
        <button type="button" class="absolute inset-0 bg-stone-950/55" aria-label="管理メニューを閉じる" tabindex="-1" @click="closeDrawer()" />
        <aside id="mobile-admin-navigation" ref="drawer" role="dialog" aria-modal="true" aria-label="管理メニュー" class="relative h-full w-72 max-w-[88vw] shadow-2xl">
          <button type="button" class="absolute right-3 top-3 z-10 grid size-11 place-items-center rounded-lg text-stone-300 hover:bg-white/10 hover:text-white" aria-label="管理メニューを閉じる" @click="closeDrawer()">
            <svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path stroke-linecap="round" d="m6 6 12 12M18 6 6 18" /></svg>
          </button>
          <AdminNavigation mobile expanded @navigate="closeDrawer" />
        </aside>
      </div>
    </Transition>

    <main class="min-h-screen transition-[padding] duration-200 motion-reduce:transition-none" :class="sidebarExpanded ? 'lg:pl-64' : 'lg:pl-[4.5rem]'" :inert="isNavigationOpen || undefined" @transitionend="signalMapResize">
      <div class="mx-auto w-full max-w-[90rem] px-4 py-6 sm:px-6 lg:px-8 lg:py-8"><slot /></div>
    </main>
  </div>
</template>
