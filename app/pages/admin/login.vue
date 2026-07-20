<script setup lang="ts">
import { useForm } from 'vee-validate'
import { loginSchema } from '~~/shared/schemas/auth'

definePageMeta({ layout: false })

useHead({ title: '管理者ログイン | デジタルマップ' })

const route = useRoute()
const { loggedIn, login } = useAuth()
const submitError = ref('')
const isSubmitting = ref(false)

const { defineField, errors, handleSubmit, setErrors } = useForm({
  initialValues: {
    email: '',
    password: '',
  },
})

const [email, emailAttrs] = defineField('email')
const [password, passwordAttrs] = defineField('password')

const redirectTarget = computed(() => {
  const redirect = route.query.redirect

  if (
    typeof redirect === 'string'
    && redirect.startsWith('/admin/')
    && !redirect.startsWith('//')
    && redirect !== '/admin/login'
  ) {
    return redirect
  }

  return '/admin/dashboard'
})

if (loggedIn.value) {
  await navigateTo(redirectTarget.value)
}

const submit = handleSubmit(async (values) => {
  submitError.value = ''
  const result = loginSchema.safeParse(values)

  if (!result.success) {
    const fieldErrors = result.error.flatten().fieldErrors
    setErrors({
      email: fieldErrors.email?.[0],
      password: fieldErrors.password?.[0],
    })
    return
  }

  isSubmitting.value = true

  try {
    await login(result.data)
    await navigateTo(redirectTarget.value)
  }
  catch {
    submitError.value = 'メールアドレスまたはパスワードが正しくありません。'
  }
  finally {
    isSubmitting.value = false
  }
})
</script>

<template>
  <main class="grid min-h-screen bg-stone-100 lg:grid-cols-2">
    <section class="hidden bg-stone-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
      <p class="text-sm font-semibold tracking-[0.2em] text-terracotta-300">
        DIGITAL MAP
      </p>
      <div class="max-w-lg">
        <p class="text-sm font-medium text-terracotta-300">
          地域の案内を、もっと身近に
        </p>
        <h1 class="mt-4 text-4xl font-bold leading-tight">
          イラスト地図とスポットを<br>かんたんに管理できます。
        </h1>
        <p class="mt-5 leading-7 text-stone-300">
          地図の更新や公開設定を、専門知識なしで行える管理画面です。
        </p>
      </div>
      <p class="text-sm text-stone-400">
        Digital Map Platform
      </p>
    </section>

    <section class="flex items-center justify-center px-6 py-12">
      <div class="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm ring-1 ring-stone-200 sm:p-10">
        <div class="lg:hidden">
          <p class="text-sm font-semibold tracking-[0.2em] text-terracotta-600">
            DIGITAL MAP
          </p>
        </div>
        <h2 class="mt-5 text-2xl font-bold text-stone-900 lg:mt-0">
          管理者ログイン
        </h2>
        <p class="mt-2 text-sm leading-6 text-stone-600">
          登録済みのメールアドレスとパスワードを入力してください。
        </p>

        <form class="mt-8 space-y-5" @submit="submit">
          <div>
            <label for="email" class="text-sm font-medium text-stone-800">
              メールアドレス
            </label>
            <input
              id="email"
              v-model="email"
              v-bind="emailAttrs"
              type="email"
              autocomplete="username"
              class="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2.5 text-stone-900 outline-none transition focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-100"
              :class="{ 'border-red-500': errors.email }"
            >
            <p v-if="errors.email" class="mt-1.5 text-sm text-red-600">
              {{ errors.email }}
            </p>
          </div>

          <div>
            <label for="password" class="text-sm font-medium text-stone-800">
              パスワード
            </label>
            <input
              id="password"
              v-model="password"
              v-bind="passwordAttrs"
              type="password"
              autocomplete="current-password"
              class="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2.5 text-stone-900 outline-none transition focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-100"
              :class="{ 'border-red-500': errors.password }"
            >
            <p v-if="errors.password" class="mt-1.5 text-sm text-red-600">
              {{ errors.password }}
            </p>
          </div>

          <div
            v-if="submitError"
            role="alert"
            class="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {{ submitError }}
          </div>

          <button
            type="submit"
            :disabled="isSubmitting"
            class="w-full rounded-lg bg-terracotta-600 px-4 py-3 font-semibold text-white transition hover:bg-terracotta-700 focus:outline-none focus:ring-2 focus:ring-terracotta-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {{ isSubmitting ? '確認中…' : 'ログイン' }}
          </button>
        </form>

        <p class="mt-6 text-center text-sm text-stone-500">
          パスワードをお忘れの場合は、運営担当者へお問い合わせください。
        </p>
      </div>
    </section>
  </main>
</template>
