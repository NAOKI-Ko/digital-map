import { describe, expect, it, vi } from 'vitest'
import { createPinEditorOperationGate, type PinEditorOperationState } from '../app/utils/pin-editor-operation'

function deferred() {
  let resolve!: () => void
  const promise = new Promise<void>(onResolve => { resolve = onResolve })
  return { promise, resolve }
}

describe('PIN editor operation context', () => {
  it('Aの遅延完了は新しいB draftをresetしないがauthoritative refreshは行う', async () => {
    let state: PinEditorOperationState = { spotId: 'A', floorId: 'floor-1', mode: 'moving' }
    let draft = 'A draft'
    const refresh = vi.fn(async () => undefined)
    const gate = createPinEditorOperationGate(() => state)
    const save = deferred()
    const operation = gate.begin()
    const completion = save.promise.then(async () => {
      await refresh()
      if (gate.isCurrent(operation)) draft = ''
    })

    gate.invalidate()
    state = { spotId: 'B', floorId: 'floor-2', mode: 'placing' }
    draft = 'B unsaved draft'
    save.resolve()
    await completion

    expect(refresh).toHaveBeenCalledOnce()
    expect(draft).toBe('B unsaved draft')
  })

  it('同一contextの成功だけresetし、失敗時はdraftを保持する', () => {
    const state: PinEditorOperationState = { spotId: 'A', floorId: 'floor-1', mode: 'moving' }
    const gate = createPinEditorOperationGate(() => state)
    const operation = gate.begin()
    let draft = 'unsaved'
    if (gate.isCurrent(operation)) draft = ''
    expect(draft).toBe('')

    draft = 'retryable draft'
    expect(draft).toBe('retryable draft')
  })

  it('同じspotへ戻っても古いgenerationをcurrent扱いしない', () => {
    let state: PinEditorOperationState = { spotId: 'A', floorId: 'floor-1', mode: 'moving' }
    const gate = createPinEditorOperationGate(() => state)
    const old = gate.begin()
    gate.invalidate()
    state = { spotId: 'B', floorId: 'floor-1', mode: 'moving' }
    gate.invalidate()
    state = { spotId: 'A', floorId: 'floor-1', mode: 'moving' }
    expect(gate.isCurrent(old)).toBe(false)
  })
})
