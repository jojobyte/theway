# The Way

A tiny (zero dependency) isomorphic router for browsers & servers.

Originally forked from [NavAid](https://github.com/lukeed/navaid), but with some significant changes...

- History & Hash based routing for browser
- support express style routing (req,res,next) & middleware
- static file server

### Install
```sh
npm install theway
```

### Usage
```js
// app.js
import Way from 'theway'
import {
  loadRoute,
} from 'theway/utils.js'

const router = new Way('/');

export const createApp = (entrypoint, routeBase) => router
  .use("/", loadRoute('/path/to/route/home.js', entrypoint))
  .use(
    "/about",
    loadRoute('/path/to/route/about.js', entrypoint),
  )
  .use(
    "/thing/*?",
    loadRoute('/path/to/route/thing.js', entrypoint),
  )
  .use(
    "/compare/:crypto?/:fiat?",
    loadRoute('/path/to/route/compare.js', entrypoint),
  )

export default createApp
```

```js
// main.js - browser
import createApp from './app.js'

let app = createApp(
  document.querySelector('#app')
)

app.listen();
```

```js
// server.js
import http from 'node:http'
import { readFileSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { join, extname } from 'node:path'

import createApp from './app.js'

import {
  entrypoint,
  extensionToMimeType,
  serveStaticFiles,
} from 'theway/server.js'

const routeBase = import.meta?.dirname + '/routes/'
const entryPage = readFileSync('./index.html', 'utf8');
const fakeDOM = entrypoint(`<main id="app"></main>`, entryPage)

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
  .use(serveStaticFiles(join(import.meta.dirname, '../')))

httpServer.on('request', app.listen);

httpServer.listen(8080, () => {
  console.log('Listening on http://127.0.0.1:8080');
});
```
