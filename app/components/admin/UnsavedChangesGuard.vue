<script setup lang="ts">
import ConfirmDialog from '~/components/ui/ConfirmDialog.vue'

const props = defineProps<{ dirty: boolean, guardUpdates?: boolean }>()
const emit = defineEmits<{ discard: [] }>()
const open = ref(false)
const pendingDestination = ref('')
const pendingLogout = ref(false)
function beforeLogout(event: Event) {
  if (!props.dirty || event.defaultPrevented) return
  event.preventDefault()
  pendingLogout.value = true
  open.value = true
}
let approvedDestination = ''
function confirmedLogout() { approvedDestination = '/admin/login' }
const removeNavigationObserver = useRouter().afterEach((_to, _from, failure) => {
  if (!failure) approvedDestination = ''
})
onBeforeUnmount(removeNavigationObserver)

function beforeUnload(event: BeforeUnloadEvent) {
  if (!props.dirty) return
  event.preventDefault()
  event.returnValue = ''
}

onMounted(() => { window.addEventListener('beforeunload', beforeUnload); window.addEventListener('admin-before-logout', beforeLogout); window.addEventListener('admin-confirmed-logout', confirmedLogout) })
onBeforeUnmount(() => { window.removeEventListener('beforeunload', beforeUnload); window.removeEventListener('admin-before-logout', beforeLogout); window.removeEventListener('admin-confirmed-logout', confirmedLogout) })

function guardNavigation(to: { fullPath: string }) {
  if (to.fullPath === approvedDestination) return true
  if (!props.dirty) return true
  pendingLogout.value = false
  pendingDestination.value = to.fullPath
  open.value = true
  return false
}
onBeforeRouteLeave(guardNavigation)
onBeforeRouteUpdate(to => props.guardUpdates ? guardNavigation(to) : true)

function stay() {
  pendingLogout.value = false
  open.value = false
  pendingDestination.value = ''
  approvedDestination = ''
}

async function discard() {
  const destination = pendingDestination.value
  open.value = false
  pendingDestination.value = ''
  if (pendingLogout.value) { pendingLogout.value = false; await useAuth().logout(true) }
  else { approvedDestination = destination; emit('discard'); await navigateTo(destination) }
}
</script>

<template>
  <ConfirmDialog :open="open" title="未保存の変更があります" message="この画面を離れると、保存していない変更は失われます。" confirm-label="破棄して移動" cancel-label="編集を続ける" destructive @cancel="stay" @confirm="discard" />
</template>
