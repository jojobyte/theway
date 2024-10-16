import { lit as html, isBrowser } from '../utils.js'
import { setupCounter } from '../components/counter.js'
import { setupLazy } from '../components/lazy.js'
import { setupBar } from '../components/bar.js'

/**
 * A Complex route example that loads components on initial
 * load and as a lazy load after a button is clicked, and
 * provides load & unload callbacks which can be used to
 * add/remove event listeners and the like
 *
 * @param {Request} req Request Data
 * @param {Response} res Response Data
 * @param {CallableFunction} next Advance to next route pattern
 */
async function createRoute(req, res, next) {
  const { entrypoint: app, activateCurrentNavLink } = this
  const alias = this.reroute?.value?.alias || ''

  console.log("createRoute home", [this, app, req.url, res?.finished]);

  function render() {
    app.innerHTML = html`
      <div>
        <div class="card">
          <div id="lbar"></div>
          <div id="bar"></div>
        </div>
        <div class="card">
          <button id="counter" type="button"></button>
        </div>
        <div class="card">
          <button id="lazy" type="button">Load Async</button>
        </div>
      </div>
    `

    activateCurrentNavLink(alias)
  }

  async function loadBrowser(req, res, next) {
    let lazy
    let lazyEl = app.querySelector('#lazy')

    let unsubscribeCounter = setupCounter(app.querySelector('#counter'))
    let unsubscribeBar = setupBar(app.querySelector('#bar'))

    let click = async e => {
      if (e.target?.id === 'lazy') {
        console.log('lazy', lazy)
        if (lazy?.[1]) {
          lazy[1]?.()
          lazy = undefined
          lazyEl.innerHTML = `Load Async`
        } else {
          lazy = await setupLazy(app.querySelector('#lbar'))
          lazyEl.innerHTML = `Unload Async`
        }
      }
    }

    globalThis?.document?.addEventListener?.('click', click)

    return function unload() {
      unsubscribeCounter?.[1]?.()
      unsubscribeBar?.[1]?.()
      lazy?.[1]?.()
      globalThis?.document?.removeEventListener?.('click', click)
    }
  }

  async function loadServer(req, res, next) {
    let op = app.htmlString.replace(
      `<main id="app"></main>`,
      app.innerHTML,
    )

    console.log('createRoute home loadServer', app.innerHTML?.length, op?.length, res.send)

    res.send?.(op);
  }

  async function load(req, res, next) {
    console.log("createRoute home load", [!!app, req.url, res?.finished]);
    let unloadServer, unloadBrowser

    render()

    if (isBrowser()) {
      unloadBrowser = await loadBrowser(req, res, next)
    } else {
      unloadServer = await loadServer(req, res, next)
    }

    return function unload() {
      unloadBrowser?.()
      unloadServer?.()
    }
  }

  return {
    load,
    unload: await load(req, res, next)
  }
}

export default createRoute
