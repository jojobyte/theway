import { lit as html, isBrowser } from '../utils.js'

/**
 * An example of a simple route that does not need
 * to load any additional components or state
 *
 * @param {Request} req Request Data
 * @param {Response} res Response Data
 * @param {CallableFunction} next Advance to next route pattern
 */
async function createRoute(req, res, next) {
  const { entrypoint: app, activateCurrentNavLink } = this
  const alias = this.reroute?.value?.alias || ''

  console.log("createRoute about", [this, app, req.url, res?.finished]);

  app.innerHTML = html`
    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
  `

  activateCurrentNavLink(alias)

  if (!isBrowser()) {
    let op = app.htmlString.replace(
      `<main id="app"></main>`,
      app.innerHTML,
    )

    console.log('createRoute about server', app.innerHTML?.length, op?.length, res.send)

    res.send?.(op);
  }
}

export default createRoute
