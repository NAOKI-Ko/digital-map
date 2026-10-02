/** Screen positions only. A bounded, scrollable grid handles groups larger than the viewport. */
export function spiderfyLayout(count: number, center: { x: number, y: number }, width: number, height: number, size = 76) {
  if (count <= 8 && count > 1) {
    const radius = Math.max(size, size / (2 * Math.sin(Math.PI / count)))
    const side = 2 * radius + size
    if (side <= width-32 && side <= height-120) {
      return { left:Math.max(16,Math.min(width-side-16,center.x-side/2)), top:Math.max(60,Math.min(height-side-60,center.y-side/2)), width:side,height:side,contentHeight:side,
        points:Array.from({length:count},(_,i)=>({x:side/2+radius*Math.cos(-Math.PI/2+2*Math.PI*i/count),y:side/2+radius*Math.sin(-Math.PI/2+2*Math.PI*i/count)+size/2-8})) }
    }
  }
  const columns = Math.max(1, Math.min(count, Math.floor((width - 32) / size), Math.ceil(Math.sqrt(count))))
  const rows = Math.ceil(count / columns)
  const contentWidth = columns * size, contentHeight = rows * size
  const viewHeight = Math.min(contentHeight, Math.max(size, height - 120))
  const left = Math.max(16, Math.min(width - contentWidth - 16, center.x - contentWidth / 2))
  const top = Math.max(60, Math.min(height - viewHeight - 60, center.y - viewHeight / 2))
  return { left, top, width: contentWidth, height: viewHeight, contentHeight,
    points: Array.from({ length: count }, (_, i) => ({ x: (i % columns + .5) * size, y: (Math.floor(i / columns) + 1) * size - 8 })) }
}
