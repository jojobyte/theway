export const pathRegex = new RegExp(
  /(?:(?<dir>[a-z\d\.\_\-]+)|\:(?<opt>[a-z\d\.\_\-]+)\?|\:(?<param>[a-z\d\.\_\-]+)|(?<wild>\*))/,
  'ig'
)

export const routeRegex = base => new RegExp(
  `^(?:[#|\\/]{0,2}|${base.replaceAll('/', '\/')})[\\/]?(?<route>[a-z\\d\:\\?\\.\\_\\-\\/]*)`,
  'i'
)

export const patternToRegex = (path, loose) => {
  let keys = []
  let pathPattern = [
      ...path.matchAll(pathRegex)
    ].map(c => {
      let [ key, val ] = Object.entries(c.groups).find(e => e[1])
      let e = val.indexOf('.', 1)
      let patterns = {
        dir: v => '/' + v,
        param: v => '/([^/]+?)' + (
          !!~e ? '\\' + v.substring(e) : ''
        ),
        wild: () => '(?:/([^/].*))?' + (
          !!~e ? '?\\' + v.substring(e) : ''
        ),
        opt: v => '(?:/([^/]+?))?' + (
          !!~e ? '?\\' + v.substring(e) : ''
        ),
      }

      if (key !== 'dir') {
        keys.push(val);
      }

      return patterns[key](val)
    }).join('')

  let pattern = `^${pathPattern || '/'}${loose ? '(?=$|\/)' : '\/?$'}`

  let regex = new RegExp(
    pattern,
    'i'
  )

  return {
    keys,
    regex,
    path,
    pathPattern,
    pattern,
  }
}
