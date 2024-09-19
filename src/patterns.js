export const pathRegex = new RegExp(
  /(?:(?<dir>[a-z\d\.\_\-]+)|\:(?<opt>[a-z\d\.\_\-]+)\?|\:(?<param>[a-z\d\.\_\-]+)|(?<wild>\*))/,
  'ig'
)

export const routeRegex = base => new RegExp(
  `^(?:[#|\\/]{0,2}|${base.replaceAll('/', '\/')})[\\/]?(?<route>[a-z\\d\:\\?\\.\\_\\-\\/]*)`,
  'i'
)

export const generatePattern = (path, loose) => {
  let keys = [],
      pattern = [
        ...path.matchAll(pathRegex)
      ].map(c => {
        let [
          key,
          val
        ] = Object.entries(c.groups).find(e => e[1]),
            e = val.indexOf('.', 1),
            patterns = {
              dir: v => '/' + v,
              wild: () => '/(.*)',
              param: v => '/([^/]+?)' + (
                !!~e ? '\\' + v.substring(e) : ''
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

  pattern = new RegExp(`^${pattern || '/'}${loose ? '(?=$|\/)' : '\/?$'}`, 'i')

  return { keys, pattern };
}
