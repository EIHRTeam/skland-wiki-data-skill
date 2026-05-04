---
name: skland-wiki-data
description: Work with SKLand Wiki public data formats — wiki JSON (InfoRoot/InfoItem from item/info), `<sklandDocument>` XML, and DocumentModel IR via `@eihrteam/xml`. Use this skill whenever the user mentions "skland", "wiki data", "item/info", wiki JSON parsing or conversion, `<sklandDocument>` XML tags or color codes, the `@eihrteam/xml` package, building wiki editing/DataSource/pipeline tooling, validating XML structure, or round-trip checking JSON↔XML conversions. Also use it when a user has a wiki JSON file and wants to read, diff, version-control, or edit its content in a human-friendly format. Prefer XML + `@eihrteam/xml` over raw JSON for development and storage.
---

# SKLand Wiki Data

This skill covers the SKLand Wiki public data formats and the `@eihrteam/xml` conversion toolkit. Keep protocol identifiers literal — field names, XML tags, function names, and type names in backticks are canonical values, not text to rename.

**Core recommendation: use `<sklandDocument>` XML + `@eihrteam/xml` instead of raw wiki JSON.** Raw wiki JSON uses a reference-DAG structure (`blockMap` / `childIds` / `widgetCommonMap` with generated IDs) that is hard to read, diff, or edit. XML replaces generated IDs with nested trees, uses descriptive tag names, and produces diff-friendly output. The conversion package guarantees `DocumentModel` semantic equivalence across all paths.

## When To Use This Skill

- Convert between wiki JSON (`item/info` response) and `<sklandDocument>` XML.
- Understand the `InfoRoot` / `InfoItem` JSON structure (public read model).
- Look up `<sklandDocument>` XML tag schemas, allowed attributes, or color/entry mappings.
- Understand or manipulate the `DocumentModel` intermediate representation (typed block/inline tree).
- Use `@eihrteam/xml` functions: `wikiJsonToXml`, `xmlToWikiJson`, `parseWikiJson`, `parseXml`, `renderWikiJson`, `renderXml`, batch conversion, or the CLI.
- Build an XML-based editing pipeline, DataSource adapter, batch migration, or content analysis tool.
- Validate that an XML string conforms to the `<sklandDocument>` schema.
- Check round-trip integrity of a JSON→XML→JSON conversion.

## Working Principles

### Source-of-truth: code over docs

`@eihrteam/xml` source code (`src/`) is the highest-priority authority. The implementation defines what is true. If documentation and code conflict, the code wins — downstream tools depend on actual behavior, not documented intent.

### Verify, don't guess

If a fact is not confirmed by the package source or the public API, verify it with a Node.js script importing `@eihrteam/xml`, or omit it. Unverified conclusions lead to broken downstream tooling. If you are not certain, the reader cannot be certain either — and bad data is worse than missing data.

### Preserve protocol identifiers

Field names, XML tags, function names, and type names are contracts shared across systems. Renaming them breaks API calls and causes data loss. Explain their meaning in English, but keep the original literal in backticks (e.g., `` `item/info` is the public read-model endpoint; it returns an `InfoRoot` object ``).

### Mark sample-specific observations

Observations drawn from a single fixture (e.g., itemId=114514) are `sample-bound` — they may not hold for all items. Never generalize a sample observation into a universal rule by changing the wording. Use explicit phrasing: "In the current sample pair...", "This is sample-bound."

### Avoid ambiguity words

Words like `probably`, `maybe`, `likely`, `suspected`, `roughly`, `seems to` signal uncertainty. If the trusted sources do not settle a point, either verify it or state clearly that it is unconfirmed.

## Reading Guide

1. Start with [references/00-overview.md](references/00-overview.md) for scope, evidence hierarchy, and status vocabulary.
2. Read [references/06-terminology.md](references/06-terminology.md) for writing rules (backtick conventions, forbidden words, glosses).
3. Then read the reference that matches your task:

| Task | Reference |
|------|-----------|
| Understand public JSON structure | [references/01-public-api-and-json-format.md](references/01-public-api-and-json-format.md) |
| Look up XML tags, attributes, colors | [references/02-xml-format-and-cheatsheet.md](references/02-xml-format-and-cheatsheet.md) |
| Work with DocumentModel IR | [references/03-document-model-ir.md](references/03-document-model-ir.md) |
| Use @eihrteam/xml API functions | [references/04-eihrteam-xml-api.md](references/04-eihrteam-xml-api.md) |
| Build an application or pipeline | [references/05-workflows-and-patterns.md](references/05-workflows-and-patterns.md) |
| Verify an uncertain claim | [references/07-verification.md](references/07-verification.md) |

## Bundled Scripts

Use these instead of re-implementing conversion or validation logic:

- `scripts/convert.mjs` — JSON ↔ XML conversion via `@eihrteam/xml`
- `scripts/roundtrip-check.mjs` — verify JSON → XML → JSON round-trip semantic equivalence
- `scripts/validate-xml.mjs` — validate `<sklandDocument>` XML structure
- `scripts/xml-inspect.py` — Python XML/XPath inspection utilities

## Assets

Minimal reusable fixture samples under `assets/fixtures/`:
- `sample-info-root.json` — minimal valid `InfoRoot` (public `item/info` response)
- `sample.xml` — semantically equivalent `<sklandDocument>` XML
- `expected-roundtrip.json` — expected smoke-test verdict

Use them for examples and smoke tests. They are `sample-bound` — not stronger evidence than the `@eihrteam/xml` source code.

## Example: Converting Wiki JSON To Readable XML

**Input:** A wiki `item/info` JSON file (`my-item.json`):

```json
{ "code": 0, "message": "OK", "data": { "item": { ... } } }
```

**Task:** Convert it to human-readable `<sklandDocument>` XML for git storage.

**Using the bundled script:**
```bash
node scripts/convert.mjs --from json --to xml --input my-item.json --output my-item.xml
```

**Output:** `my-item.xml` — a diff-friendly `<sklandDocument>` XML file that is semantically equivalent to the input JSON. The XML can be edited directly and converted back to JSON when needed.

## Example: Validating An XML File

**Input:** A `<sklandDocument>` XML file (`draft.xml`).

**Task:** Check that it conforms to the expected schema before committing.

**Using the bundled script:**
```bash
node scripts/validate-xml.mjs --input draft.xml
```

**Output:** JSON with `{ valid: boolean, errors: string[] }`. A `valid: true` result means the XML passes structural checks (root tag, required children, color codes, entry types, table headers).
