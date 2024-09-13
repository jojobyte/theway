import { isBrowser } from './utils.js'

export const serveStaticFiles = (dir, options) => {
  let {
    readFile,
    join,
    extname,
  } = options

  if (!isBrowser() && readFile && join && extname) {
    return async (req, res, next) => {
      let { url } = req
      let path = join(dir, url)

      if (url === '/' || path.endsWith('/')) {
        next()
        return this
      }

      if (!path.endsWith('/')) {
        let file = readFile(path, { encoding: 'utf8' })
        file.then(fd => {
          res.send(fd, 200, {
            'Content-Type': extToMime(extname(path).substring(1))
          })

          return this
        })
        .catch(next)
      }

      next()
    }
  }

  return this
}

export function query(selector) {
  let cells = []

  selector?.split(' ').forEach(e => {
    let found = {
      el: '',
      attrs: [],
    }

    if (e.indexOf('#') > -1) {
      let [el,id] = e.split('#')
      let atr = `id=\\"${id}\\"`
      if (el) {
        found.el = el
      }
      found.attrs.push(atr.trim())
    }
    if (e.indexOf('.') > -1) {
      let [el,cls] = e.split('.')
      let atr = `class=\\"${cls}\\"`
      if (el) {
        found.el = el
      }
      found.attrs.push(atr.trim())
    }
    if (
      e.indexOf('[') > -1 &&
      e.indexOf(']') > e.indexOf('[')
    ) {
      let [el,attrStrBrace] = e.split('[')
      let [attr,attrVal] = attrStrBrace.split(']')?.[0]?.split('=')
      let atr = ''
      if (el) {
        found.el = el
      }
      if (attr) {
        atr = `${attr}`
      }
      if (attrVal) {
        atr += `=${attrVal.replace('"','\\"')}`
      }
      found.attrs.push(atr.trim())
    }
    if (
      e.search(/\#|\.|\=/) === -1
    ) {
      found.el = e.trim()
    }

    cells.push(found)
  })

  let catchAll = '[\\s\\S]*'

  let start = cells.map(c => {
    let foo = [
      c.el || catchAll,
    ]
    if (c.attrs.length > 0) {
      foo.push(c.attrs.join(catchAll))
    }
    return `<${foo.join(catchAll)}${catchAll}>`
  }).join(catchAll)

  let end = cells.map(c => {
    return `<\/${c.el || catchAll}>`
  }).reverse().join(catchAll)

  return new RegExp(`${start}(?<query>${catchAll})${end}`,'igm')
}

export function entrypoint(initialValue, entryPage) {
  let _value = {
    innerHTML: initialValue,
  };
  let _last = {};

  return {
    entryPage,
    get innerHTML() { return _value['innerHTML']; },
    set innerHTML(v) {
      _last['innerHTML'] = _value['innerHTML']
      _value['innerHTML'] = `<main id="app">${v}</main>`;

      entryPage.replace(
        _last['innerHTML'],
        _value['innerHTML'],
      )
    },
    get style() { return _value['style']; },
    set style(v) {
      _last['style'] = _value['style']
      _value['style'] = `<main id="app">${v}</main>`;

      entryPage.replace(
        _last['style'],
        _value['style'],
      )
    },
    get value() { return _value['value']; },
    set value(v) {
      _last['value'] = _value['value']
      _value['value'] = `<main id="app">${v}</main>`;

      entryPage.replace(
        _last['value'],
        _value['value'],
      )
    },
    querySelector: (selector) => {
      let selRegex = query(selector)
      let selRes = selRegex.exec(_value)
      return entrypoint(selRes?.groups?.query || '')
    },
    querySelectorAll: (selector) => {
      let selRegex = query(selector)
      return [..._value.matchAll(selRegex)].map(
        p => entrypoint(p?.groups?.query || '')
      )
    },
    addEventListener: console.log,
    removeEventListener: console.log,
    classList: function() {
      this.add = () => {}
      this.toggle = () => {}
      this.remove = () => {}
    },
  }
}

export function extToMime(ext) {
  let mimes = {
    'htm': 'text/html',
    'html': 'text/html',
    'txt': 'text/plain',
    'md': 'text/markdown',
    'css': 'text/css',
    'js': 'text/javascript',
    'mjs': 'text/javascript',
    'cjs': 'text/javascript',
    'json': 'application/json',
    'zip': 'application/octet-stream',
    'png': 'image/png',
    'gif': 'image/gif',
    'jpeg': 'image/jpeg',
    'jpg': 'image/jpeg',
    'svg': 'image/svg+xml',
    'collection': 'font/collection',
    'otf': 'font/otf',
    'sfnt': 'font/sfnt',
    'ttf': 'font/ttf',
    'woff': 'font/woff',
    'woff2': 'font/woff2',
  }

  return mimes[ext]
}
