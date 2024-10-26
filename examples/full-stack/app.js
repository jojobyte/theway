
// import Way from 'theway'
// import {
//   loadRoute,
// } from 'theway/utils.js'

import Way from '../../src/index.js'
import {
  loadRoute,
} from '../../src/utils.js'

import { routePath, isBrowser } from './utils.js'
import BaseLayout from './layouts/index.js'

const router = new Way('/');

export const createApp = (entrypoint, routeBase) => router
  .set('entrypoint', entrypoint)
  .set('layout', 'BaseLayout')
  .set('layouts', { BaseLayout })
  .use(
    (req, res, next) => {
      let layout = router.get('layout')

      const { useLayout, entrypoint: app } = router

      if (app.id === 'app') {
        app.innerHTML = useLayout(layout)
      }

      if (isBrowser() && app.id !== 'entrypoint') {
        const ep = app.querySelector('#entrypoint')
        router.set('entrypoint', ep)
      }

      next()
    }
  )
  .use("/", loadRoute(routePath('home', routeBase), 'home'))
  .use(
    "/about",
    loadRoute(routePath('about', routeBase), 'about'),
  )
  .use(
    "/tasks/*?",
    loadRoute(routePath('tasks', routeBase), 'tasks'),
  )

export default createApp
