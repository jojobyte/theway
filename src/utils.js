export const HTTP_METHODS = ['get','post','put','patch','delete']

export const HIST = 'popstate'
export const HASH = 'hashchange'
export const REQ = 'request'

export const ROUTER_TYPE = {
  HIST,
  HASH,
  REQ
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

const importedRoutes = createSignal({})
const lastRoute = createSignal('')

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

  function on(s) {
    const i = subs.push(s)-1;
    return () => { subs[i] = 0; };
  }

  return {
    get value() {
      return _value;
    },
    set value(v) {
      _last = _value
      _value = v;
      pub();
    },
    on,
  }
}

/**
 * Import a JS file that handles a route
 *
 * @example
 *    const app = document.querySelector('#app')
 *    let route = loadRoute('/dir/thing.js', app)
 *
 * @param {string} route The filename of the route to load excluding the extension & directory
 * @param {Element} app The element to render content to
*/
export const loadRoute = (
  route,
  app,
) => async (req, res, next) => {
  let loaded
  if (
    lastRoute.value !== route &&
    importedRoutes.value?.[lastRoute.value]?.unload
  ) {
    let unloadedRoute = await importedRoutes.value[lastRoute.value].unload?.()
    // console.log('unloadedRoute', lastRoute.value, unloadedRoute)
  }

  // console.log("loadRoute", {route, url: req.url});

  if (
    !importedRoutes.value?.[route]?.load
  ) {
    if (
      !importedRoutes.value?.[route]?._def
    ) {
      let importRoute = await import(route)
      importedRoutes.value[route] = {
        _def: importRoute.default,
        ...(await importRoute.default(app, req, res, next) || {})
      }
    } else {
      loaded = await importedRoutes.value[route]._def(app, req, res, next)
    }
  } else {
    let renderRoute = await importedRoutes.value[route].load?.(req, res, next)
    if (renderRoute) {
      importedRoutes.value[route] = {
        ...importedRoutes.value[route],
        unload: renderRoute
      }
    }
  }

  lastRoute.value = route

  return importedRoutes.value[route]
}

export const next = (resolve, reject) => (err) => {
  if (err) {
    return reject(err)
  }
  return resolve()
}

export const settler = (
  callback, req, res, next,
) => new Promise(async (resolve, reject) => {
  res.send = (...args) => {
    if (!isBrowser()) {
      let [
        body = '',
        status = 200,
        headers = { 'Content-Type': 'text/html' },
      ] = args

      res.writeHead?.(status, headers);
      res.end?.(body);
    }

    return resolve(...args)
  }
  res.json = (...args) => {
    if (!isBrowser()) {
      let [
        body = '',
        status = 200,
        headers = { 'Content-Type': 'application/json' },
      ] = args

      res.writeHead?.(status, headers);
      res.end?.(body);
    }

    return resolve(...args)
  }
  res.resolve = resolve
  res.reject = reject

  return callback?.(
    req,
    res,
    resolve,
  )
})

export async function settled(route, req, res, next) {
  let all = []

  for (let f = 0; f < route.fns.length; f++) {
    all.push(await settler(route.fns[f], req, res, next))
  }

  return all
}

export const handleClick = ({ base, RTE, route }) => (event) => {
  let anchor = event.target.closest('a')
  let href = anchor?.getAttribute('href')

  if (
    event.ctrlKey || event.metaKey || event.altKey || event.shiftKey ||
    event.button || event.defaultPrevented || !href ||
    anchor.target || anchor.host !== location.host || href[0] === '#'
  ) {
    return;
  }

  // console.log('router click', { event, anchor, href })

  if (href[0] !== base || RTE.test(href)) {
    event.preventDefault();
    route(href);
  }
}
