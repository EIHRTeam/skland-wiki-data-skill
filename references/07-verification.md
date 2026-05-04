# 07 — Verification Playbook

Status: `confirmed`

## Default Policy

The `@eihrteam/xml` package source code (`src/`) is **already trusted**. Do not re-verify facts that are clearly settled there. The package's own test suite (`tests/converter.test.ts`) covers round-trips, edge cases, and error paths.

## When to Verify

- A new edge case that is not covered by the package's existing tests.
- Behavior of an undocumented or recently-added function.
- Suspected behavior difference between package versions.
- A specific conversion result from real-world API data that does not match expectations.

## Allowed Verification Tools

- **Node.js** (primary) — the package is ESM-only and requires Node 20+. Import directly from `@eihrteam/xml`.
- **Python** — useful for JSON diffing, inspection, and schema validation of fixture files.

## Recommended Verification Paths

### Conversion behavior

Write a one-off Node script importing from `@eihrteam/xml`, run it against fixture data or live API responses:

```js
import { wikiJsonToXml, xmlToWikiJson } from '@eihrteam/xml';
const result = wikiJsonToXml(jsonString);
console.log(result.text);
```

### Round-trip correctness

Feed sample JSON through `wikiJsonToXml` then `xmlToWikiJson`, compare the `DocumentModel` trees (not the byte-level JSON strings):

```js
import { wikiJsonToXml, xmlToWikiJson, parseWikiJson } from '@eihrteam/xml';
const original = parseWikiJson(jsonString);
const roundtripped = parseWikiJson(xmlToWikiJson(wikiJsonToXml(jsonString).text).text);
// Compare structural fields: itemId, name, chapterGroups.length, block counts, etc.
```

### XML parsing edge cases

Create minimal XML snippets and run through `parseXml`:

```js
import { parseXml } from '@eihrteam/xml';
const doc = parseXml(`<sklandDocument><itemId>1</itemId>...</sklandDocument>`);
```

## Non-Verification Cases

The following are `confirmed` from source code — do not re-verify:
- Function signatures of the 16 public exports
- The 20-color mapping table
- The 3 entry type mappings
- The `DocumentModel` type definitions
- ID regeneration behavior (`crypto.getRandomValues`)
- `XmlWikiConversionError` error class

## Stop Conditions

Stop verification when:
- The output mutates live data.
- The result is ambiguous and cannot be reproduced cleanly.
- A third-party service is required and unavailable.
