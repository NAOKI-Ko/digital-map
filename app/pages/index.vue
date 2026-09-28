<script setup lang="ts">
const { loggedIn, ready, fetch } = useUserSession()
if (!ready.value) await fetch()
</script>

<template>
  <main class="flex min-h-screen items-center justify-center bg-stone-50 px-6">
    <section class="max-w-xl text-center">
      <p class="text-sm font-semibold tracking-widest text-terracotta-600">
        DIGITAL MAP
      </p>
      <h1 class="mt-4 text-4xl font-bold tracking-tight text-stone-900">
        地域の魅力を、ひとつの地図に。
      </h1>
      <p class="mt-5 text-base leading-7 text-stone-600">
        イラストマップとスポット情報を管理できるデジタルマップ作成プラットフォームです。
      </p>
      <nav aria-label="管理画面への入口" class="mt-8 flex flex-wrap items-center justify-center gap-3">
        <NuxtLink v-if="loggedIn" to="/admin/dashboard" class="inline-flex min-h-11 items-center justify-center rounded-lg bg-terracotta-600 px-6 py-3 font-semibold text-white hover:bg-terracotta-700">管理画面へ</NuxtLink>
        <template v-else>
          <NuxtLink to="/admin/login" class="inline-flex min-h-11 items-center justify-center rounded-lg border border-stone-300 bg-white px-6 py-3 font-semibold text-stone-800 hover:bg-stone-100">ログイン</NuxtLink>
          <NuxtLink to="/signup" class="inline-flex min-h-11 items-center justify-center rounded-lg bg-terracotta-600 px-6 py-3 font-semibold text-white hover:bg-terracotta-700">新規登録</NuxtLink>
        </template>
      </nav>
    </section>
  </main>
</template>
