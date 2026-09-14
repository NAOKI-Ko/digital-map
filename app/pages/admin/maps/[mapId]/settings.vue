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
const deleteError = ref('')
const deleteDialogOpen = ref(false)
const translation = reactive({
  englishEnabled: data.value?.map.enabledLocales.includes('en') ?? false,
  name: data.value?.map.englishTranslation?.name ?? '',
  description: data.value?.map.englishTranslation?.description ?? '',
})
const translationState = ref<'idle' | 'saving' | 'success' | 'error'>('idle')
const translationMessage = ref('')
const seo = reactive({ title: data.value?.map.seoTitle ?? '', description: data.value?.map.seoDescription ?? '', imageAssetId: data.value?.map.seoImageAssetId ?? null as string | null })
const seoState = ref<'idle' | 'saving' | 'success' | 'error'>('idle')
const seoMessage = ref('')
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

async function deleteMap() {
  deleteDialogOpen.value = false
  deleteError.value = ''
  try {
    await $fetch(`/api/maps/${mapId}`, { method: 'DELETE' })
    await navigateTo('/admin/dashboard')
  }
  catch (error: any) { deleteError.value = error?.data?.statusMessage ?? 'マップを削除できませんでした。' }
}

async function saveTranslation() {
  translationState.value = 'saving'
  translationMessage.value = ''
  try {
    await $fetch(`/api/maps/${mapId}/translations`, { method: 'PATCH', body: translation })
    translationState.value = 'success'
    translationMessage.value = '言語設定と英語訳を保存しました。'
  }
  catch (error: any) {
    translationState.value = 'error'
    translationMessage.value = error?.data?.statusMessage ?? '英語訳を保存できませんでした。'
  }
}

async function saveSeo() {
  seoState.value = 'saving'
  try { await $fetch(`/api/maps/${mapId}/seo`, { method: 'PATCH', body: seo }); seoState.value = 'success'; seoMessage.value = 'SEO設定を保存しました。次回公開時にSnapshotへ反映されます。' }
  catch { seoState.value = 'error'; seoMessage.value = 'SEO設定を保存できませんでした。' }
}
</script>

<template>
  <div class="max-w-4xl">
    <AdminSubnavigation :map-id="mapId" area="map-edit" />
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
        <SaveFeedback class="mb-6" :state="isSubmitting ? 'saving' : submitError ? 'error' : successMessage ? 'success' : 'idle'" :message="submitError || successMessage" />
        <MapNameForm
          :initial-name="data.map.name"
          :is-submitting="isSubmitting"
          @submit="saveMap"
        />
      </section>

      <section class="mt-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 class="text-lg font-bold text-stone-900">公開言語</h2>
        <p class="mt-1 text-sm text-stone-600">日本語は既定言語で、無効化できません。英語訳が空の項目は日本語を表示します。</p>
        <form class="mt-5 space-y-4" @submit.prevent="saveTranslation">
          <label class="flex items-center gap-2 text-sm font-semibold"><input v-model="translation.englishEnabled" type="checkbox"> 英語（en）を有効にする</label>
          <template v-if="translation.englishEnabled">
            <label class="block text-sm font-semibold">Map name (English)<input v-model="translation.name" maxlength="100" class="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2.5"></label>
            <label class="block text-sm font-semibold">Description (English)<textarea v-model="translation.description" maxlength="2000" rows="4" class="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2.5" /></label>
          </template>
          <SaveFeedback :state="translationState" :message="translationMessage" />
          <button class="rounded-lg bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white" :disabled="translationState === 'saving'">言語設定を保存</button>
        </form>
      </section>

      <section class="mt-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8"><h2 class="text-lg font-bold">SEO / シェア表示</h2><p class="mt-1 text-sm text-stone-600">空欄は公開言語のMap名・説明・画像へフォールバックします。</p><form class="mt-5 space-y-4" @submit.prevent="saveSeo"><label class="block text-sm font-semibold">SEO title<input v-model="seo.title" maxlength="100" class="mt-1 w-full rounded border px-3 py-2"></label><label class="block text-sm font-semibold">Description<textarea v-model="seo.description" maxlength="300" rows="3" class="mt-1 w-full rounded border px-3 py-2" /></label><MediaPicker :map-id="mapId" label="代表画像" usage="logo" @selected="seo.imageAssetId = $event.assetId" /><SaveFeedback :state="seoState" :message="seoMessage" /><button class="rounded bg-stone-900 px-4 py-2 text-sm font-semibold text-white">SEO設定を保存</button></form></section>

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
          <SaveFeedback :state="isBrandingSaving ? 'saving' : brandingError ? 'error' : brandingMessage ? 'success' : 'idle'" :message="brandingError || brandingMessage" />
          <div class="flex justify-end">
            <button type="submit" :disabled="isBrandingSaving" class="rounded-lg bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{{ isBrandingSaving ? '保存中…' : '団体情報を保存' }}</button>
          </div>
        </form>
      </section>

      <section v-if="data.map.permissions?.canManageEditors" class="mt-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 class="text-lg font-bold text-stone-900">このマップの編集者</h2>
        <p class="mt-2 text-sm text-stone-600">組織メンバーへ、このマップだけの編集権限を割り当てます。組織オーナーはすべてのマップを編集できます。</p>
        <NuxtLink :to="`/admin/maps/${mapId}/editors`" class="mt-5 inline-flex rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white">編集者を管理する</NuxtLink>
      </section>

      <section v-if="data.map.permissions?.canDelete" class="mt-6 rounded-2xl border border-red-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 class="text-lg font-bold text-red-900">マップの削除</h2>
        <p class="mt-2 text-sm text-stone-600">マップと配下のデータを削除します。編集者はこの操作を実行できません。</p>
        <p v-if="deleteError" class="mt-3 text-sm text-red-700">{{ deleteError }}</p>
        <button class="mt-5 rounded-lg border border-red-300 px-4 py-2.5 text-sm font-semibold text-red-700" @click="deleteDialogOpen = true">マップを削除</button>
      </section>
      <ConfirmDialog :open="deleteDialogOpen" title="マップを削除" message="このマップと配下のデータを削除します。この操作は取り消せません。" confirm-label="削除する" destructive @cancel="deleteDialogOpen = false" @confirm="deleteMap" />

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
        <NuxtLink :to="`/admin/maps/${mapId}/fields`" class="ml-3 mt-5 inline-flex rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-stone-700">Spot情報項目を管理する</NuxtLink>
      </section>

      <section class="mt-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8"><h2 class="text-lg font-bold">公開Analytics</h2><p class="mt-2 text-sm text-stone-600">MapとSpotのプライバシー配慮型日次集計を確認します。</p><NuxtLink :to="`/admin/maps/${mapId}/analytics`" class="mt-4 inline-flex rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white">Analyticsを開く</NuxtLink></section>

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
