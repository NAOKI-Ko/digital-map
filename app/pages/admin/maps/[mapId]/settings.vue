<script setup lang="ts">
import ConfirmDialog from '~/components/ui/ConfirmDialog.vue'
import SaveFeedback from '~/components/ui/SaveFeedback.vue'
import UiDialog from '~/components/ui/UiDialog.vue'
import UiSelect from '~/components/ui/UiSelect.vue'
import MapNameForm from '~/components/admin/MapNameForm.vue'
import MediaPicker from '~/components/admin/MediaPicker.vue'
import { mapLanguageLabel, mapLanguageOptions } from '~~/shared/constants/map-languages'
import type { MapLocale } from '~~/shared/constants/map-languages'
import type { MapNameInput } from '~~/shared/schemas/map'
import type { AdminMapResponse, MapBrandingResponse } from '~~/shared/types/map'
import type { UploadedImage } from '~~/shared/types/upload'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})

const route = useRoute()
const mapId = route.params.mapId as string
const settingSections = computed(() => [
  { id: 'basic', label: '基本情報' },
  { id: 'public', label: '公開ヘッダー' },
  { id: 'language', label: '言語・翻訳' },
  { id: 'seo', label: '検索・シェア表示' },
  ...(data.value?.map.permissions?.canManageEditors ? [{ id: 'team', label: '編集者' }] : []),
  ...(data.value?.map.permissions?.canDelete ? [{ id: 'danger', label: 'マップの削除' }] : []),
])
const activeSection = computed(() => settingSections.value.some(item => `#${item.id}` === route.hash) ? route.hash.slice(1) : 'basic')
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
  name: data.value?.map.englishTranslation?.name ?? '',
  description: data.value?.map.englishTranslation?.description ?? '',
})
const enabledLocales = ref<MapLocale[]>([...(data.value?.map.enabledLocales ?? ['ja'])])
const defaultLocale = computed<MapLocale>(() => data.value?.map.defaultLocale ?? 'ja')
const languageDialogOpen = ref(false)
const selectedLocale = ref('')
const languageState = ref<'idle' | 'saving' | 'success' | 'error'>('idle')
const languageMessage = ref('')
const availableLanguageOptions = computed(() => mapLanguageOptions.filter(option => !enabledLocales.value.includes(option.value)))
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
    await $fetch(`/api/maps/${mapId}/translations`, {
      method: 'PATCH',
      body: { ...translation, englishEnabled: enabledLocales.value.includes('en') },
    })
    translationState.value = 'success'
    translationMessage.value = '英語訳を保存しました。'
  }
  catch (error: any) {
    translationState.value = 'error'
    translationMessage.value = error?.data?.statusMessage ?? '英語訳を保存できませんでした。'
  }
}

async function persistLanguages(nextLocales: MapLocale[], success: string) {
  languageState.value = 'saving'
  languageMessage.value = ''
  try {
    const response = await $fetch<{ defaultLocale: MapLocale, enabledLocales: MapLocale[] }>(`/api/maps/${mapId}/languages`, {
      method: 'PATCH',
      body: { enabledLocales: nextLocales },
    })
    enabledLocales.value = response.enabledLocales
    data.value!.map.defaultLocale = response.defaultLocale
    data.value!.map.enabledLocales = response.enabledLocales
    languageState.value = 'success'
    languageMessage.value = success
    return true
  }
  catch (error: any) {
    languageState.value = 'error'
    languageMessage.value = error?.data?.statusMessage ?? '言語設定を保存できませんでした。'
    return false
  }
}

async function addLanguage() {
  if (!selectedLocale.value || enabledLocales.value.includes(selectedLocale.value as MapLocale)) return
  const locale = selectedLocale.value as MapLocale
  if (await persistLanguages([...enabledLocales.value, locale], `${mapLanguageLabel(locale)}を追加しました。`)) {
    selectedLocale.value = ''
    languageDialogOpen.value = false
  }
}

async function removeLanguage(locale: MapLocale) {
  if (locale === defaultLocale.value) return
  await persistLanguages(enabledLocales.value.filter(item => item !== locale), `${mapLanguageLabel(locale)}を無効にしました。翻訳データは保持されます。`)
}

async function saveSeo() {
  seoState.value = 'saving'
  try { await $fetch(`/api/maps/${mapId}/seo`, { method: 'PATCH', body: seo }); seoState.value = 'success'; seoMessage.value = 'SEO設定を保存しました。次回公開時にSnapshotへ反映されます。' }
  catch { seoState.value = 'error'; seoMessage.value = 'SEO設定を保存できませんでした。' }
}
</script>

<template>
  <div class="max-w-6xl">
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

      <div class="mt-7 grid items-start gap-6 md:grid-cols-[11rem_minmax(0,1fr)]">
        <nav aria-label="設定項目" class="flex gap-1 overflow-x-auto border-b border-stone-200 pb-2 md:sticky md:top-6 md:flex-col md:border-b-0 md:border-r md:pb-0 md:pr-4">
          <NuxtLink v-for="item in settingSections" :key="item.id" :to="{ path: route.path, query: route.query, hash: `#${item.id}` }" :aria-current="activeSection === item.id ? 'location' : undefined" class="flex min-h-11 shrink-0 items-center rounded-md px-3 text-sm font-medium" :class="activeSection === item.id ? 'bg-terracotta-50 text-terracotta-800' : 'text-stone-600 hover:bg-stone-100'">{{ item.label }}</NuxtLink>
        </nav>
        <div class="min-w-0 border-t border-stone-200 pt-5">
      <section id="basic" v-show="activeSection === 'basic'" class="settings-section">
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

      <section id="language" v-show="activeSection === 'language'" class="settings-section">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 class="text-lg font-bold text-stone-900">マップの言語</h2>
            <p class="mt-1 text-sm text-stone-600">既定言語は削除できません。無効にした言語の翻訳は保持され、再追加すると復元されます。</p>
          </div>
          <button type="button" :disabled="languageState === 'saving' || availableLanguageOptions.length === 0" class="min-h-11 shrink-0 rounded-lg bg-terracotta-600 px-4 text-sm font-semibold text-white disabled:opacity-50" @click="languageDialogOpen = true">＋ 言語を追加</button>
        </div>
        <ol class="mt-5 divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white">
          <li v-for="locale in enabledLocales" :key="locale" class="flex min-h-14 items-center justify-between gap-3 px-4 py-2">
            <div>
              <span class="font-semibold text-stone-900">{{ mapLanguageLabel(locale) }}</span>
              <span class="ml-2 text-xs text-stone-500">{{ locale }}</span>
              <span v-if="locale === defaultLocale" class="ml-2 rounded-full bg-terracotta-100 px-2 py-1 text-xs font-semibold text-terracotta-800">既定</span>
            </div>
            <button v-if="locale !== defaultLocale" type="button" :disabled="languageState === 'saving'" class="min-h-10 px-2 text-sm font-semibold text-red-700 disabled:opacity-40" @click="removeLanguage(locale)">無効にする</button>
            <span v-else class="text-xs text-stone-500">削除できません</span>
          </li>
        </ol>
        <SaveFeedback class="mt-4" :state="languageState" :message="languageMessage" />

        <form v-if="enabledLocales.includes('en')" class="mt-8 space-y-4 border-t border-stone-200 pt-6" @submit.prevent="saveTranslation">
          <h3 class="font-bold text-stone-900">マップ情報の英語訳</h3>
          <p class="text-sm text-stone-600">既存機能の英語向けマップ名・説明を編集します。</p>
            <label class="block text-sm font-semibold">マップ名（英語）<input v-model="translation.name" maxlength="100" class="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2.5"></label>
            <label class="block text-sm font-semibold">説明文（英語）<textarea v-model="translation.description" maxlength="2000" rows="4" class="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2.5" /></label>
          <SaveFeedback :state="translationState" :message="translationMessage" />
          <button class="rounded-lg bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white" :disabled="translationState === 'saving'">英語訳を保存</button>
        </form>

        <UiDialog :open="languageDialogOpen" title="言語を追加" description="このマップのField表示名で使用する言語を選択します。" max-width="sm" @close="languageDialogOpen = false">
          <form class="space-y-5" @submit.prevent="addLanguage">
            <UiSelect v-model="selectedLocale" :options="availableLanguageOptions" label="追加する言語" placeholder="言語を選択" />
            <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" class="min-h-11 rounded-lg border border-stone-300 px-4 text-sm font-semibold" @click="languageDialogOpen = false">キャンセル</button>
              <button :disabled="!selectedLocale || languageState === 'saving'" class="min-h-11 rounded-lg bg-terracotta-600 px-4 text-sm font-semibold text-white disabled:opacity-50">追加</button>
            </div>
          </form>
        </UiDialog>
      </section>

      <section id="seo" v-show="activeSection === 'seo'" class="settings-section"><h2 class="text-lg font-bold">検索・シェア表示</h2><p class="mt-1 text-sm text-stone-600">空欄の場合は公開中のマップ情報を使用します。</p><form class="mt-5 space-y-4" @submit.prevent="saveSeo"><label class="block text-sm font-semibold">検索結果のタイトル<input v-model="seo.title" maxlength="100" class="mt-1 w-full rounded border px-3 py-2"></label><label class="block text-sm font-semibold">説明文<textarea v-model="seo.description" maxlength="300" rows="3" class="mt-1 w-full rounded border px-3 py-2" /></label><details class="rounded-lg border border-stone-200 p-4"><summary class="cursor-pointer text-sm font-semibold">シェア画像を選択・変更</summary><MediaPicker class="mt-4" :map-id="mapId" label="代表画像" usage="seo" @selected="seo.imageAssetId = $event.assetId" /></details><SaveFeedback :state="seoState" :message="seoMessage" /><button class="rounded bg-stone-900 px-4 py-2 text-sm font-semibold text-white">SEO設定を保存</button></form></section>

      <section id="public" v-show="activeSection === 'public'" class="settings-section">
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
            <details class="mt-3 rounded-lg border border-stone-200 p-4"><summary class="cursor-pointer text-sm font-semibold">ロゴを選択・変更</summary>
              <MediaPicker :map-id="mapId" label="団体ロゴ" usage="logo" @selected="useUploadedLogo" />
            </details>
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

      <section v-if="data.map.permissions?.canManageEditors" id="team" v-show="activeSection === 'team'" class="settings-section">
        <h2 class="text-lg font-bold text-stone-900">このマップの編集者</h2>
        <p class="mt-2 text-sm text-stone-600">組織メンバーへ、このマップだけの編集権限を割り当てます。組織オーナーはすべてのマップを編集できます。</p>
        <NuxtLink :to="`/admin/maps/${mapId}/editors`" class="mt-5 inline-flex rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white">編集者を管理する</NuxtLink>
      </section>

      <section v-if="data.map.permissions?.canDelete" id="danger" v-show="activeSection === 'danger'" class="settings-section rounded-lg border border-red-200 p-5">
        <h2 class="text-lg font-bold text-red-900">マップの削除</h2>
        <p class="mt-2 text-sm text-stone-600">マップと配下のデータを削除します。編集者はこの操作を実行できません。</p>
        <p v-if="deleteError" class="mt-3 text-sm text-red-700">{{ deleteError }}</p>
        <button class="mt-5 rounded-lg border border-red-300 px-4 py-2.5 text-sm font-semibold text-red-700" @click="deleteDialogOpen = true">マップを削除</button>
      </section>
      <ConfirmDialog :open="deleteDialogOpen" title="マップを削除" message="このマップと配下のデータを削除します。この操作は取り消せません。" confirm-label="削除する" destructive @cancel="deleteDialogOpen = false" @confirm="deleteMap" />

        </div>
      </div>
    </template>
  </div>
</template>
