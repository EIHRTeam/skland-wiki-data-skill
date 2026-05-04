# 04 — `@eihrteam/xml` Conversion API

Status: `confirmed`. Source: `@eihrteam/xml` `src/convert.ts`, `src/cli.ts`, `src/index.ts`.

## Package Metadata

- **Package**: `@eihrteam/xml` v0.3.3
- **License**: MIT
- **Runtime**: Node.js >= 20, ESM-only (`"type": "module"`)
- **Browser**: Works via `globalThis.DOMParser`
- **Node fallback**: `@xmldom/xmldom` (transitive dependency)
- **Repository**: <https://github.com/EIHRTeam/xml>
- **Install**: `npm i @eihrteam/xml`
- **Version policy**: Always keep `@eihrteam/xml` at the latest version. Use an automated dependency updater such as GitHub Dependabot to stay current.

## Architecture: Three-Format Pipeline

```
                  parse              render
Wiki JSON ─────────────────► DocumentModel ─────────────────► XML
                  ◄────────────────              ◄────────────────
                  render              parse

InfoRoot/InfoItem     DocumentModel         <sklandDocument>
```

All conversion goes through `DocumentModel`. There is no direct JSON ↔ XML path that skips the IR.

## Public API Functions

### JSON → XML

#### `wikiJsonToXml(json)`

```ts
function wikiJsonToXml(json: string | object): ConversionResult
```

Accepts `InfoRoot` (with `data.item` envelope) or bare `InfoItem`. Produces `<sklandDocument>` XML string.

```js
import { wikiJsonToXml } from '@eihrteam/xml'
const { text: xml } = wikiJsonToXml(fs.readFileSync('item.json', 'utf8'))
```

#### `wikiJsonToXmlBatch(entries)`

```ts
function wikiJsonToXmlBatch<TMeta>(entries: BatchEntry<TMeta>[]): BatchResult<TMeta>
```

Batch conversion with per-entry metadata. **Fail-fast**: the first failed entry throws immediately with the batch index in the error message.

```js
const { items } = wikiJsonToXmlBatch([
  { source: json1, meta: { id: 'a' } },
  { source: json2, meta: { id: 'b' } },
])
// items[0].text    — XML string
// items[0].meta    — { id: 'a' }
```

### XML → JSON

#### `xmlToWikiJson(xml, options?)`

```ts
function xmlToWikiJson(
  xml: string,
  options?: RenderWikiJsonOptions
): ConversionResult

interface RenderWikiJsonOptions {
  wrapInfoRoot?: boolean            // Wrap output in { data: { item: ... } }
  envelope?: Record<string, unknown> // Extra fields merged into root envelope
}
```

```js
// Bare InfoItem
const { text: itemJson } = xmlToWikiJson(xmlString)

// InfoRoot envelope
const { text: rootJson } = xmlToWikiJson(xmlString, { wrapInfoRoot: true })
```

When `wrapInfoRoot: true`, the output matches the `item/info` response shape:
```json
{ "code": 0, "message": "OK", "data": { "item": { ... } } }
```

#### `xmlToWikiJsonBatch(entries, options?)`

```ts
function xmlToWikiJsonBatch<TMeta>(
  entries: BatchEntry<TMeta>[],
  options?: RenderWikiJsonOptions
): BatchResult<TMeta>
```

Batch XML-to-JSON, same fail-fast behavior.

### DocumentModel Access

#### Parsing

```ts
function parseWikiJson(source: string | object): DocumentModel
function parseXml(source: string): DocumentModel
```

Parse directly to `DocumentModel` without rendering to the other format. Useful when you want to inspect or manipulate the IR.

```js
const doc = parseWikiJson(jsonString)
console.log(doc.name, doc.chapterGroups.length)
```

#### Rendering

```ts
function renderWikiJson(document: DocumentModel, options?: RenderWikiJsonOptions): string
function renderXml(document: DocumentModel): string
function documentToWikiJsonObject(document: DocumentModel, options?: RenderWikiJsonOptions): object
```

Render a `DocumentModel` to a target format. `documentToWikiJsonObject` returns a JS object instead of a JSON string.

```js
const doc = parseXml(xmlString)
doc.name = 'New Name'
const newJson = renderWikiJson(doc, { wrapInfoRoot: true })
```

### Generic

#### `convert(source, options)`

```ts
function convert(
  source: string | object,
  options: ConvertOptions
): ConversionResult

interface ConvertOptions {
  from: 'wiki-json' | 'xml'
  to: 'wiki-json' | 'xml'
}
```

Generic bidirectional dispatcher.

```js
const xml = convert(jsonString, { from: 'wiki-json', to: 'xml' }).text
const json = convert(xmlString, { from: 'xml', to: 'wiki-json' }).text
```

### Deprecated / Aliases

| Name | Status |
|------|--------|
| `parseWikiJsonWithWarnings` | Deprecated — use `parseWikiJson` |
| `parseXmlWithWarnings` | Deprecated — use `parseXml` |
| `EndfieldWikitextConversionError` | Alias for `XmlWikiConversionError` |

## Result Types

```ts
interface ConversionResult {
  text: string       // Output string (XML or JSON)
  warnings: string[] // Currently always [] in v0.3.3
}
```

## CLI Usage

```bash
# JSON to XML
xml convert --from json --to xml --input item.json --output item.xml

# XML to JSON
xml convert --from xml --to json --input item.xml --output item.json

# Pipe mode
cat item.json | xml convert --from json --to xml
```

Format identifiers: `json` (wiki InfoItem/InfoRoot), `xml` (`<sklandDocument>`).

## Conversion Semantics

### Equivalence

- Target is **`DocumentModel` semantic equivalence**, not byte-level identity.
- JSON → XML → JSON: output JSON is semantically equivalent to input, but internal IDs are regenerated.
- XML → JSON → XML: output XML is semantically equivalent to input, but whitespace/attribute ordering may differ.

### ID Regeneration

When rendering JSON output (`renderWikiJson`, `xmlToWikiJson`, etc.):
- `widgetCommonMap` keys are regenerated via `crypto.getRandomValues`
- `documentMap` keys are regenerated
- Block IDs (`blockMap` keys) are regenerated
- Tab IDs (`tabList[].tabId`) are regenerated

**Referential integrity is preserved** — all cross-references (widget→tab, tabData→document, document→block) use the new IDs consistently.

### Error Handling

```ts
class XmlWikiConversionError extends Error {
  constructor(message: string)
}
```

Thrown for:
- Malformed JSON input (unexpected shape, missing required fields)
- Invalid XML (unparseable, unsupported tags, unrecognized attribute values)
- Invalid color values (not in the 20-color set)
- Unsupported block/inline kinds
- Complex table validation failures (cell overlap, uncovered grid, bad widths)

### Input Shape Detection

- JSON with `data.item` → treated as `InfoRoot` (strips envelope, saves metadata to `publicMeta`)
- JSON with both `brief` and `document` at top level → treated as bare `InfoItem`
- Otherwise → throws `XmlWikiConversionError`

### `warnings` Field

Present in `ConversionResult` but **always `[]`** in v0.3.3. Reserved for future use (e.g., non-fatal conversion warnings).
