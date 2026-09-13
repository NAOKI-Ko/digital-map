<script setup lang="ts">
import MapNameForm from '~/components/admin/MapNameForm.vue'
import MediaPicker from '~/components/admin/MediaPicker.vue'
import type { MapNameInput } from '~~/shared/schemas/map'
import type { AdminMapResponse, MapBrandingResponse } from '~~/shared/types/map'
import type { UploadedImage } from '~~/shared/types/upload'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})

const route = useRoute()
const mapId = route.params.mapId as string
const { data, error, status } = await useFetch<AdminMapResponse>(`/api/maps/${mapId}`)
const isSubmitting = ref(false)
const submitError = ref('')
const successMessage = ref('')
const brandingError = ref('')
const brandingMessage = ref('')
const isBrandingSaving = ref(false)
const branding = reactive({
  organizationName: data.value?.map.organizationName ?? '',
  logoUrl: data.value?.map.logoUrl ?? '',
  logoAssetId: data.value?.map.logoAssetId ?? null,
  websiteUrl: data.value?.map.websiteUrl ?? '',
  snsUrl: data.value?.map.snsUrl ?? '',
})

useHead(() => ({
  title: `${data.value?.map.name ?? 'マップ設定'} | デジタルマップ`,
}))

async function saveMap(input: MapNameInput) {
  isSubmitting.value = true
  submitError.value = ''
  successMessage.value = ''

  try {
    const response = await $fetch<AdminMapResponse>(`/api/maps/${mapId}`, {
      method: 'PATCH',
      body: input,
    })
    data.value = response
    successMessage.value = 'マップ名を保存しました。'
  }
  catch {
    submitError.value = 'マップ名を保存できませんでした。もう一度お試しください。'
  }
  finally {
    isSubmitting.value = false
  }
}

function useUploadedLogo(image: UploadedImage) {
  branding.logoUrl = image.url
  branding.logoAssetId = image.assetId
}

async function saveBranding() {
  isBrandingSaving.value = true
  brandingError.value = ''
  brandingMessage.value = ''
  try {
    const response = await $fetch<MapBrandingResponse>(`/api/maps/${mapId}/branding`, {
      method: 'PATCH',
      body: branding,
    })
    Object.assign(branding, Object.fromEntries(
      Object.entries(response.branding).map(([key, value]) => [key, value ?? '']),
    ))
    Object.assign(data.value!.map, response.branding)
    brandingMessage.value = '公開ヘッダーの団体情報を保存しました。'
  }
  catch (error: any) {
    brandingError.value = error?.data?.statusMessage ?? '団体情報を保存できませんでした。入力内容を確認してください。'
  }
  finally {
    isBrandingSaving.value = false
  }
}
</script>

<template>
  <div class="max-w-4xl">
    <NuxtLink to="/admin/dashboard" class="text-sm font-medium text-stone-600 hover:text-stone-900">
      ← マップ一覧に戻る
    </NuxtLink>

    <section v-if="status === 'pending'" class="mt-8 rounded-2xl bg-white p-8 text-sm text-stone-600 shadow-sm">
      マップを読み込んでいます…
    </section>

    <section v-else-if="error || !data" class="mt-8 rounded-2xl border border-red-200 bg-red-50 p-8">
      <h1 class="text-lg font-bold text-red-900">
        マップが見つかりません
      </h1>
      <p class="mt-2 text-sm text-red-700">
        URLを確認するか、マップ一覧へ戻ってください。
      </p>
    </section>

    <template v-else>
      <header class="mt-5">
        <p class="text-sm font-medium text-terracotta-700">
          マップ設定
        </p>
        <h1 class="mt-1 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
          {{ data.map.name }}
        </h1>
        <p class="mt-2 text-sm text-stone-500">
          公開パス: /{{ data.map.slug }}
        </p>
      </header>

      <section class="mt-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <div class="mb-6">
          <h2 class="text-lg font-bold text-stone-900">
            基本情報
          </h2>
          <p class="mt-1 text-sm text-stone-600">
            管理画面と公開画面に表示する名称です。
          </p>
          <p class="mt-2 text-xs text-stone-500">公開URL: /{{ data.map.slug }}（既存リンクを保護するため、この画面では変更できません）</p>
        </div>
        <div v-if="submitError" role="alert" class="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {{ submitError }}
        </div>
        <div v-if="successMessage" role="status" class="mb-6 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {{ successMessage }}
        </div>
        <MapNameForm
          :initial-name="data.map.name"
          :is-submitting="isSubmitting"
          @submit="saveMap"
        />
      </section>

      <section class="mt-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <div>
          <h2 class="text-lg font-bold text-stone-900">公開ヘッダーの団体情報</h2>
          <p class="mt-1 text-sm leading-6 text-stone-600">必要な項目だけ設定できます。未設定の項目は公開画面に表示されません。</p>
        </div>
        <form class="mt-6 space-y-5" @submit.prevent="saveBranding">
          <div>
            <label for="organization-name" class="text-sm font-semibold text-stone-800">団体・運営者名</label>
            <input id="organization-name" v-model="branding.organizationName" maxlength="100" class="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2.5" placeholder="例：○○観光協会">
          </div>
          <div>
            <p class="text-sm font-semibold text-stone-800">ロゴ</p>
            <div v-if="branding.logoUrl" class="mt-2 flex items-center gap-4 rounded-xl border border-stone-200 p-4">
              <img :src="branding.logoUrl" alt="現在の団体ロゴ" class="size-16 rounded-lg object-contain">
              <button type="button" class="text-sm font-semibold text-red-700" @click="branding.logoUrl = ''; branding.logoAssetId = null">ロゴを外す</button>
            </div>
            <div class="mt-3">
              <MediaPicker :map-id="mapId" label="団体ロゴ" usage="logo" @selected="useUploadedLogo" />
            </div>
          </div>
          <div class="grid gap-5 sm:grid-cols-2">
            <div>
              <label for="website-url" class="text-sm font-semibold text-stone-800">公式WebサイトURL</label>
              <input id="website-url" v-model="branding.websiteUrl" type="url" class="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2.5" placeholder="https://example.jp">
            </div>
            <div>
              <label for="sns-url" class="text-sm font-semibold text-stone-800">SNS URL</label>
              <input id="sns-url" v-model="branding.snsUrl" type="url" class="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2.5" placeholder="https://www.instagram.com/…">
            </div>
          </div>
          <p v-if="brandingError" role="alert" class="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{{ brandingError }}</p>
          <p v-if="brandingMessage" role="status" class="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{{ brandingMessage }}</p>
          <div class="flex justify-end">
            <button type="submit" :disabled="isBrandingSaving" class="rounded-lg bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{{ isBrandingSaving ? '保存中…' : '団体情報を保存' }}</button>
          </div>
        </form>
      </section>

      <section class="mt-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 class="text-lg font-bold text-stone-900">
          イラスト画像とフロア
        </h2>
        <p class="mt-2 text-sm leading-6 text-stone-600">
          フロアごとにイラスト画像を登録し、表示順やジオリファレンスを設定します。
        </p>
        <NuxtLink :to="`/admin/maps/${mapId}/floors`" class="mt-5 inline-flex rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-stone-700">
          フロアを管理する
        </NuxtLink>
      </section>

      <section class="mt-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 class="text-lg font-bold text-stone-900">カテゴリー</h2>
        <p class="mt-2 text-sm leading-6 text-stone-600">スポットで使用するカテゴリーの名称と表示順を管理します。</p>
        <NuxtLink :to="`/admin/maps/${mapId}/categories`" class="mt-5 inline-flex rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-stone-700">カテゴリーを管理する</NuxtLink>
      </section>

      <section class="mt-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 class="text-lg font-bold text-stone-900">スポット</h2>
        <p class="mt-2 text-sm leading-6 text-stone-600">登録済みスポットを検索し、情報や公開状態を管理します。</p>
        <div class="mt-5 flex flex-wrap gap-3">
          <NuxtLink :to="`/admin/maps/${mapId}/spots`" class="inline-flex rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-stone-700">スポット一覧を開く</NuxtLink>
          <NuxtLink :to="`/admin/maps/${mapId}/editor`" class="inline-flex rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-800 hover:bg-stone-100">地図からピンを置く</NuxtLink>
        </div>
      </section>

      <section class="mt-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <div class="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div class="flex items-center gap-3">
              <h2 class="text-lg font-bold text-stone-900">公開設定</h2>
              <span class="rounded-full px-2.5 py-1 text-xs font-semibold" :class="data.map.isPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-700'">{{ data.map.isPublished ? '公開中' : '下書き' }}</span>
            </div>
            <p class="mt-2 text-sm leading-6 text-stone-600">マップの公開状態を切り替え、閲覧者向けURLを管理します。</p>
          </div>
          <NuxtLink :to="`/admin/maps/${mapId}/publish`" class="inline-flex shrink-0 justify-center rounded-lg bg-terracotta-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-terracotta-700">公開設定を開く</NuxtLink>
        </div>
      </section>
    </template>
  </div>
</template>
