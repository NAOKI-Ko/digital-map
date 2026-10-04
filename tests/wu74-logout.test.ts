import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

// Execute the real composable/guard scripts with Nuxt lifecycle adapters.
function source(file: string) {
  const raw = readFileSync(file, 'utf8')
  const script = file.endsWith('.vue') ? raw.split('<script setup lang="ts">')[1]!.split('</script>')[0]! : raw
  return ts.transpileModule(script.replace(/^import .*$/gm, '').replace('export function', 'function').replaceAll('import.meta.client', 'true'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText.replace('export {};', '')
}
function fixture(count = 2, fail = false) {
  const window = new EventTarget()
  const guards: Array<(to: { fullPath: string }) => boolean> = []
  const contexts: vm.Context[] = []
  let calls = 0, destination = ''
  for (let i = 0; i < count; i++) {
    const context = vm.createContext({
      window, CustomEvent,
      ref: (value: unknown) => ({ value }), defineProps: () => ({ dirty: true }),
      onMounted: (fn: () => void) => fn(), onBeforeUnmount: () => {},
      onBeforeRouteLeave: (fn: typeof guards[number]) => guards.push(fn),
      useUserSession: () => ({ fetch: async () => {} }),
      $fetch: async () => { calls++; if (fail) throw Error('network'); },
      navigateTo: async (path: string) => { if (guards.every(guard => guard({ fullPath: path }) !== false)) destination = path },
    })
    vm.runInContext(source('app/composables/useAuth.ts') + '\n' + source('app/components/admin/UnsavedChangesGuard.vue'), context)
    contexts.push(context)
  }
  return { contexts, calls: () => calls, destination: () => destination }
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
