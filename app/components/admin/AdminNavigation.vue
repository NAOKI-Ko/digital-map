<script setup lang="ts">
defineEmits<{
  navigate: []
}>()

const route = useRoute()
const { logout, user } = useAuth()
const isLoggingOut = ref(false)

const navigation = [
  {
    label: 'ダッシュボード',
    to: '/admin/dashboard',
  },
]

function isActive(to: string) {
  return route.path === to || route.path.startsWith(`${to}/`)
}

async function handleLogout() {
  isLoggingOut.value = true

  try {
    await logout()
  }
  finally {
    isLoggingOut.value = false
  }
}
</script>

<template>
  <div class="flex h-full flex-col bg-stone-900 text-white">
    <div class="border-b border-white/10 px-6 py-6">
      <NuxtLink to="/admin/dashboard" class="block" @click="$emit('navigate')">
        <span class="block text-xs font-semibold tracking-[0.22em] text-terracotta-300">
          DIGITAL MAP
        </span>
        <span class="mt-1 block text-lg font-bold">
          マップ管理
        </span>
      </NuxtLink>
    </div>

    <nav class="flex-1 px-3 py-5" aria-label="管理画面メニュー">
      <NuxtLink
        v-for="item in navigation"
        :key="item.to"
        :to="item.to"
        class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition"
        :class="isActive(item.to)
          ? 'bg-white text-stone-900 shadow-sm'
          : 'text-stone-300 hover:bg-white/10 hover:text-white'"
        @click="$emit('navigate')"
      >
        <svg
          class="size-5 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          aria-hidden="true"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 12 12 3l9 9" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M5.5 10.5V21h13V10.5M9 21v-6h6v6" />
        </svg>
        {{ item.label }}
      </NuxtLink>
    </nav>

    <div class="border-t border-white/10 p-4">
      <p class="truncate px-2 text-xs text-stone-400">
        ログイン中
      </p>
      <p class="mt-1 truncate px-2 text-sm font-medium text-stone-100">
        {{ user?.email }}
      </p>
      <button
        type="button"
        :disabled="isLoggingOut"
        class="mt-4 flex w-full items-center justify-center rounded-lg border border-white/15 px-3 py-2 text-sm font-medium text-stone-200 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
        @click="handleLogout"
      >
        {{ isLoggingOut ? 'ログアウト中…' : 'ログアウト' }}
      </button>
    </div>
  </div>
</template>
