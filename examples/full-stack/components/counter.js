import { COUNT } from '../store.js'

export function setupCounter(element) {
  const setCounter = (count) => COUNT.value = count
  const listener = () => setCounter(
    COUNT.value + (Math.floor(Math.random() * 9)+1)
  )
  let unsubCount = COUNT.on((v, p) => {
    console.log('COUNTER', v, p)
    element.innerHTML = `count is ${v}`
  })
  const unsub = () => {
    unsubCount()
    element.removeEventListener('click', listener)
  }

  element.addEventListener('click', listener)

  setCounter(COUNT.value)

  return [COUNT.value, unsub]
}
