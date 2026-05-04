# 05 — Workflows and Application Patterns

Status: `confirmed` for described patterns (implementation approaches, not mandates).

## Why XML + `@eihrteam/xml` Over Raw JSON

The wiki JSON format is a reference DAG (`blockMap`, `childIds`, `widgetCommonMap`, `documentMap` all keyed by generated IDs). This makes it:

- **Hard to read** — you must follow ID chains to understand the content tree
- **Hard to diff** — ID regeneration on every edit creates unrelated churn
- **Hard to edit manually** — you must understand the ID graph and maintain referential integrity

The `<sklandDocument>` XML format:

- **Human-readable** — nested trees with semantic tag names (`<h1>`, `<img>`, `<color value="r_2">`)
- **Diff-friendly** — structure changes show meaningfully; no ID noise
- **Edit-friendly** — any text editor works; tag meaning is self-evident

`@eihrteam/xml` handles all conversion reliably, guaranteeing `DocumentModel` equivalence.

## Pattern 1: Human-Readable Storage

Store wiki items as XML files in your repository. Convert to JSON only when calling the API.

```
repo/
  items/
    114514.xml          # Canonical source of truth
    2001.xml
    ...
```

Benefits:
- `git diff` shows meaningful content changes
- Code review reads like a document, not a database dump
- Manual edits in any editor without worrying about ID integrity

## Pattern 2: DataSource Pattern

For applications that consume `item/info` JSON:

```
┌──────────┐     ┌───────────────────┐     ┌──────────────┐
│  XML     │────▶│ xmlToWikiJson(    │────▶│ Existing     │
│  Files   │     │   xml,            │     │ JSON         │
│  (disk)  │     │   { wrapInfoRoot: │     │ Consumer     │
│          │     │     true }        │     │              │
│          │     │ )                 │     │              │
└──────────┘     └───────────────────┘     └──────────────┘
```

Store items as XML. At load time, call `xmlToWikiJson(xml, { wrapInfoRoot: true })` to produce `InfoRoot` objects. Feed these to any existing JSON consumer.

Benefits:
- Storage format (XML) is decoupled from consumption format (JSON)
- Migration is a batch conversion, not a rewrite
- XML remains the single source of truth

## Pattern 3: Batch Migration

Convert an entire catalog between formats using the batch API:

```js
import { wikiJsonToXmlBatch, xmlToWikiJsonBatch } from '@eihrteam/xml'

// JSON catalog → XML files
const { items, warnings } = wikiJsonToXmlBatch(
  catalog.map(entry => ({
    source: entry.json,
    meta: { id: entry.id, path: entry.filePath }
  }))
)

for (const item of items) {
  if (item.result) {
    fs.writeFileSync(item.meta.path, item.result.text)
  }
}
```

The `meta` field carries per-entry tracking data through the batch. Fail-fast behavior: if one entry fails, the entire batch throws. Use try/catch per-entry for partial-failure tolerance.

## Pattern 4: Programmatic DocumentModel Manipulation

For tools that need to inspect or transform item content without dealing with raw format details:

```js
import { parseWikiJson, renderWikiJson, parseXml, renderXml, isParagraph, isTextRun } from '@eihrteam/xml'

// Parse from either format
const doc = parseWikiJson(jsonString)
// or: const doc = parseXml(xmlString)

// Inspect
for (const group of doc.chapterGroups) {
  for (const chapter of group.chapters) {
    for (const block of chapter.content) {
      if (isParagraph(block)) {
        for (const inline of block.inlines) {
          if (isTextRun(inline)) {
            console.log(inline.text)
          }
        }
      }
    }
  }
}

// Transform
doc.name = 'Updated Name'

// Render back
const outputJson = renderWikiJson(doc)
```

Use `parseWikiJson` / `parseXml` for input, manipulate the typed `DocumentModel` tree, then `renderWikiJson` / `renderXml` for output. You never touch raw JSON `blockMap` IDs or XML string parsing.

## Pattern 5: CLI-Based Conversion

For one-off conversions or shell pipelines:

```bash
# Fetch from API, convert to XML, save
curl -s 'https://web-api.skland.com/web/v1/wiki/item/info?id=114514' \
  | jq '.data' \
  | xml convert --from json --to xml \
  > item-114514.xml

# Convert edited XML back to JSON
xml convert --from xml --to json --input item-114514.xml > item-114514.json

# Batch convert all XML in a directory
for f in items/*.xml; do
  xml convert --from xml --to json --input "$f" --output "${f%.xml}.json"
done
```

## Choosing Between Patterns

| Scenario | Recommended Pattern |
|----------|-------------------|
| Manual content editing | Pattern 1 (XML storage) + text editor |
| Existing app that consumes `item/info` JSON | Pattern 2 (DataSource, XML on disk) |
| Migrating many items | Pattern 3 (batch API) |
| Content analysis / transformation | Pattern 4 (DocumentModel IR) |
| One-off script / quick check | Pattern 5 (CLI) |

## Do Not Infer

- The API endpoints shown are for illustration of the data flow. Actual API authentication and request details are out of scope for this skill.
- The pipeline patterns assume a working `item/info` response. Edge cases (deleted items, restricted items) are not covered here.
- Batch conversion with partial-failure tolerance is not built-in to `@eihrteam/xml` — you must implement per-entry try/catch if needed.
