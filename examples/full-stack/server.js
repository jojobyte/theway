import http from 'node:http'
import { readFileSync } from 'node:fs'
const { join } = await import('node:path')

import createApp from './app.js'

// import {
//   DOMFaker,
//   serveStaticFiles,
// } from 'theway/server.js'
import {
  DOMFaker,
  serveStaticFiles,
} from '../../src/server.js'

const BASE = /<base href="([\s\S]+?)" \/>/ig
const routeBase = import.meta?.dirname + '/routes/'
const theWaySrcDir = join(import.meta.dirname, '../../')
let entryPage = readFileSync('./index.html', 'utf8')
entryPage = entryPage.replace(BASE, '')
const fakeDOM = DOMFaker(`<main id="app"></main>`, entryPage)

const httpServer = http.createServer();

const app = createApp(
  fakeDOM,
  routeBase,
)

app
  .get("/api/users", async ({params}, res, next) => {
    try {
      let req = await fetch(
        'https://dummyjson.com/users?limit=3&select=firstName,age',
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (req.ok) {
        let users = await req.text()

        if (users) {
          console.log('router get /api/users', params, users)

          return res.json(users)
        }
      }
    } catch (err) {
      next(err)
    }

    next('failed to retrieve users data')
  })
  .get('/src/*', await serveStaticFiles(theWaySrcDir, {
    entrypoint: fakeDOM,
  }))
  .use(await serveStaticFiles(join(import.meta.dirname, './')))

httpServer.on('request', app.listen);

httpServer.listen(8080, () => {
  console.log('Listening on http://127.0.0.1:8080');
});
