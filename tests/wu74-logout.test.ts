import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'
import { ref, shallowRef, reactive, computed, watch } from 'vue'
import { createRouter, createMemoryHistory } from 'vue-router'

// Execute the real composable/guard scripts with Nuxt lifecycle adapters.
function source(file: string) {
  const raw = readFileSync(file, 'utf8')
  const script = file.endsWith('.vue') ? raw.split('<script setup lang="ts">')[1]!.split('</script>')[0]! : raw
  return ts.transpileModule(script.replace(/^import .*$/gm, '').replace('export function', 'function').replaceAll('import.meta.client', 'true'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText.replace('export {};', '')
}
function fixture(count = 2, fail = false, guardUpdates = false) {
  const window = new EventTarget()
  const guards: Array<(to: { fullPath: string }) => boolean> = []
  const contexts: vm.Context[] = []
  const updates: Array<(to: { fullPath: string }) => boolean> = []
  const afterNavigation: Array<(to: unknown, from: unknown, failure?: unknown) => void> = []
  let calls = 0, destination = ''
  for (let i = 0; i < count; i++) {
    const context = vm.createContext({
      window, CustomEvent, defineEmits: () => () => {},
      useRouter: () => ({ afterEach: (fn: typeof afterNavigation[number]) => { afterNavigation.push(fn); return () => {} } }),
      ref: (value: unknown) => ({ value }), defineProps: () => ({ dirty: true, guardUpdates }),
      onMounted: (fn: () => void) => fn(), onBeforeUnmount: () => {},
      onBeforeRouteLeave: (fn: typeof guards[number]) => guards.push(fn),
      onBeforeRouteUpdate: (fn: typeof guards[number]) => updates.push(fn),
      useUserSession: () => ({ fetch: async () => {} }),
      $fetch: async () => { calls++; if (fail) throw Error('network'); },
      navigateTo: async (path: string) => { if (guards.every(guard => guard({ fullPath: path }) !== false)) { destination = path; afterNavigation.forEach(fn => fn({}, {})) } },
    })
    vm.runInContext(source('app/composables/useAuth.ts') + '\n' + source('app/components/admin/UnsavedChangesGuard.vue'), context)
    contexts.push(context)
  }
  return { contexts, updates, calls: () => calls, destination: () => destination }
}
describe('WU74 logout protects all dirty forms before clearing the session', () => {
  it('opens one confirmation, allows cancellation, and clears once after explicit discard', async () => {
    const f = fixture()
    await vm.runInContext('useAuth().logout()', f.contexts[0]!)
    expect(f.calls()).toBe(0)
    expect(f.contexts.map(c => vm.runInContext('open.value', c))).toEqual([true, false])
    vm.runInContext('stay()', f.contexts[0]!)
    expect(f.calls()).toBe(0)
    await vm.runInContext('useAuth().logout()', f.contexts[0]!)
    await vm.runInContext('discard()', f.contexts[0]!)
    expect(f.calls()).toBe(1)
    expect(f.destination()).toBe('/admin/login')
    expect(f.contexts.map(c => vm.runInContext('open.value', c))).toEqual([false, false])
  })
  it('failed logout leaves future navigation protected', async () => {
    const f = fixture(1, true)
    await vm.runInContext('useAuth().logout()', f.contexts[0]!)
    await expect(vm.runInContext('discard()', f.contexts[0]!)).rejects.toThrow('network')
    expect(f.destination()).toBe('')
    await vm.runInContext("navigateTo('/admin/dashboard')", f.contexts[0]!)
    expect(f.destination()).toBe('')
    expect(vm.runInContext('open.value', f.contexts[0]!)).toBe(true)
  })
})


describe('WU74 Floor recovery', () => {
  it('reacts to an existing Floor rename alone before any new-floor input is edited', async () => {
    const context = vm.createContext({ ref, shallowRef, reactive, computed, watch,
      definePageMeta: () => {}, useRoute: () => ({ params: { mapId: 'map' } }), useHead: () => {},
      useFetch: (path: string, options?: { deep?: boolean }) => ({
        data: options?.deep ? ref({ floors: [{ id: 'floor', name: 'Saved Floor' }] }) : shallowRef(path.endsWith('/floors') ? { floors: [{ id: 'floor', name: 'Saved Floor' }] } : { map: { name: 'Map' } }),
        error: ref(null), status: ref('success'),
      }),
    })
    const state = await vm.runInContext('(async()=>{'+source('app/pages/admin/maps/[mapId]/floors.vue')+';return {floorDirty,data,savedFloorNames,createInput,pendingImage,discardFloorDrafts}})()', context)
    expect(state.floorDirty.value).toBe(false)
    state.data.value.floors[0].name = 'Unsaved rename'
    expect(state.floorDirty.value).toBe(true)
    state.createInput.name = 'Unsaved new Floor'
    state.createInput.illustrationUrl = '/media/unsaved.png'
    state.pendingImage.value = true
    state.discardFloorDrafts()
    expect(state.floorDirty.value).toBe(false)
    expect(state.data.value.floors[0].name).toBe('Saved Floor')
    expect(state.createInput.name).toBe('')
    expect(state.pendingImage.value).toBe(false)
  })
  it('protects retained-parent child-route transitions until explicit discard', async () => {
    const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/floors', component: { render: () => null }, children: [{ path: ':id/georeference', component: { render: () => null } }] }] })
    await router.push('/floors')
    const f = fixture(1, false, /<UnsavedChangesGuard[^>]*guard-updates/.test(readFileSync('app/pages/admin/maps/[mapId]/floors.vue', 'utf8')))
    router.currentRoute.value.matched[0]!.updateGuards.add(f.updates[0]!)
    f.contexts[0]!.navigateTo = (path: string) => router.push(path)
    await router.push('/floors/floor/georeference')
    expect(router.currentRoute.value.fullPath).toBe('/floors')
    expect(vm.runInContext('open.value', f.contexts[0]!)).toBe(true)
    vm.runInContext('stay()', f.contexts[0]!)
    expect(router.currentRoute.value.fullPath).toBe('/floors')
    await router.push('/floors/floor/georeference')
    await vm.runInContext('discard()', f.contexts[0]!)
    expect(router.currentRoute.value.fullPath).toBe('/floors/floor/georeference')
  })
})


it('does not repeat a discarded form confirmation when a second dirty form blocks the same destination', async () => {
  const f = fixture(2)
  await vm.runInContext("navigateTo('/admin/dashboard')", f.contexts[0]!)
  await vm.runInContext('discard()', f.contexts[0]!)
  expect(f.destination()).toBe('')
  expect(f.contexts.map(c => vm.runInContext('open.value', c))).toEqual([false, true])
  await vm.runInContext('discard()', f.contexts[1]!)
  expect(f.destination()).toBe('/admin/dashboard')
  expect(f.contexts.map(c => vm.runInContext('open.value', c))).toEqual([false, false])
  await vm.runInContext("navigateTo('/admin/maps')", f.contexts[0]!)
  expect(f.destination()).toBe('/admin/dashboard')
  expect(vm.runInContext('open.value', f.contexts[0]!)).toBe(true)
})
