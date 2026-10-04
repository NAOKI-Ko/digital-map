<script setup lang="ts">
import ConfirmDialog from '~/components/ui/ConfirmDialog.vue'

const props = defineProps<{ dirty: boolean }>()
const open = ref(false)
const pendingDestination = ref('')
const pendingLogout = ref(false)
function beforeLogout(event: Event) {
  if (!props.dirty || event.defaultPrevented) return
  event.preventDefault()
  pendingLogout.value = true
  open.value = true
}
let bypassNextNavigation = false
function confirmedLogout() { bypassNextNavigation = true }

function beforeUnload(event: BeforeUnloadEvent) {
  if (!props.dirty) return
  event.preventDefault()
  event.returnValue = ''
}

onMounted(() => { window.addEventListener('beforeunload', beforeUnload); window.addEventListener('admin-before-logout', beforeLogout); window.addEventListener('admin-confirmed-logout', confirmedLogout) })
onBeforeUnmount(() => { window.removeEventListener('beforeunload', beforeUnload); window.removeEventListener('admin-before-logout', beforeLogout); window.removeEventListener('admin-confirmed-logout', confirmedLogout) })

onBeforeRouteLeave((to) => {
  if (!props.dirty || bypassNextNavigation) return true
  pendingLogout.value = false
  pendingDestination.value = to.fullPath
  open.value = true
  return false
})

function stay() {
  pendingLogout.value = false
  open.value = false
  pendingDestination.value = ''
}

async function discard() {
  const destination = pendingDestination.value
  open.value = false
  pendingDestination.value = ''
  if (pendingLogout.value) { pendingLogout.value = false; await useAuth().logout(true) }
  else { bypassNextNavigation = true; await navigateTo(destination) }
}
</script>

<template>
  <ConfirmDialog :open="open" title="未保存の変更があります" message="この画面を離れると、保存していない変更は失われます。" confirm-label="破棄して移動" cancel-label="編集を続ける" destructive @cancel="stay" @confirm="discard" />
</template>
