import type { PinEditorMode } from './pin-editor-state'

export interface PinEditorOperationState {
  spotId: string
  floorId: string
  mode: PinEditorMode
}

export interface PinEditorOperationContext extends PinEditorOperationState {
  generation: number
}

export function createPinEditorOperationGate(readState: () => PinEditorOperationState) {
  let generation = 0
  return {
    invalidate() { generation += 1 },
    begin(): PinEditorOperationContext { return { ...readState(), generation } },
    isCurrent(operation: PinEditorOperationContext) {
      const current = readState()
      return operation.generation === generation
        && operation.spotId === current.spotId
        && operation.floorId === current.floorId
        && operation.mode === current.mode
    },
  }
}
