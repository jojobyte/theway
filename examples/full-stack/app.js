
// import Way from 'theway'
// import {
//   loadRoute,
// } from 'theway/utils.js'

import Way from '../../src/index.js'
import {
  loadRoute,
} from '../../src/utils.js'

import { routePath } from './utils.js'

const router = new Way('/');

export const createApp = (entrypoint, routeBase) => router
  .set('entrypoint', entrypoint)
  .use("/", loadRoute(routePath('home', routeBase), entrypoint))
  .use(
    "/about",
    loadRoute(routePath('about', routeBase), entrypoint),
  )
  .use(
    "/thing/*?",
    loadRoute(routePath('thing', routeBase), entrypoint),
  )

export default createApp
