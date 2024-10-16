import { lit as html, isBrowser } from '../utils.js'

async function createRoute(req, res, next) {
  const { entrypoint: app, activateCurrentNavLink } = this
  const alias = this.reroute?.value?.alias || ''

  console.log("createRoute tasks", [this, app, req.url, res?.finished]);

  function render() {
    app.innerHTML = html`
      <div>
        <h2>Tasks</h2>
        <div class="tasks">
        </div>
      </div>
    `
    activateCurrentNavLink(alias)
  }

  async function loadBrowser(req, res, next) {

    return function unload() {
    }
  }

  async function loadServer(req, res, next) {
    let op = app.htmlString.replace(
      `<main id="app"></main>`,
      app.innerHTML,
    )

    console.log('createRoute tasks loadServer', app.innerHTML?.length, op?.length, res.send)

    res.send?.(op);
  }

  async function load(req, res, next) {
    console.log("createRoute tasks load", [!!app, req.url, res?.finished]);
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
