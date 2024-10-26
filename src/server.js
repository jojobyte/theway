export const serveStaticFiles = async (dir, options = {}) => {
  // let { entrypoint = null } = options

  console.log('setup static file server for', dir)

  let { isBrowser } = await import('./utils.js')

  if (!isBrowser()) {
    const { readFile } = await import('node:fs/promises')
    const { join, extname } = await import('node:path')

    return async (req, res, next) => {
      let { url } = req
      let path = join(dir, url)

      if (url === '/' || path.endsWith('/')) {
        return next()
      }

      if (!path.endsWith('/')) {
        try {
          let file = await readFile(path, { encoding: 'utf8' })

          if (file) {
            res.send(file, 200, {
              'Content-Type': extensionToMimeType(extname(path).substring(1))
            })
            return this;
          }

          return next()
        } catch (err) {
          // console.error(path, err, options)

          return next()
        }
      }

      return next()
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

export function DOMFaker(initialValue, htmlString) {
  let _value = {
    innerHTML: initialValue,
  };
  let _last = {};
  let [openTag, closeTag] = initialValue.split(/><\//g)
  let tagWithVal = v => openTag && closeTag ? `${openTag}>${v}</${closeTag}` : v

  return {
    htmlString,
    get innerHTML() { return _value['innerHTML']; },
    set innerHTML(v) {
      _last['innerHTML'] = _value['innerHTML']
      _value['innerHTML'] = tagWithVal(v)

      htmlString = htmlString.replace(
        _last['innerHTML'],
        _value['innerHTML'],
      )

      return htmlString
    },
    get style() { return _value['style']; },
    set style(v) {
      _last['style'] = _value['style']
      _value['style'] = tagWithVal(v)

      htmlString = htmlString.replace(
        _last['style'],
        _value['style'],
      )

      return htmlString
    },
    get value() { return _value['value']; },
    set value(v) {
      _last['value'] = _value['value']
      _value['value'] = tagWithVal(v)

      htmlString = htmlString.replace(
        _last['value'],
        _value['value'],
      )

      return htmlString
    },
    querySelector: (selector) => {
      let selRegex = query(selector)
      let selRes = selRegex.exec(_value.innerHTML)

      return DOMFaker(selRes?.groups?.query || '', htmlString)
    },
    querySelectorAll: (selector) => {
      let selRegex = query(selector)

      return [..._value.innerHTML.matchAll(selRegex)].map(
        p => DOMFaker(p?.groups?.query || '', htmlString)
      )
    },
    addEventListener: console.log,
    removeEventListener: console.log,
    get classList() {
      let values = []
      let value = values.join(' ')

      Object.defineProperties(this, {
        value: {
          enumerable: true,
          get() { return value; },
          set(v) {
            value = v
            values = value.split(' ')
          },
        },
        values: {
          enumerable: true,
          get() { return values; },
          set(v) {
            values = [...v]
            value = values.join(' ')
          },
        },
        add(v) {
          this.values.push(v)
          this.value = this.values.join(' ')
        },
        toggle(v) {
          let t = this.value.indexOf(v)

          if (t > -1) {
            this.values.splice(t, 1)
            this.value = this.values.join(' ')
          } else {
            this.values.push(v)
            this.value = this.values.join(' ')
          }
        },
        remove(v) {
          let t = this.value.indexOf(v)

          if (t > -1) {
            this.values.splice(t, 1)
            this.value = this.values.join(' ')
          }
        },
      })
    },
  }
}

const EXT_MIME_TYPES = {
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

/**
 * Overly simplified version of file extension to mime type
 *
 * @example
 *   let jsonExt = extensionToMimeType('json')
 *   // jsonExt === 'application/json'
 *
 *   let htmlExt = extensionToMimeType('html')
 *   // htmlExt === 'text/html'
 *
 * @param {string} ext a file extension
 * @param {Record<string,string>} [mimeTypes=EXT_MIME_TYPES] an object with file extension to mime type pairings
 *
 * @returns {string}
 */
export function extensionToMimeType(
  ext,
  mimeTypes = EXT_MIME_TYPES
) {
  return mimeTypes[ext]
}

/**
 * Array contains any
 *
 * @example
 *   let contains = containsAny(['a', 'b', 'c'], ['x', 'b'])
 *   // contains === true
 *
 *   let contains = containsAny(['a', 'b', 'c'], ['x', 'y', 'z'])
 *   // contains === false
 *
 * @param {string[]} hay Haystack
 * @param {string[]} needles Needles
 *
 * @returns {number} Position where at least one of Needles exist in Haystack
 */
export function containsAny(hay, needles) {
  let found = -1

  for (let needle in needles) {
    let nay = hay.findIndex(h => h === needles[needle])

    if (nay > -1) {
      found = parseInt(nay, 10)
      break
    }
  }

  return found
}
