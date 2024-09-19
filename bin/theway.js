#!/usr/bin/env node

process.removeAllListeners('warning')
process.on('SIGTERM', () => process.exit());
process.on('SIGINT', () => process.exit());

import { containsAny } from '../src/server.js'

const { default: pkg } = await import(
  '../package.json',
  { with: { type: 'json' } },
)

const { name, description, version } = pkg

let args = process.argv.slice(2).filter(
  arg => '-c' !== arg
)
let tmpl
let helpInfo = `
\x1b[91m${name}\x1b[0m \x1b[92mv${version}\x1b[0m - \x1b[11m${description}.\x1b[0m

  \x1b[2m${'Generates a new directory based on recommended setup'}.\x1b[0m

  \x1b[94m${'Coming Soon...'}.\x1b[0m

\x1b[11m${'USAGE:'}\x1b[0m
  \x1b[1m${name}\x1b[0m \x1b[91m${'[./path/to/new/dir]'}\x1b[0m \x1b[93m${'--template vanilla'}\x1b[0m


\x1b[11m${'OPTIONS:'}\x1b[0m
  \x1b[11m${'-h, --help'}\x1b[0m      \x1b[2m${'Display this help info'}\x1b[0m
  \x1b[11m${'-t, --template'}\x1b[0m  \x1b[2m${'Specify the template to use in generating your new project'}\x1b[0m
                  \x1b[2m∟ ${'Template defaults to "vanilla"'}\x1b[0m
  `

if (containsAny(args, ['-h', '--help']) > -1) {
  console.info(helpInfo)
} else if ((tmpl = containsAny(args, ['-t', '--template'])) > -1) {
  // let template = args[tmpl+1]
  // console.log('template', tmpl, template, args)
} else {
  console.log('run default', args)
  console.info(helpInfo)
}