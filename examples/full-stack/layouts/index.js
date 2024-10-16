import { lit as html } from '../utils.js'

/**
 * Create Navigation Anchor
 *
 * @example
 *    let anchor = anchor.call(this, {
 *      href: '/',
 *      alias: 'home',
 *      inner: 'Home',
 *    })
 *    anchor === `<a href="/" data-alias="home" class="active">Home</a>`
 *
 * @param  {{ href: string, alias: string, inner: string, }} config
 *
 * @returns {string}
 */
function anchor(config) {
  let { alias, href, inner } = config
  let current = this?.reroute?.value?.alias
  let dataAlias = alias ? html` data-alias="${alias}"` : ''
  let active = current === alias ? html` class="active"` : ''
  return `<a href="${href}"${dataAlias}${active}>${inner}</a>`
}

const navAnchors = [
  { href: '/', alias: 'home', inner: 'Home' },
  { href: '/about', alias: 'about', inner: 'About' },
  { href: '/tasks', alias: 'tasks', inner: 'Tasks' },
]

function createLayout(routeView = '') {
  console.log("createLayout: index", { that: this, routeView }, this.reroute.value);

  return html`
    <header>
      <h1><a href="/">The Vanilla Way</a></h1>
    </header>
    <aside>
      <nav>
        ${navAnchors.map(a => anchor.call(this, a)).join('')}
      </nav>
    </aside>
    <section id="entrypoint">
      ${routeView}
    </section>
    <footer>
    </footer>
  `
}

export default createLayout
