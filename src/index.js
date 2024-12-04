import {
  ROUTER_TYPE,
  HTTP_METHODS,
  createSignal,
  isBrowser,
  settled,
  handleClick,
  activateCurrentNavLink,
  lit,
} from './utils.js'

import {
  routeRegex,
  patternToRegex,
} from './patterns.js'

/**
 * Originally based on
 * {@link https://github.com/lukeed/navaid NavAid}.
 * Heavily modified to support Hash & Server side routing,
 * as well as a more express-like structure
*/
function Way(
  base = '/',
  config = {},
) {
  let {
    layout = '',
    layouts = {},
    entrypoint = null,
    handleErrors = (req, res, next, ...args) => {
      let err404 = `404 Not Found`

      console.error('routing error', req.url, err404, ...args)

      if (!isBrowser()) {
        if (!res.headersSent) {
          res.writeHead?.(404, { 'Content-Type': 'text/html' });
        }
        if (!res.writableEnded) {
          res.end?.(`<h1>${err404}</h1>`);
        }
        return;
      } else {
        if (config.entrypoint) {
          config.entrypoint.innerHTML = `<h1>${err404}</h1>`
        }
        return next(err404)
      }
    },
    serveStaticFiles = () => {
      let msg = `try \`importing serveStaticFiles from 'theway/server.js'\``
      console.warn(msg)
      return async (req, res, next) => !res?.finished && (res?.end?.(msg) || next())
    },
  } = config

  const RTE = routeRegex(base)

  let currentRoute, rerouteOff,
      routes = [],
      type = ROUTER_TYPE.HIST

  if (base[0] === '#') {
    type = ROUTER_TYPE.HASH
  }

  if (!isBrowser()) {
    type = ROUTER_TYPE.REQ
  }

  this.navigate = async (
    req = {},
    res = function() {},
    next = function() {},
  ) => {
    let {
      method = 'GET',
      url = type !== ROUTER_TYPE.REQ ? location?.pathname + (
        type === ROUTER_TYPE.HASH ? (location?.hash || base) + '/' : ''
      ) : '',
    } = req

    url = !['/','#'].includes(base) ? url.split(base)?.[1] : url

    if (RTE.test(url)) {
      url = `/${RTE.exec(url)?.groups?.route}`
    }

    if (url === base) {
      url = '/'
    }

    req.url = url

    if (url) {
      let param, route,
        i = 0, p = 0,
        params = {}, found = 0;

      for (currentRoute = url; i < routes.length; i++) {
        if (req.alias) {
          routes[i].alias = req.alias
        }
        route = routes[i]
        param = route.regex?.exec?.(url)

        req.route = route
        req.pattern = route.path

        if (
          route.isMiddleware && route.fns?.length > 0
        ) {
          let allSettled = await settled.call(this, route, req, res, next)

          if (allSettled.find(s => !!s)) {
            return this
          }
        }

        if (
          param && !route.isMiddleware && (
            !route.method || route.method === method
          )
        ) {
          for (p=0; p < route.keys.length;) {
            params[route.keys[p]] = param[++p] || null;
          }

          req.params = params

          await settled.call(this, route, req, res, next)

          found++;
        }
      }

      if (found > 0) {
        return this;
      }

      handleErrors?.(req, res, next);
    }

    return this;
  }

  if (type !== ROUTER_TYPE.REQ) {
    this.reroute = createSignal({
      state: history.state || {},
      url: base,
    })
  }

  this.route = (req, res, next) => {
    let request = {}

    if (typeof req === 'object') {
      request = req
    }

    if (typeof req === 'string') {
      request.url = req
    }

    if (this.reroute) {
      this.reroute.value = request
    } else {
      this.navigate(request, res, next)
    }
  }

  this.click = handleClick({ base, RTE, route: this.route })

  this.activateCurrentNavLink = activateCurrentNavLink

  this.static = serveStaticFiles

  this.use = (...args) => {
    let method, path, fns
    let pathRegex = {}

    if (
      typeof args[0] === 'function' ||
      args[0] instanceof Promise
    ) {
      fns = [...args]
      pathRegex.fns = fns;
      pathRegex.isMiddleware = true
      routes.push(pathRegex);
      return this;
    }
    if (typeof args[1] === 'string') {
      method = args.shift()
    }

    path = args.shift()
    fns = [...args]

    pathRegex = {
      ...patternToRegex(path),
      fns,
      method,
    }

    routes.push(pathRegex);
    return this;
  }

  for (let method of HTTP_METHODS) {
    this[method] = (...args) => {
      if (
        method === 'get' &&
        args.length === 1 &&
        typeof args[0] === 'string'
      ) {
        return config[args[0]]
      }

      return this.use.call(this, method.toUpperCase(), ...args)
    }
  }

  this.set = (key, value) => {
    config[key] = value
    return this
  }

  /** @type {lit} */
  this.useLayout = (...args) => {
    let layoutArg = args.shift()

    if (layoutArg) {
      this.set('layout', layoutArg)
    }

    if (
      typeof config.layouts[config.layout] === 'function'
    ) {
      return config.layouts[config.layout]?.apply(this, args)
    }

    return lit.apply(this, args)
  }

  const rerouteUnsub = () => this.reroute.on(req => {
    history[
      req.url === currentRoute ? 'replaceState' : 'pushState'
    ](req.state, '', req.url);

    this.navigate(req)
  })

  Object.defineProperties(this, {
    routes: {
      enumerable: true,
      get() { return routes; },
    },
    config: {
      enumerable: true,
      get() { return config; },
      set(v) {
        config = v
      },
    },
    entrypoint: {
      enumerable: true,
      get() { return config.entrypoint; },
      set(v) {
        config.entrypoint = v
      },
    },
    listen: {
      get() {
        return (...args) => {
          if (type !== ROUTER_TYPE.REQ) {
            addEventListener(type, this.navigate)
            addEventListener('click', this.click)
            rerouteOff = rerouteUnsub()
          }

          this.route(...args)

          return this
        }
      },
    },
    unlisten: {
      get() {
        return (...args) => {
          if (type !== ROUTER_TYPE.REQ) {
            removeEventListener(type, this.navigate)
            removeEventListener('click', this.click)
            rerouteOff?.()
          }

          return this
        }
      },
    },
  });
}

export default Way
