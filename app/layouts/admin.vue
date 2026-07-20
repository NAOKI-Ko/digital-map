<script setup lang="ts">
const route = useRoute()
const isNavigationOpen = ref(false)

watch(
  () => route.fullPath,
  () => {
    isNavigationOpen.value = false
  },
)
</script>

<template>
  <div class="min-h-screen bg-stone-100">
    <aside class="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
      <AdminNavigation />
    </aside>

    <header class="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-stone-200 bg-white px-4 lg:hidden">
      <NuxtLink to="/admin/dashboard" class="font-bold text-stone-900">
        マップ管理
      </NuxtLink>
      <button
        type="button"
        class="rounded-lg p-2 text-stone-700 hover:bg-stone-100"
        aria-label="メニューを開く"
        @click="isNavigationOpen = true"
      >
        <svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
          <path stroke-linecap="round" d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>
    </header>

    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-200"
      leave-to-class="opacity-0"
    >
      <div v-if="isNavigationOpen" class="fixed inset-0 z-40 lg:hidden">
        <button
          type="button"
          class="absolute inset-0 bg-stone-950/50"
          aria-label="メニューを閉じる"
          @click="isNavigationOpen = false"
        />
        <aside class="relative h-full w-72 max-w-[85vw] shadow-2xl">
          <AdminNavigation @navigate="isNavigationOpen = false" />
        </aside>
      </div>
    </Transition>

    <main class="min-h-screen lg:pl-64">
      <div class="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <slot />
      </div>
    </main>
  </div>
</template>
