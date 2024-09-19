let currentSignal;

/**
 * Code Highlighting for String Literals.
 *
 * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#raw_strings MDN Reference}
 *
 * @example
 *    import { lit as html, lit as css } from './utils.js'
 *    let h = html`<div><span>${example}</span></div>`
 *    let c = css`div > span { color: #bad; }`
 *
 *    // falsy values now default to empty string
 *    let i = html`<div>${doesNotExist && html`<img src="a.png">`}</div>`

 *    // i === '<div></div>'
 *    // instead of
 *    // i === '<div>undefined</div>'
 *
 * @param {TemplateStringsArray} s
 * @param  {...any} v
 *
 * @returns {string}
 */
export const lit = (s, ...v) => String.raw({ raw: s }, ...(v.map(x => x || '')))

/**
 * Creates a reactive signal
 *
 * Inspired By
 * {@link https://gist.github.com/developit/a0430c500f5559b715c2dddf9c40948d Valoo} &
 * {@link https://dev.to/ratiu5/implementing-signals-from-scratch-3e4c Signals from Scratch}
 *
 * @example
 *    let count = createSignal(0)
 *    console.log(count.value) // 0
 *    count.value = 2
 *    console.log(count.value) // 2
 *
 *    let off = count.on((value) => {
 *      document.querySelector("body").innerHTML = value;
 *    });
 *
 *    off();
 *
 * @param {Object} initialValue initial value
*/
export function createSignal(initialValue) {
  let _value = initialValue;
  let _last = _value;
  let subs = [];

  function pub() {
    for (let s of subs) {
      s && s(_value, _last);
    }
  }

  function unsub(fn) {
    for (let i in subs) {
      if (subs[i] === fn) {
        subs[i] = 0;
      }
    }
  }

  function on(s) {
    const i = subs.push(s)-1;
    return () => { subs[i] = 0; };
  }

  function once(s) {
    const i = subs.length

    subs.push((_value, _last) => {
      s && s(_value, _last);
      subs[i] = 0;
    });
  }

  return {
    get value() {
      if (currentSignal) {
        on(currentSignal)
      }
      return _value;
    },
    set value(v) {
      _last = _value
      _value = v;
      pub();
    },
    on,
    once,
    unsub,
  }
}

/**
 * Use a reactive signal in hook fashion
 *
 * @example
 *    let [count, setCount, on] = useSignal(0)
 *    console.log(count) // 0
 *    setCount(2)
 *    console.log(count) // 2
 *
 *    let off = on(value => {
 *      document.querySelector("body").innerHTML = value;
 *    });
 *
 *    off()
 *
 * @param {Object} initialValue initial value
*/
export function useSignal(initialValue) {
  let _value = initialValue;
  let _last = _value;
  let subs = [];

  function pub() {
    for (let s of subs) {
      s && s(_value, _last);
    }
  }

  function unsub(fn) {
    for (let i in subs) {
      if (subs[i] === fn) {
        subs[i] = 0;
      }
    }
  }

  function getValue(v) {
    if (currentSignal) {
      on(currentSignal)
    }
    return _value;
  }

  function setValue(v) {
    _last = _value
    _value = v;
    pub();
  }

  function on(s) {
    const i = subs.push(s)-1;
    return () => { subs[i] = 0; };
  }

  function once(s) {
    const i = subs.length

    subs.push((_value, _last) => {
      s && s(_value, _last);
      subs[i] = 0;
    });
  }

  return [
    getValue,
    setValue,
    on,
    once,
    unsub,
  ]
}

/**
 * Creates a reactive event
 *
 * @example
 *    let count = hearken(0)
 *    console.log(count.value) // 0
 *    count.value = 2
 *    console.log(count.value) // 2
 *
 *    let off = count.on((value) => {
 *      document.querySelector("body").innerHTML = value;
 *    });
 *
 *    off();
 *
 * @param {Object} initialValue initial value
*/
export function hearken(
  initialValue,
  type = 'signal',
  target = globalThis?.document,
  options = false,
  eventOpts = {
    bubbles: false,
    cancelable: false,
    composed: false,
  },
) {
  let _value = initialValue;
  let _last = _value;
  let subFn = () => ([_value, _last])
  let eventFn = () => new CustomEvent(type, {
    ...eventOpts,
    detail: {
      _value,
      _last,
    },
  });

  function pub() {
    target.dispatchEvent(eventFn())
  }

  return {
    get value() { return _value; },
    set value(v) {
      _last = _value
      _value = v;
      pub();
    },
    on: s => {
      subFn = (e) => s(_value, _last, e)
      target.addEventListener(type, subFn, options)

      return () => {
        target.removeEventListener(type, subFn, options);
      }
    },
    once: s => {
      subFn = (e) => {
        target.removeEventListener(type, subFn, options);
        return s(_value, _last, e)
      }
      target.addEventListener(type, subFn, options)
    },
  }
}

/**
 * {@link https://youtu.be/t18Kzj9S8-M?t=351 Understanding Signals}
 *
 * {@link https://youtu.be/1TSLEzNzGQM Learn Why JavaScript Frameworks Love Signals By Implementing Them}
 *
 * @example
 *   const [count, setCount] = useSignal(10)
 *   effect(() => console.log(count))
 *   setCount(25)
 *
 * @param {Function} fn
 *
 * @void
 */
export function effect(fn) {
  currentSignal = fn;

  fn();

  currentSignal = null;
}

/**
 * {@link https://youtu.be/1TSLEzNzGQM Learn Why JavaScript Frameworks Love Signals By Implementing Them}
 *
 * @example
 *   let count = createSignal(10)
 *   let double = derived(() => count.value * 2)
 *
 *   effect(
 *     () => console.log(
 *       count.value,
 *       double.value,
 *     )
 *   )
 *
 *   count.value = 25
 *
 * @param {Function} fn
 */
export function derived(fn) {
  const derived = createSignal()

  effect(() => {
    derived.value = fn()
  })

  return derived
}

/**
 * A wrapper around `fetch` that gets the body as text,
 * attempts to parse body text as json,
 * and returns the JSON or the text if JSON parsing fails.
 *
 * {@link https://developer.mozilla.org/docs/Web/API/fetch MDN fetch Reference}
 *
 *
 * @example
 *    let data = await summon(`https://api.b.c/v1/count`)
 *    console.log(data) // { total: 123 }
 *
 *    let count = data?.total || 0
 *    console.log(count) // 123 || 0
 *
 * @param {URL | RequestInfo} url Location
 * @param {RequestInit} [init] Optional object defining method, headers and/or body
 *
 * @returns {Promise<String | any>}
*/
export async function summon(url, init = {}) {
  let data

  try {
    const req = await fetch(url, init)

    if (req.ok) {
      data = await req.text()

      try {
        let jsonData = JSON.parse(data)
        data = jsonData
      } catch (err) {
        console.warn('JSON Parse error', err)
      }
    }
  } catch (fetchErr) {
    console.warn('Fetch error', fetchErr)
  }

  return data
}

/**
 * Inspired By
 * See {@link https://github.com/vuejs/core-vapor/blob/main/packages/runtime-vapor/src/dom/template.ts Vue Vapor Runtime on Github} &
 * {@link https://vapor-repl.netlify.app/ Vue Vapor SFC Playground}
 *
 *
 * Create a template element in `document` using the provided HTML
 *
 * @example
 *    const t0 = template('<button></button>')
 *
 * @param {string} html HTML source
 *
 * @returns {Node | ChildNode}
 *
 * @license MIT
 * {@link https://github.com/vuejs/core-vapor/blob/main/LICENSE License}.
*/
export function template(html, elementOnly = true) {
  let node

  const create = () => {
    // eslint-disable-next-line no-restricted-globals
    const t = globalThis?.document.createElement('template')
    t.innerHTML = html // ?.trim()
    return t.content[elementOnly ? 'firstElementChild' : 'firstChild']
  }

  return () => (node || (node = create())).cloneNode(true)
}

/**
 * Find a child node by path number
 *
 * @example
 *    const parentBtn = template('<button><span></span></button>')
 *    const childSpan = children(parentBtn, 0)
 *    childSpan === `<span></span>`
 *
 * @param {Node | ChildNode} node Parent Node
 * @param {number[]} paths Indexes of node in document
 *
 * @returns {Node | ChildNode}
 *
 * @license MIT
 * {@link https://github.com/vuejs/core-vapor/blob/main/LICENSE License}.
*/
export function children(node, ...paths) {
  for (const idx of paths) {
    for (let i = 0; i <= idx; i++) {
      node = node[i === 0 ? 'firstChild' : 'nextSibling']
    }
  }
  return node
}

/**
 * Find a child element node by path number
 *
 * @example
 *    const parentBtn = template('<button><span></span></button>')
 *    const childSpan = elements(parentBtn, 0)
 *    childSpan === `<span></span>`
 *
 * @param {Node | ChildNode} node Parent Node
 * @param {number[]} paths Indexes of node in document
 *
 * @returns {Node | ChildNode}
 *
 * @license MIT
 * {@link https://github.com/vuejs/core-vapor/blob/main/LICENSE License}.
*/
export function elements(node, ...paths) {
  for (const idx of paths) {
    for (let i = 0; i <= idx; i++) {
      node = node[i === 0 ? 'firstElementChild' : 'nextElementSibling']
    }
  }
  return node
}

/**
 * Find a sibling node by offset number
 *
 * @example
 *    const parentBtn = template(`
 *      <button>
 *        <span></span>
 *        <svg class="icon"></svg>
 *      </button>
 *    `)
 *    const childSpan = children(parentBtn, 0)
 *    const childSvg = sibling(childSpan, 1)
 *    childSvg === `<svg class="icon"></svg>`
 *
 * @param {Node | ChildNode} node Parent Node
 * @param {number} offset HTML source
 *
 * @returns {Node | ChildNode}
 *
 * @license MIT
 * {@link https://github.com/vuejs/core-vapor/blob/main/LICENSE License}.
*/
export function sibling(node, offset, elementOnly = true) {
  for (let i = 0; i < offset; i++) {
    node = node[elementOnly ? 'nextElementSibling' : 'nextSibling']
  }
  return node
}

/**
 * Detects if `window` & `document` are not undefined.
 *
 * @returns {boolean}
 */
export function isBrowser() {
  return ![
    typeof window,
    typeof document
  ].includes('undefined')
}

/**
 * Detects the base path, useful for loading files & routes.
 *
 * Browser looks for base href in HTML: `<base href="/example/" />`
 *
 * Server looks for current working directory: `import.meta?.dirname + '/'`
 *
 * @returns {string}
 */
export const basePath = () => {
  if (!isBrowser()) {
    return import.meta?.dirname + '/'
  }

  let baseURI = new URL(globalThis?.document?.baseURI)

  if (baseURI.pathname === globalThis?.window?.location.pathname) {
    return '/'
  }

  if (!baseURI.pathname.endsWith('/')) {
    return `${baseURI.pathname}/`
  }

  return baseURI.pathname

  // return isBrowser() ?
  //   baseURI?.pathname :
  //   import.meta?.dirname + '/'
}

/**
 * Combines `base` with the `route` string like `home`,
 * then appends the file extension (default `js`)
 *
 * @example
 *    const homeRoute = routePath('home')
 *    // homeRoute === '/project/routes/home.js'
 *
 *    const aboutRoute = routePath(
 *      'about',
 *      '/diff-project/',
 *      'mjs'
 *    )
 *    // aboutRoute === '/diff-project/about.mjs'
 *
 * @param {string} route
 * @param {string} [base=./routes/]
 * @param {string} [extension=js]
 *
 * @returns {string}
 */
export const routePath = (
  route,
  base = `${basePath() || './'}routes/`,
  extension = 'js',
) => {
  console.log('routePath', {route, base, basePath: basePath(), extension})
  if (!base.endsWith('/')) {
    base = `${base}/`
  }
  return `${base}${route}.${extension}`
}
