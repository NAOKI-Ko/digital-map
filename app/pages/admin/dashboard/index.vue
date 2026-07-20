<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})

useHead({ title: 'ダッシュボード | デジタルマップ' })

const { user } = useUserSession()
</script>

<template>
  <div>
    <header>
      <p class="text-sm font-medium text-terracotta-700">
        ダッシュボード
      </p>
      <h1 class="mt-1 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
        おかえりなさい
      </h1>
      <p class="mt-2 text-sm text-stone-600">
        {{ user?.email }} でログインしています。
      </p>
    </header>

    <section class="mt-8 rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-14 text-center shadow-sm">
      <div class="mx-auto flex size-14 items-center justify-center rounded-2xl bg-terracotta-50 text-terracotta-700">
        <svg class="size-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" />
          <path stroke-linecap="round" d="M9 3v15M15 6v15" />
        </svg>
      </div>
      <h2 class="mt-5 text-lg font-bold text-stone-900">
        マップ管理の準備ができました
      </h2>
      <p class="mx-auto mt-2 max-w-lg text-sm leading-6 text-stone-600">
        次のステップで、作成したマップの一覧と新規作成機能がここに表示されます。
      </p>
    </section>
  </div>
</template>
