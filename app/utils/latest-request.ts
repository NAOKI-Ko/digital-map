export function createLatestRequestGate() {
  let generation = 0

  return {
    begin() {
      generation += 1
      return generation
    },
    isCurrent(request: number) {
      return request === generation
    },
    invalidate() {
      generation += 1
    },
  }
}
