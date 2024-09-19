export async function setupLazy(element) {
  let { COUNT } = await import('../store.js')

  console.log('setupLazy', element, COUNT)

  const setCounter = (count) => {
    count = count > -1 ? count : 0
    COUNT.value = count
  }
  const render = (v, p) => {
    let n = Number(v) * 3

    console.log('LAZY BAR', v, p, n)

    element.style = `width: ${n}px;`
  }
  const listener = () => setCounter(COUNT.value - 5)
  const unsubCount = COUNT.on(render)
  const unsub = () => {
    unsubCount()
    element.removeEventListener('click', listener)
  }

  element.addEventListener('click', listener)

  render(COUNT.value)

  return [COUNT.value, unsub]
}
