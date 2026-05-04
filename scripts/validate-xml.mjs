#!/usr/bin/env node
// SKLand Wiki Data — <sklandDocument> XML structure validator

import { DOMParser } from '@xmldom/xmldom'
import { readFileSync } from 'fs'

// Confirmed color codes from @eihrteam/xml src/colors.ts
const VALID_COLORS = new Set([
  's_1', 's_2', 's_3', 's_4',
  'r_1', 'r_2', 'r_3', 'r_4', 'r_5', 'r_6',
  'f_orange', 'f_turquoise', 'f_green', 'f_sandstone',
  'f_yellow', 'f_red', 'f_blue', 'f_brown', 'f_violet', 'f_blueness',
])

// Confirmed entry types from @eihrteam/xml src/constants.ts
const VALID_ENTRY_TYPES = new Set(['card-big', 'link-img', 'link-txt'])

// Confirmed header modes from @eihrteam/xml src/model.ts
const VALID_HEADER_MODES = new Set(['none', 'row', 'col', 'both'])

// Confirmed header kinds
const VALID_LINE_KINDS = new Set(['1', '2', '3', '4', '5'])

// Confirmed alignment values
const VALID_ALIGNMENTS = new Set(['left', 'center', 'right'])

function parseArgs() {
  const args = process.argv.slice(2)
  const opts = { input: null }

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--input') {
      opts.input = args[++i]
    }
  }

  return opts
}

function usage() {
  console.error(`Usage: node scripts/validate-xml.mjs --input <file.xml>

Validates that an XML file conforms to <sklandDocument> structure rules.
Checks: root element, required children, color values, entry types,
table header modes, alignment values, line kinds.`)
  process.exit(1)
}

function childText(el, tagName) {
  const child = el.getElementsByTagName(tagName)[0]
  return child ? child.textContent : null
}

function validate(xmlText) {
  const errors = []
  let doc
  try {
    doc = new DOMParser().parseFromString(xmlText, 'text/xml')
  } catch (e) {
    return { valid: false, errors: [`Failed to parse XML: ${e.message}`] }
  }

  const root = doc.documentElement
  if (!root) {
    return { valid: false, errors: ['No root element found'] }
  }
  if (root.tagName !== 'sklandDocument') {
    errors.push(`Root element is <${root.tagName}>, expected <sklandDocument>`)
  }

  // Required children of <sklandDocument>
  if (!childText(root, 'itemId')) {
    errors.push('Missing required element: <itemId>')
  }

  const metainfo = root.getElementsByTagName('metainfo')[0]
  if (!metainfo) {
    errors.push('Missing required element: <metainfo>')
  } else {
    if (!childText(metainfo, 'name')) {
      errors.push('<metainfo> missing required child: <name>')
    }
    const cover = metainfo.getElementsByTagName('cover')[0]
    if (!cover) {
      errors.push('<metainfo> missing required child: <cover>')
    } else {
      const showInDetail = cover.getAttribute('showInDetail')
      if (showInDetail && showInDetail !== 'true' && showInDetail !== 'false') {
        errors.push(`<cover showInDetail="${showInDetail}"> — must be "true" or "false"`)
      }
    }
  }

  // Validate <color> elements
  const colors = root.getElementsByTagName('color')
  for (let i = 0; i < colors.length; i++) {
    const value = colors[i].getAttribute('value')
    if (!value) {
      errors.push('<color> missing required attribute: value')
    } else if (!VALID_COLORS.has(value)) {
      errors.push(`<color value="${value}"> — unknown color code (not in 20-color set)`)
    }
  }

  // Validate <entry> elements
  const entries = root.getElementsByTagName('entry')
  for (let i = 0; i < entries.length; i++) {
    const type = entries[i].getAttribute('type')
    if (!type) {
      errors.push('<entry> missing required attribute: type')
    } else if (!VALID_ENTRY_TYPES.has(type)) {
      errors.push(`<entry type="${type}"> — unknown entry type (expected card-big, link-img, or link-txt)`)
    }
    if (!entries[i].getAttribute('id')) {
      errors.push('<entry> missing required attribute: id')
    }
  }

  // Validate <table> elements (complex tables)
  const tables = root.getElementsByTagName('table')
  for (let i = 0; i < tables.length; i++) {
    const table = tables[i]
    // Only validate if it's inside a chapter (complex table), not inside a simple-table chapter
    const parentChapter = table.parentNode
    if (parentChapter && parentChapter.tagName === 'chapter' && parentChapter.getAttribute('table') === 'true') {
      // Simple table inside a simple-table chapter — skip complex table validation
      continue
    }
    const header = table.getAttribute('header')
    if (!header) {
      errors.push(`<table> at index ${i}: missing required attribute: header`)
    } else if (!VALID_HEADER_MODES.has(header)) {
      errors.push(`<table header="${header}"> — unknown header mode (expected none, row, col, or both)`)
    }
    const widths = table.getAttribute('widths')
    if (widths) {
      const parts = widths.split(',').map(Number)
      if (parts.some(n => !Number.isFinite(n) || n <= 0)) {
        errors.push(`<table widths="${widths}"> — all widths must be positive numbers`)
      }
      // widths count should match the max column count across rows
      let maxCols = 0
      const rows = table.getElementsByTagName('tr')
      for (let r = 0; r < rows.length; r++) {
        let colCount = 0
        const cells = rows[r].childNodes
        for (let c = 0; c < cells.length; c++) {
          if (cells[c].nodeType === 1) { // Element node
            const colspan = parseInt(cells[c].getAttribute('colspan') || '1', 10)
            colCount += colspan
          }
        }
        if (colCount > maxCols) maxCols = colCount
      }
      if (parts.length !== maxCols) {
        errors.push(`<table widths="${widths}"> — ${parts.length} widths but inferred ${maxCols} columns`)
      }
    }
    // Validate rowspan/colspan
    const trs = table.getElementsByTagName('tr')
    for (let r = 0; r < trs.length; r++) {
      const rowCells = trs[r].childNodes
      for (let c = 0; c < rowCells.length; c++) {
        if (rowCells[c].nodeType !== 1) continue
        const tag = rowCells[c].tagName
        if (tag !== 'th' && tag !== 'td') continue
        const rowspan = rowCells[c].getAttribute('rowspan')
        if (rowspan && parseInt(rowspan, 10) < 1) {
          errors.push(`<${tag} rowspan="${rowspan}"> — must be positive integer`)
        }
        const colspan = rowCells[c].getAttribute('colspan')
        if (colspan && parseInt(colspan, 10) < 1) {
          errors.push(`<${tag} colspan="${colspan}"> — must be positive integer`)
        }
      }
    }
  }

  // Validate <line> elements
  const lines = root.getElementsByTagName('line')
  for (let i = 0; i < lines.length; i++) {
    const kind = lines[i].getAttribute('kind')
    if (!kind) {
      errors.push('<line> missing required attribute: kind')
    } else if (!VALID_LINE_KINDS.has(kind)) {
      errors.push(`<line kind="${kind}"> — must be 1, 2, 3, 4, or 5`)
    }
  }

  // Validate <align> elements
  const aligns = root.getElementsByTagName('align')
  for (let i = 0; i < aligns.length; i++) {
    const value = aligns[i].getAttribute('value')
    if (!value) {
      errors.push('<align> missing required attribute: value')
    } else if (!VALID_ALIGNMENTS.has(value)) {
      errors.push(`<align value="${value}"> — must be left, center, or right`)
    }
  }

  // Validate <description source="null"> attribute
  const description = root.getElementsByTagName('description')[0]
  if (description) {
    const source = description.getAttribute('source')
    if (source && source !== 'null') {
      errors.push(`<description source="${source}"> — only valid value is "null"`)
    }
  }

  return { valid: errors.length === 0, errors }
}

function main() {
  const opts = parseArgs()
  if (!opts.input) usage()

  let xmlText
  try {
    xmlText = readFileSync(opts.input, 'utf8')
  } catch (e) {
    console.error(`Error reading input: ${e.message}`)
    process.exit(1)
  }

  const result = validate(xmlText)
  console.log(JSON.stringify(result, null, 2))
  if (!result.valid) {
    process.exitCode = 1
  }
}

main()
