<script setup lang="ts">
import type { OrganizationMembersResponse } from '~~/shared/types/organization'
import type { UploadedImage } from '~~/shared/types/upload'

definePageMeta({ layout: 'admin', middleware: 'auth' })
useHead({ title: '組織設定・メンバー | デジタルマップ' })

const { data: organizationData, error: organizationError, refresh: refreshOrganization } = await useFetch('/api/organization')
const { data: memberData, refresh: refreshMembers } = await useFetch<OrganizationMembersResponse>('/api/organization/members')
const { data: invitationData, refresh: refreshInvitations } = await useFetch('/api/organization/invitations')
const organization = computed(() => organizationData.value?.organization)
const email = ref('')
const message = ref('')
const errorMessage = ref('')
const saving = ref(false)
const acceptanceUrl = ref('')
const removeTarget = ref<{ userId: string, label: string } | null>(null)
const form = reactive({ name: '', logoUrl: '', logoAssetId: null as string | null, websiteUrl: '', snsUrl: '' })

watchEffect(() => {
  if (organization.value) Object.assign(form, {
    name: organization.value.name,
    logoUrl: organization.value.logoUrl ?? '',
    logoAssetId: organization.value.logoAssetId ?? null,
    websiteUrl: organization.value.websiteUrl ?? '',
    snsUrl: organization.value.snsUrl ?? '',
  })
})

async function saveOrganization() {
  await run(async () => {
    await $fetch('/api/organization', { method: 'PATCH', body: {
      name: form.name, logoUrl: form.logoUrl || null, logoAssetId: form.logoAssetId,
      websiteUrl: form.websiteUrl || null, snsUrl: form.snsUrl || null,
    } })
    await refreshOrganization()
    message.value = '組織設定を保存しました。'
  })
}

function useLogo(image: UploadedImage) {
  form.logoUrl = image.url
  form.logoAssetId = image.assetId
}

async function addMember() {
  await run(async () => {
    const result = await $fetch('/api/organization/invitations', { method: 'POST', body: { email: email.value } })
    acceptanceUrl.value = result.acceptanceUrl
    email.value = ''
    await refreshInvitations()
    message.value = '招待を作成しました。開発・QAでは下のURLを安全に共有してください。'
  })
}

async function revokeInvitation(invitationId: string) {
  await run(async () => {
    await $fetch(`/api/organization/invitations/${invitationId}`, { method: 'DELETE' })
    await refreshInvitations()
    message.value = '招待を取り消しました。'
  })
}

async function changeRole(userId: string, role: 'OWNER' | 'MEMBER') {
  await run(async () => {
    await $fetch(`/api/organization/members/${userId}`, { method: 'PATCH', body: { role } })
    await refreshMembers()
    message.value = role === 'OWNER' ? 'オーナーへ昇格しました。' : 'メンバーへ降格しました。'
  })
}

async function removeMember(userId: string) {
  removeTarget.value = null
  await run(async () => {
    await $fetch(`/api/organization/members/${userId}`, { method: 'DELETE' })
    await refreshMembers()
    message.value = '組織から削除しました。ユーザーアカウントは削除されません。'
  })
}

async function run(action: () => Promise<void>) {
  saving.value = true
  message.value = ''
  errorMessage.value = ''
  try { await action() }
  catch (error: any) { errorMessage.value = error?.data?.statusMessage ?? '操作を完了できませんでした。' }
  finally { saving.value = false }
}
</script>

<template>
  <div class="max-w-5xl">
    <header>
      <p class="text-sm font-medium text-terracotta-700">組織</p>
      <h1 class="mt-1 text-3xl font-bold text-stone-900">組織設定・メンバー</h1>
    </header>
    <SaveFeedback class="mt-6" :state="saving ? 'saving' : errorMessage ? 'error' : message ? 'success' : 'idle'" :message="errorMessage || message" />

    <section v-if="organizationError" class="mt-6 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">組織設定とメンバー管理は、組織オーナーだけが利用できます。</section>

    <section v-if="organization" class="mt-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <h2 class="text-lg font-bold">組織設定</h2>
      <form class="mt-5 grid gap-4" @submit.prevent="saveOrganization">
        <label class="text-sm font-semibold">組織名<input v-model="form.name" required maxlength="100" class="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2.5"></label>
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="text-sm font-semibold">公式WebサイトURL<input v-model="form.websiteUrl" type="url" class="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2.5"></label>
          <label class="text-sm font-semibold">SNS URL<input v-model="form.snsUrl" type="url" class="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2.5"></label>
        </div>
        <div>
          <p class="text-sm font-semibold">組織ロゴ</p>
          <div v-if="form.logoUrl" class="mt-2 flex items-center gap-3"><img :src="form.logoUrl" alt="組織ロゴ" class="size-16 rounded-lg object-contain"><button type="button" class="text-sm font-semibold text-red-700" @click="form.logoUrl = ''; form.logoAssetId = null">外す</button></div>
          <ImageUploader class="mt-3" label="組織ロゴ" @uploaded="useLogo" />
        </div>
        <button :disabled="saving" class="justify-self-end rounded-lg bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">保存</button>
      </form>
    </section>

    <section v-if="organization" class="mt-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <h2 class="text-lg font-bold">組織メンバー招待</h2>
      <p class="mt-1 text-sm text-stone-600">招待を承認するまでメンバーには追加されません。招待リンクは発行時だけ表示されます。</p>
      <form class="mt-5 flex gap-3" @submit.prevent="addMember">
        <input v-model="email" required type="email" autocomplete="off" placeholder="member@example.com" class="min-w-0 flex-1 rounded-lg border border-stone-300 px-3 py-2.5">
        <button :disabled="saving" class="rounded-lg bg-terracotta-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">招待を作成</button>
      </form>
      <div v-if="acceptanceUrl" class="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-950">
        <p class="font-semibold">このリンクは今だけ表示されます</p>
        <input readonly :value="acceptanceUrl" class="mt-2 w-full rounded border border-amber-200 bg-white px-2 py-1 font-mono text-xs">
      </div>
      <div class="mt-5 space-y-2">
        <article v-for="invitation in invitationData?.invitations ?? []" :key="invitation.id" class="flex items-center justify-between rounded-lg border p-3 text-sm">
          <div><p class="font-semibold">{{ invitation.email }}</p><p class="text-stone-500">{{ invitation.status }} · {{ new Date(invitation.expiresAt).toLocaleString('ja-JP') }}</p></div>
          <button v-if="invitation.status === 'PENDING'" type="button" class="font-semibold text-red-700" @click="revokeInvitation(invitation.id)">取り消す</button>
        </article>
      </div>
      <h3 class="mt-8 font-bold">現在のメンバー</h3>
      <div class="mt-6 divide-y divide-stone-200">
        <article v-for="member in memberData?.members ?? []" :key="member.userId" class="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div class="flex items-center gap-2"><p class="font-semibold">{{ member.displayName || member.email }}</p><span v-if="member.role === 'OWNER'" class="rounded-full bg-terracotta-100 px-2 py-0.5 text-xs font-bold text-terracotta-800">オーナー</span></div>
            <p v-if="member.displayName" class="text-sm text-stone-500">{{ member.email }}</p>
            <p class="mt-1 text-xs text-stone-500">担当マップ: {{ member.assignedMaps.length ? member.assignedMaps.map(map => map.name).join('、') : 'なし' }}</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button v-if="member.role === 'MEMBER'" :disabled="saving" class="rounded-lg border px-3 py-2 text-sm font-semibold" @click="changeRole(member.userId, 'OWNER')">オーナーにする</button>
            <button v-else :disabled="saving" class="rounded-lg border px-3 py-2 text-sm font-semibold" @click="changeRole(member.userId, 'MEMBER')">メンバーにする</button>
            <button :disabled="saving" class="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700" @click="removeTarget = { userId: member.userId, label: member.displayName || member.email }">組織から削除</button>
          </div>
        </article>
      </div>
    </section>
    <ConfirmDialog :open="removeTarget !== null" title="組織から削除" :message="removeTarget ? `「${removeTarget.label}」を組織から削除します。ユーザーアカウントは削除されません。` : ''" confirm-label="組織から削除" destructive :busy="saving" @cancel="removeTarget = null" @confirm="removeTarget && removeMember(removeTarget.userId)" />
  </div>
</template>
