<script setup lang="ts">
import ConfirmDialog from '~/components/ui/ConfirmDialog.vue'
import SettingsNavigation from '~/components/admin/SettingsNavigation.vue'
import type { PlanCode, PlanSimulation, WorkspaceBilling } from '~~/shared/types/workspace-plan'
import { formatStorageBytes } from '~~/shared/utils/workspace-plan'
import { planSimulationSchema } from '~~/shared/schemas/workspace-plan'

definePageMeta({ layout: 'admin', middleware: 'auth' })
useHead({ title: 'Plan & Billing | Digital Map' })
const { data, error, refresh } = await useFetch<WorkspaceBilling>('/api/organization/billing')
const selectedPlan = ref<PlanCode | null>(null)
const mockLimit = ref<number | string>(0)
const simulation = ref<PlanSimulation | null>(null)
const busy = ref(false)
const simulationError = ref('')
const consultation = ref('')
const currentPlan = computed(() => data.value?.plans.find(plan => plan.code === data.value?.contract.planCode))
const selectedName = computed(() => data.value?.plans.find(plan => plan.code === selectedPlan.value)?.name ?? '')
const features = computed(() => {
  const e = data.value?.entitlements
  return e ? [
    [e.publicMap, 'Public Map'], [e.illustrationMap, 'イラストマップ'],
    [e.analytics, '基本Analytics'], [e.csvImport, 'CSVインポート'], [e.csvExport, 'CSVエクスポート'],
  ].filter(([enabled]) => enabled).map(([, label]) => label) : []
})
function choose(planCode: PlanCode) {
  simulationError.value = ''
  if (mockLimit.value === '' || !planSimulationSchema.safeParse({ planCode, maxPublishedMaps: Number(mockLimit.value) }).success) {
    simulationError.value = '検証用の上限は0〜1,000,000の整数を入力してください。'
    return
  }
  selectedPlan.value = planCode
}
async function simulate() {
  if (!selectedPlan.value || busy.value) return
  busy.value = true
  simulationError.value = ''
  try {
    simulation.value = await $fetch<PlanSimulation>('/api/organization/billing/simulate', {
      method: 'POST', body: { planCode: selectedPlan.value, maxPublishedMaps: Number(mockLimit.value) },
    })
    selectedPlan.value = null
  }
  catch {
    selectedPlan.value = null
    simulationError.value = 'Mockを実行できませんでした。権限・入力・通信状態を確認して、もう一度お試しください。'
  }
  finally { busy.value = false }
}
</script>

<template>
  <div class="mx-auto max-w-6xl">
    <SettingsNavigation :is-owner="data?.authorization.canSimulate ?? false" />
    <AdminPageHeader eyebrow="Settings" title="Plan & Billing" :description="data ? `${data.workspace.name} のプランと利用状況` : 'ワークスペースのプランと利用状況'" />
    <p class="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">β版のため現在課金は発生しません。正式な料金・上限は未確定です。</p>

    <section v-if="error" class="mt-6 rounded-xl border border-red-200 bg-red-50 p-5" role="alert">
      <h2 class="font-bold text-red-900">プランと利用状況を読み込めませんでした</h2>
      <UiButton variant="secondary" class="mt-3" @click="refresh()">再読み込み</UiButton>
    </section>
    <template v-else-if="data">
      <section class="mt-6 rounded-xl border border-stone-200 bg-white p-5 sm:p-6" aria-labelledby="current-plan">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div><h2 id="current-plan" class="text-sm font-semibold text-stone-600">Current Plan</h2><p class="mt-1 text-2xl font-bold text-stone-950">{{ currentPlan?.name }}</p></div>
          <span class="rounded-full bg-stone-100 px-3 py-1.5 text-sm font-semibold text-stone-700">Beta期間中</span>
        </div>
        <p class="mt-3 text-sm text-stone-600">ワークスペース単位のβ設定です。Mockを試しても現在のプランや公開状態は変わりません。</p>
        <ul class="mt-4 flex flex-wrap gap-2" aria-label="現在利用できる機能"><li v-for="feature in features" :key="String(feature)" class="rounded-md bg-stone-50 px-3 py-2 text-sm text-stone-700">{{ feature }}</li></ul>
      </section>

      <section class="mt-7" aria-labelledby="workspace-usage">
        <h2 id="workspace-usage" class="text-lg font-bold text-stone-950">Usage</h2>
        <dl class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div class="rounded-xl border border-stone-200 bg-white p-5"><dt class="text-sm text-stone-600">公開Map</dt><dd class="mt-2 text-2xl font-bold text-stone-950">{{ data.usage.publishedMaps }}<span v-if="data.entitlements.maxPublishedMaps !== null" class="text-base text-stone-600"> / {{ data.entitlements.maxPublishedMaps }}</span></dd><dd class="mt-2 text-xs text-stone-600">β期間中は上限を適用していません</dd></div>
          <div class="rounded-xl border border-stone-200 bg-white p-5"><dt class="text-sm text-stone-600">保存Map</dt><dd class="mt-2 text-2xl font-bold text-stone-950">{{ data.usage.retainedMaps }}</dd><dd class="mt-2 text-xs text-stone-600">非公開 {{ data.usage.draftMaps }} ・ アーカイブ {{ data.usage.archivedMaps }}</dd></div>
          <div class="rounded-xl border border-stone-200 bg-white p-5"><dt class="text-sm text-stone-600">管理メディア容量</dt><dd class="mt-2 text-2xl font-bold text-stone-950">{{ formatStorageBytes(data.usage.storageBytes) }}</dd><dd class="mt-2 text-xs text-stone-600">登録済み画像と生成画像の合計。公開スナップショット・未登録ファイルを除く</dd></div>
          <div class="rounded-xl border border-stone-200 bg-white p-5"><dt class="text-sm text-stone-600">Members</dt><dd class="mt-2 text-2xl font-bold text-stone-950">{{ data.usage.memberCount }}</dd><dd class="mt-2 text-xs text-stone-600">有効なメンバー。招待待ちを除く</dd></div>
        </dl>
        <p class="mt-3 text-xs leading-relaxed text-stone-600">公開Mapは、アーカイブされておらず、公開設定が有効で、現在の公開リリースがREADYになっているMapです。配信の正常性を示す数値ではありません。</p>
      </section>

      <section class="mt-8" aria-labelledby="plan-comparison">
        <h2 id="plan-comparison" class="text-lg font-bold text-stone-950">Plan Comparison</h2>
        <p class="mt-2 text-sm text-stone-600">現在のβで利用できる機能は各プラン共通です。将来の提供範囲・料金は確定していません。</p>
        <div class="mt-4 grid gap-4 lg:grid-cols-3">
          <article v-for="plan in data.plans" :key="plan.code" class="flex flex-col rounded-xl border border-stone-200 bg-white p-5 sm:p-6">
            <h3 class="text-xl font-bold text-stone-950">{{ plan.name }}</h3>
            <p class="mt-2 text-sm font-semibold text-terracotta-800">{{ plan.audience }}</p>
            <p class="mt-4 text-sm leading-relaxed text-stone-700">{{ plan.description }}</p>
            <p class="mt-4 flex-1 text-sm leading-relaxed text-stone-600">{{ plan.future }}</p>
            <div class="mt-5 flex flex-wrap gap-2">
              <UiButton variant="secondary" @click="consultation = `${plan.name}：${plan.audience}。この案内はMockです。相談・問い合わせは送信されません。`">{{ plan.action }}</UiButton>
              <UiButton v-if="data.authorization.canSimulate" variant="ghost" :aria-label="`${plan.name}の設定Mockを試す`" @click="choose(plan.code)">設定Mock</UiButton>
            </div>
          </article>
        </div>
        <p v-if="consultation" role="status" class="mt-4 rounded-lg border border-stone-200 bg-white p-4 text-sm text-stone-700">{{ consultation }}</p>
      </section>

      <section class="mt-8 rounded-xl border border-stone-200 bg-white p-5 sm:p-6" aria-labelledby="mock-settings">
        <h2 id="mock-settings" class="text-lg font-bold text-stone-950">プラン設定Mock</h2>
        <p class="mt-2 text-sm leading-relaxed text-stone-600">Ownerだけが試せる、保存されないシミュレーションです。契約変更・課金・データ削除・権限変更は発生しません。</p>
        <template v-if="data.authorization.canSimulate">
          <label for="mock-published-limit" class="mt-5 block text-sm font-semibold text-stone-700">検証用の公開Map上限（正式なプラン上限ではありません）</label>
          <input id="mock-published-limit" v-model="mockLimit" type="number" min="0" max="1000000" step="1" class="mt-2 min-h-11 w-full max-w-xs rounded-lg border border-stone-300 px-3 py-2 text-stone-950" aria-describedby="mock-limit-help">
          <p id="mock-limit-help" class="mt-2 text-xs text-stone-600">上限を入力し、比較欄の「設定Mock」からプランを選んでください。</p>
        </template>
        <p v-else class="mt-4 text-sm font-semibold text-stone-700">閲覧のみ。プラン設定MockはWorkspace Ownerが実行できます。</p>
        <p v-if="simulationError" class="mt-4 text-sm text-red-700" role="alert">{{ simulationError }}</p>
        <div v-if="simulation" class="mt-5 rounded-lg bg-stone-50 p-4 text-sm leading-relaxed text-stone-700" role="status">
          <p class="font-bold">Mock結果（保存されません）：{{ data.plans.find(plan => plan.code === simulation?.planCode)?.name }}</p>
          <p class="mt-2">公開Map {{ simulation.usage.publishedMaps }} / 検証用上限 {{ simulation.entitlements.maxPublishedMaps }}</p>
          <p>{{ simulation.overLimit ? '上限超過' : '上限内' }}。新しい初公開・再公開：{{ simulation.canIncreasePublishedMaps ? '許可候補' : '制限候補' }}。</p>
          <p class="mt-2">既存公開・Public URL・PublicReleaseを保持。安全な修正・unpublish・rollback・exportは許可する方針です。現在のβ環境へ制限は適用されません。</p>
        </div>
      </section>
      <ConfirmDialog :open="selectedPlan !== null" title="β期間中のプラン設定Mock" :message="`${selectedName}で上限の判定を試します。結果は保存されず、現在のプラン・契約・課金・データ・公開状態・権限は変わりません。`" confirm-label="Mockを試す" :busy="busy" @confirm="simulate" @cancel="selectedPlan = null" />
    </template>
  </div>
</template>
