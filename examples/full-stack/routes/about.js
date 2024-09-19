import { lit as html, isBrowser } from '../utils.js'

function createRoute(app, req, res, next) {
  console.log("createRoute about", [!!app, req.url, res?.finished]);

  app.innerHTML = html`
    <h1>About</h1>
  `

  if (!isBrowser()) {
    let { entryPage } = app
    let op = entryPage.replace(
      `<main id="app"></main>`,
      app.innerHTML,
    )

    console.log('createRoute about server', app.innerHTML?.length, op?.length)

    res.send?.(op);
  }
}

export default createRoute
