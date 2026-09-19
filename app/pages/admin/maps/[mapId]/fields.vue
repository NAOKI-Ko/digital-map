<script setup lang="ts">
import SaveFeedback from '~/components/ui/SaveFeedback.vue'
import UiAlertDialog from '~/components/ui/UiAlertDialog.vue'
import UiDialog from '~/components/ui/UiDialog.vue'
import UiSelect from '~/components/ui/UiSelect.vue'
import UiSwitch from '~/components/ui/UiSwitch.vue'
import { mapLanguageLabel } from '~~/shared/constants/map-languages'
import type { MapLocale } from '~~/shared/constants/map-languages'
import { customSpotFieldTypes } from '~~/shared/constants/spot-fields'
import type { SpotFieldType } from '~~/shared/constants/spot-fields'
import type { SpotFieldDefinitionItem, SpotFieldDefinitionListResponse } from '~~/shared/types/spot-field'

definePageMeta({ layout: 'admin', middleware: 'auth' })
const route = useRoute()
const mapId = route.params.mapId as string
const { data, refresh } = await useFetch<SpotFieldDefinitionListResponse>(`/api/maps/${mapId}/spot-fields`)
const message = ref('')
const saveState = ref<'idle' | 'saving' | 'success' | 'error'>('idle')
const activeId = ref<string | null>(null)
const draft = ref<SpotFieldDefinitionItem | null>(null)
const originalDraft = ref<SpotFieldDefinitionItem | null>(null)
const addDialogOpen = ref(false)
const dirtyDialogOpen = ref(false)
const deleteTarget = ref<SpotFieldDefinitionItem | null>(null)
const pendingAction = ref<{ type: 'edit', id: string } | { type: 'add' } | null>(null)
const draggedId = ref<string | null>(null)
const dragOverId = ref<string | null>(null)
const newField = reactive({
  label: '',
  translations: {} as Partial<Record<MapLocale, string>>,
  type: 'single_line_text' as SpotFieldType,
  enabled: true,
  publicVisible: true,
  required: false,
})

const fieldTypeLabels: Record<string, string> = {
  single_line_text: '一行テキスト',
  multiline_text: '複数行テキスト',
  number: '数値',
  url: 'URL',
  boolean: 'はい／いいえ',
}
const typeOptions = customSpotFieldTypes.map(type => ({ value: type, label: fieldTypeLabels[type] ?? type }))
const fields = computed(() => data.value?.fields ?? [])
const defaultLocale = computed<MapLocale>(() => data.value?.defaultLocale ?? 'ja')
const enabledLocales = computed<MapLocale[]>(() => data.value?.enabledLocales ?? ['ja'])
const isBusy = computed(() => saveState.value === 'saving')
const isDirty = computed(() => !!draft.value && !!originalDraft.value && JSON.stringify(draft.value) !== JSON.stringify(originalDraft.value))

function cloneField(field: SpotFieldDefinitionItem) {
  return { ...field, translations: field.translations.map(item => ({ ...item })) }
}

function translatedLabel(field: SpotFieldDefinitionItem, locale: MapLocale) {
  return field.translations.find(item => item.locale === locale)?.label ?? ''
}

function setDraftTranslation(locale: MapLocale, value: string) {
  if (!draft.value) return
  const existing = draft.value.translations.find(item => item.locale === locale)
  if (existing) existing.label = value
  else draft.value.translations.push({ locale, label: value })
}

function translationPayload(field: SpotFieldDefinitionItem) {
  return Object.fromEntries(enabledLocales.value
    .filter(locale => locale !== defaultLocale.value)
    .map(locale => [locale, translatedLabel(field, locale)]))
}

function openEditor(field: SpotFieldDefinitionItem) {
  activeId.value = field.id
  draft.value = cloneField(field)
  originalDraft.value = cloneField(field)
  nextTick(() => document.querySelector<HTMLInputElement>(`#field-label-${field.id}`)?.focus())
}

function requestEdit(field: SpotFieldDefinitionItem) {
  if (activeId.value === field.id) return
  if (activeId.value && isDirty.value) {
    pendingAction.value = { type: 'edit', id: field.id }
    dirtyDialogOpen.value = true
    return
  }
  openEditor(field)
}

function requestAdd() {
  if (activeId.value && isDirty.value) {
    pendingAction.value = { type: 'add' }
    dirtyDialogOpen.value = true
    return
  }
  addDialogOpen.value = true
}

function closeEditor() {
  activeId.value = null
  draft.value = null
  originalDraft.value = null
}

function runPendingAction() {
  const action = pendingAction.value
  pendingAction.value = null
  dirtyDialogOpen.value = false
  if (!action) return
  if (action.type === 'add') {
    closeEditor()
    addDialogOpen.value = true
    return
  }
  const field = fields.value.find(item => item.id === action.id)
  if (field) openEditor(field)
}

function discardAndContinue() {
  closeEditor()
  runPendingAction()
}

function setEnabled(value: boolean) {
  if (!draft.value) return
  draft.value.enabled = value
  if (!value) draft.value.publicVisible = false
}

function setNewFieldEnabled(value: boolean) {
  newField.enabled = value
  if (!value) newField.publicVisible = false
}

async function saveActive(continuePending = false) {
  if (!draft.value || !originalDraft.value) return false
  message.value = ''
  saveState.value = 'saving'
  const current = draft.value
  try {
    await $fetch(`/api/maps/${mapId}/spot-fields/${current.id}`, {
      method: 'PATCH',
      body: {
        label: current.label,
        ...(current.kind === 'custom' ? { type: current.type } : {}),
        enabled: current.enabled,
        publicVisible: current.enabled && current.publicVisible,
        required: current.required,
        translations: translationPayload(current),
      },
    })
    await refresh()
    message.value = '項目設定を保存しました。'
    saveState.value = 'success'
    closeEditor()
    if (continuePending) runPendingAction()
    return true
  }
  catch (error: any) {
    message.value = error?.data?.statusMessage ?? '項目設定を保存できませんでした。入力内容を確認してください。'
    saveState.value = 'error'
    dirtyDialogOpen.value = false
    pendingAction.value = null
    return false
  }
}

async function createCustomField() {
  message.value = ''
  saveState.value = 'saving'
  try {
    const nextOrder = fields.value.reduce((maximum, field) => Math.max(maximum, field.order), -1) + 1
    await $fetch(`/api/maps/${mapId}/spot-fields`, {
      method: 'POST',
      body: {
        ...newField,
        translations: Object.fromEntries(enabledLocales.value
          .filter(locale => locale !== defaultLocale.value)
          .map(locale => [locale, newField.translations[locale] ?? ''])),
        order: nextOrder,
      },
    })
    Object.assign(newField, { label: '', translations: {}, type: 'single_line_text', enabled: true, publicVisible: true, required: false })
    await refresh()
    addDialogOpen.value = false
    message.value = 'カスタム項目を追加しました。'
    saveState.value = 'success'
  }
  catch (error: any) {
    message.value = error?.data?.statusMessage ?? 'カスタム項目を追加できませんでした。入力内容を確認してください。'
    saveState.value = 'error'
  }
}

async function remove() {
  const field = deleteTarget.value
  if (!field || field.kind !== 'custom' || field.valueCount > 0) return
  saveState.value = 'saving'
  try {
    const deleteUrl: string = `/api/maps/${mapId}/spot-fields/${field.id}`
    await $fetch(deleteUrl, { method: 'DELETE' })
    deleteTarget.value = null
    closeEditor()
    await refresh()
    message.value = 'カスタム項目を削除しました。'
    saveState.value = 'success'
  }
  catch (error: any) {
    deleteTarget.value = null
    message.value = error?.data?.statusMessage ?? 'カスタム項目を削除できませんでした。'
    saveState.value = 'error'
  }
}

async function persistOrder(orderedIds: string[]) {
  if (isBusy.value || orderedIds.every((id, index) => fields.value[index]?.id === id)) return
  saveState.value = 'saving'
  try {
    await $fetch(`/api/maps/${mapId}/spot-fields/reorder`, { method: 'PATCH', body: { orderedIds } })
    await refresh()
    message.value = '表示順を保存しました。'
    saveState.value = 'success'
  }
  catch (error: any) {
    await refresh()
    message.value = error?.data?.statusMessage ?? '表示順を保存できませんでした。'
    saveState.value = 'error'
  }
}

function moveField(index: number, delta: number) {
  const target = index + delta
  if (target < 0 || target >= fields.value.length) return
  const ids = fields.value.map(field => field.id)
  const [moved] = ids.splice(index, 1)
  if (!moved) return
  ids.splice(target, 0, moved)
  void persistOrder(ids)
}

function beginDrag(fieldId: string, event: DragEvent) {
  draggedId.value = fieldId
  event.dataTransfer?.setData('text/plain', fieldId)
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'
}

function dropOn(targetId: string) {
  const sourceId = draggedId.value
  draggedId.value = null
  dragOverId.value = null
  if (!sourceId || sourceId === targetId) return
  const ids = fields.value.map(field => field.id)
  const sourceIndex = ids.indexOf(sourceId)
  const targetIndex = ids.indexOf(targetId)
  if (sourceIndex < 0 || targetIndex < 0) return
  ids.splice(sourceIndex, 1)
  ids.splice(targetIndex, 0, sourceId)
  void persistOrder(ids)
}
</script>

<template>
  <div class="max-w-5xl">
    <AdminSubnavigation :map-id="mapId" area="map-edit" />
    <NuxtLink :to="`/admin/maps/${mapId}/settings`" class="text-sm font-medium text-stone-600">← マップ設定に戻る</NuxtLink>
    <header class="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 class="text-3xl font-bold">スポット情報項目</h1>
        <p class="mt-2 text-sm text-stone-600">スポットで使用する情報項目と表示順を管理します。</p>
      </div>
      <button type="button" class="min-h-11 shrink-0 rounded-lg bg-terracotta-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-terracotta-700" @click="requestAdd">＋ 項目を追加</button>
    </header>

    <SaveFeedback class="mt-4" :state="saveState" :message="message" />

    <ol class="mt-6 divide-y divide-stone-200 border-y border-stone-200 bg-white">
      <li
        v-for="(field, index) in fields"
        :key="field.id"
        class="transition"
        :class="dragOverId === field.id ? 'bg-terracotta-50' : ''"
        @dragover.prevent="dragOverId = field.id"
        @dragleave="dragOverId = null"
        @drop.prevent="dropOn(field.id)"
      >
        <div class="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:px-4">
          <div class="flex min-w-0 flex-1 items-start gap-3">
            <button
              type="button"
              draggable="true"
              :disabled="isBusy"
              class="mt-0.5 grid size-10 shrink-0 cursor-grab place-items-center rounded-lg text-lg text-stone-400 hover:bg-stone-100 hover:text-stone-700 disabled:cursor-not-allowed disabled:opacity-40"
              :aria-label="`${field.label}をドラッグして並べ替え`"
              title="ドラッグして並べ替え"
              @dragstart="beginDrag(field.id, $event)"
              @dragend="draggedId = null; dragOverId = null"
            >≡</button>
            <div class="min-w-0 pt-0.5">
              <p class="truncate font-semibold text-stone-900">{{ field.label }}</p>
              <p class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone-600">
                <span class="font-semibold" :class="field.kind === 'standard' ? 'text-stone-700' : 'text-terracotta-700'">{{ field.kind === 'standard' ? '標準' : 'カスタム' }}</span>
                <span aria-hidden="true">・</span>
                <span>{{ fieldTypeLabels[field.type] ?? field.type }}</span>
                <span aria-hidden="true">・</span>
                <span>{{ field.valueCount > 0 ? `${field.valueCount}件で使用中` : '未使用' }}</span>
              </p>
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-x-3 gap-y-2 pl-[3.25rem] text-xs sm:justify-end sm:pl-0">
            <span :class="field.enabled ? 'text-emerald-700' : 'text-stone-400'">{{ field.enabled ? '使用する' : '停止中' }}</span>
            <span :class="field.publicVisible ? 'text-sky-700' : 'text-stone-400'">{{ field.publicVisible ? '公開' : '非公開' }}</span>
            <span v-if="field.required" class="text-amber-700">必須</span>
            <button type="button" class="min-h-10 rounded-lg border border-stone-300 px-3 text-sm font-semibold text-stone-800 hover:bg-stone-50" @click="requestEdit(field)">{{ activeId === field.id ? '編集中' : '編集' }}</button>
            <div class="flex" aria-label="並べ替え操作">
              <button type="button" :disabled="isBusy || index === 0" class="size-10 rounded-l-lg border border-stone-300 text-base disabled:opacity-30" :aria-label="`${field.label}を上へ移動`" @click="moveField(index, -1)">↑</button>
              <button type="button" :disabled="isBusy || index === fields.length - 1" class="size-10 rounded-r-lg border border-l-0 border-stone-300 text-base disabled:opacity-30" :aria-label="`${field.label}を下へ移動`" @click="moveField(index, 1)">↓</button>
            </div>
          </div>
        </div>

        <form v-if="activeId === field.id && draft" class="border-t border-stone-200 bg-stone-50 px-4 py-5 sm:px-6" @submit.prevent="saveActive()">
          <div class="grid gap-4 md:grid-cols-2">
            <div class="space-y-3 md:col-span-2">
              <label class="block text-sm font-semibold text-stone-700">
                {{ mapLanguageLabel(defaultLocale) }}（{{ defaultLocale }}・既定、必須）
                <input :id="`field-label-${field.id}`" v-model="draft.label" required maxlength="50" class="mt-1.5 min-h-11 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm">
              </label>
              <label v-for="locale in enabledLocales.filter(item => item !== defaultLocale)" :key="locale" class="block text-sm font-semibold text-stone-700">
                {{ mapLanguageLabel(locale) }}（{{ locale }}・任意）
                <input :value="translatedLabel(draft, locale)" maxlength="50" class="mt-1.5 min-h-11 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm" :placeholder="`${draft.label || '既定言語の表示名'}を使用`" @input="setDraftTranslation(locale, ($event.target as HTMLInputElement).value)">
              </label>
            </div>
            <label class="text-sm font-semibold text-stone-700">
              項目の種類
              <UiSelect v-if="draft.kind === 'custom'" v-model="draft.type" class="mt-1.5" :options="typeOptions" label="項目の種類" :disabled="draft.valueCount > 0" />
              <span v-else class="mt-1.5 flex min-h-11 items-center rounded-lg border border-stone-200 bg-stone-100 px-3 text-sm font-normal text-stone-600">{{ fieldTypeLabels[draft.type] ?? draft.type }}（標準項目）</span>
              <span v-if="draft.kind === 'custom' && draft.valueCount > 0" class="mt-1 block text-xs font-normal text-stone-500">使用中のため種類は変更できません。</span>
            </label>
            <div class="flex flex-wrap items-center gap-x-6 gap-y-1 pt-5 md:pt-6">
              <UiSwitch :model-value="draft.enabled" label="使用する" @update:model-value="setEnabled" />
              <UiSwitch v-model="draft.publicVisible" label="公開する" :disabled="!draft.enabled" />
              <UiSwitch v-model="draft.required" label="必須" />
            </div>
          </div>
          <div class="mt-5 flex flex-col gap-3 border-t border-stone-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <button v-if="draft.kind === 'custom'" type="button" :disabled="draft.valueCount > 0 || isBusy" class="min-h-10 text-sm font-semibold text-red-700 disabled:text-stone-400" @click="deleteTarget = field">削除</button>
              <p v-if="draft.kind === 'custom' && draft.valueCount > 0" class="text-xs text-stone-500">{{ draft.valueCount }}件で使用中のため削除できません。</p>
              <p v-if="draft.kind === 'standard'" class="text-xs text-stone-500">標準項目は削除・種類変更できません。</p>
            </div>
            <div class="flex flex-col-reverse gap-2 sm:flex-row">
              <button type="button" :disabled="isBusy" class="min-h-11 rounded-lg border border-stone-300 bg-white px-4 text-sm font-semibold disabled:opacity-50" @click="closeEditor">キャンセル</button>
              <button :disabled="isBusy || !isDirty" class="min-h-11 rounded-lg bg-terracotta-600 px-5 text-sm font-semibold text-white disabled:opacity-50">{{ isBusy ? '保存中…' : '保存' }}</button>
            </div>
          </div>
        </form>
      </li>
    </ol>

    <p v-if="fields.length === 0" class="mt-6 rounded-xl border border-dashed border-stone-300 p-8 text-center text-sm text-stone-600">項目がありません。「項目を追加」から作成してください。</p>

    <UiDialog :open="addDialogOpen" title="カスタム項目を追加" description="スポットで入力する新しい情報項目を作成します。" max-width="sm" @close="addDialogOpen = false">
      <form class="space-y-4" @submit.prevent="createCustomField">
        <div class="max-h-72 space-y-3 overflow-y-auto pr-1">
          <label class="block text-sm font-semibold text-stone-700">
            項目名・{{ mapLanguageLabel(defaultLocale) }}（{{ defaultLocale }}・既定、必須）
            <input v-model="newField.label" autofocus required maxlength="50" class="mt-1.5 min-h-11 w-full rounded-lg border border-stone-300 px-3 py-2" placeholder="例：座席数">
          </label>
          <label v-for="locale in enabledLocales.filter(item => item !== defaultLocale)" :key="locale" class="block text-sm font-semibold text-stone-700">
            {{ mapLanguageLabel(locale) }}（{{ locale }}・任意）
            <input v-model="newField.translations[locale]" maxlength="50" class="mt-1.5 min-h-11 w-full rounded-lg border border-stone-300 px-3 py-2" :placeholder="`${newField.label || '既定言語の表示名'}を使用`">
          </label>
        </div>
        <label class="block text-sm font-semibold text-stone-700">項目の種類<UiSelect v-model="newField.type" class="mt-1.5" :options="typeOptions" label="追加する項目の種類" /></label>
        <div class="flex flex-wrap gap-x-5 gap-y-1">
          <UiSwitch :model-value="newField.enabled" label="使用する" @update:model-value="setNewFieldEnabled" />
          <UiSwitch v-model="newField.publicVisible" label="公開する" :disabled="!newField.enabled" />
          <UiSwitch v-model="newField.required" label="必須" />
        </div>
        <div class="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <button type="button" :disabled="isBusy" class="min-h-11 rounded-lg border border-stone-300 px-4 text-sm font-semibold" @click="addDialogOpen = false">キャンセル</button>
          <button :disabled="isBusy" class="min-h-11 rounded-lg bg-terracotta-600 px-4 text-sm font-semibold text-white disabled:opacity-50">{{ isBusy ? '追加中…' : '追加' }}</button>
        </div>
      </form>
    </UiDialog>

    <UiAlertDialog :open="dirtyDialogOpen" title="編集中の変更があります" message="変更を保存して続けるか、破棄するか選んでください。" confirm-label="保存して続ける" secondary-label="破棄して続ける" :busy="isBusy" @confirm="saveActive(true)" @secondary="discardAndContinue" @cancel="dirtyDialogOpen = false; pendingAction = null" />
    <UiAlertDialog :open="deleteTarget !== null" title="カスタム項目を削除" :message="deleteTarget ? `「${deleteTarget.label}」を削除します。元に戻せません。` : ''" confirm-label="削除する" destructive :busy="isBusy" @confirm="remove" @cancel="deleteTarget = null" />
  </div>
</template>
