#!/usr/bin/env node
// SKLand Wiki Data — JSON ↔ XML conversion CLI wrapper around @eihrteam/xml

import { wikiJsonToXml, xmlToWikiJson, XmlWikiConversionError } from '@eihrteam/xml'
import { readFileSync, writeFileSync } from 'fs'

function parseArgs() {
  const args = process.argv.slice(2)
  const opts = { from: null, to: null, input: null, output: null, wrapInfoRoot: false }

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--from':
        opts.from = args[++i]
        break
      case '--to':
        opts.to = args[++i]
        break
      case '--input':
        opts.input = args[++i]
        break
      case '--output':
        opts.output = args[++i]
        break
      case '--wrap-info-root':
        opts.wrapInfoRoot = true
        break
      default:
        break
    }
  }

  return opts
}

function usage() {
  console.error(`Usage: node scripts/convert.mjs --from <json|xml> --to <json|xml> --input <file> [--output <file>] [--wrap-info-root]

Options:
  --from <format>       Source format: json (InfoRoot/InfoItem) or xml
  --to <format>         Target format: json or xml
  --input <file>        Input file path
  --output <file>       Output file path (prints to stdout if omitted)
  --wrap-info-root      Wrap JSON output in { code, message, data: { item } } envelope`)
  process.exit(1)
}

function main() {
  const opts = parseArgs()

  if (!opts.from || !opts.to) usage()
  if (!['json', 'xml'].includes(opts.from) || !['json', 'xml'].includes(opts.to)) {
    console.error('Error: --from and --to must be "json" or "xml"')
    process.exit(1)
  }
  if (opts.from === opts.to) {
    console.error('Error: --from and --to must differ')
    process.exit(1)
  }

  let input
  try {
    input = opts.input ? readFileSync(opts.input, 'utf8') : readFileSync(0, 'utf8')
  } catch (e) {
    console.error(`Error reading input: ${e.message}`)
    process.exit(1)
  }

  try {
    let result
    if (opts.from === 'json' && opts.to === 'xml') {
      result = wikiJsonToXml(input)
    } else {
      result = xmlToWikiJson(input, { wrapInfoRoot: opts.wrapInfoRoot })
    }

    if (opts.output) {
      writeFileSync(opts.output, result.text)
    } else {
      console.log(result.text)
    }

    if (result.warnings.length) {
      console.error('Warnings:', ...result.warnings)
    }
  } catch (e) {
    if (e instanceof XmlWikiConversionError) {
      console.error(`Conversion error: ${e.message}`)
    } else {
      console.error(`Error: ${e.message}`)
    }
    process.exit(1)
  }
}

main()
