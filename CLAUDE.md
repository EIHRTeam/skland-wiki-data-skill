# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

This is a Claude Code skill that packages knowledge, scripts, and fixtures for working with **SKLand Wiki public data formats**. It is not a compiled application — it is a distributable skill bundle defined by `SKILL.md` and the supporting files in `references/`, `scripts/`, `assets/`, and `agents/`.

The skill focuses on three data formats and their inter-conversion:
- **Wiki JSON** — the `item/info` public API response shape (`InfoRoot` / `InfoItem`)
- **`<sklandDocument>` XML** — the human-readable, diff-friendly alternative
- **DocumentModel IR** — the typed intermediate representation used by `@eihrteam/xml`

The skill is published as a GitHub release (zip/tar.gz) triggered on every push by `.github/workflows/release-skill.yml`.

## Smoke-testing / validation

The release workflow performs local smoke tests. Run the same checks locally before pushing:

```bash
# Install dependencies
npm install

# Syntax-check all scripts
node --check scripts/convert.mjs
node --check scripts/roundtrip-check.mjs
node --check scripts/validate-xml.mjs
python -m py_compile scripts/xml-inspect.py

# Run the round-trip fixture test
node scripts/roundtrip-check.mjs --input assets/fixtures/sample-info-root.json

# Run the XML validation test
node scripts/validate-xml.mjs --input assets/fixtures/sample.xml
```

The expected smoke-test verdict is `"passed": true` for round-trip, and `"valid": true` for XML validation.

## Scripts

All scripts are self-contained. Node.js scripts import from `@eihrteam/xml` (already installed via `package.json`).

### `scripts/convert.mjs`

CLI wrapper around `@eihrteam/xml` conversion functions. Usage:
```
node scripts/convert.mjs --from json|xml --to json|xml --input <file> [--output <file>] [--wrap-info-root]
```
Supports `--wrap-info-root` to produce `InfoRoot` envelope output. With `--output`, writes to file; without, prints to stdout. Supports pipe mode (read from stdin when `--input` is omitted).

### `scripts/roundtrip-check.mjs`

Verifies JSON→XML→JSON round-trip semantic equivalence. Usage:
```
node scripts/roundtrip-check.mjs --input <file.json>
```
Parses the input JSON, converts to XML via `wikiJsonToXml`, converts back via `xmlToWikiJson`, then compares the two `DocumentModel` trees on structural fields (itemId, name, subType count, chapterGroup count, description block count). Does NOT compare byte-level JSON (IDs are regenerated). Outputs JSON: `{ passed: boolean, checks: {...}, differences: [...] }`.

### `scripts/validate-xml.mjs`

Validates `<sklandDocument>` XML structure. Usage:
```
node scripts/validate-xml.mjs --input <file.xml>
```
Checks: root tag is `<sklandDocument>`, required children exist (`<itemId>`, `<metainfo>`), `<color value="...">` uses known color codes, `<entry type="...">` uses known entry types, `<table header="...">` uses valid header modes, `widths` attribute count matches column count when present. Outputs JSON: `{ valid: boolean, errors: string[] }`.

### `scripts/xml-inspect.py`

Python utility library for XML inspection. Functions:
- `validate_xml_basic(path)` — basic well-formedness + root tag check
- `list_skland_tags(xml_text)` — collect all tag names present
- `extract_text_content(xml_text)` — extract all text content as a single string
- `count_blocks(xml_text)` — count chapter group, chapter, and block elements

Uses Python standard library `xml.etree.ElementTree` only. No external dependencies.

## Reference document structure

The `references/` directory contains the packaged data format knowledge, ordered for progressive reading:

| File | Topic |
| --- | --- |
| `00-overview.md` | Scope (public data only), evidence hierarchy, source inventory, core recommendation |
| `01-public-api-and-json-format.md` | `item/info` endpoint, `InfoRoot`/`InfoItem` structure, `brief`/`document` models, widget types, rich-text DAG, color/entry names |
| `02-xml-format-and-cheatsheet.md` | `<sklandDocument>` root structure, block elements table, inline elements table, chapter types, 20-color mapping, entry type mapping, `<publicMeta>` format, JSON-to-XML side-by-side examples |
| `03-document-model-ir.md` | Full `DocumentModel` type system: 16 top-level fields, 6 block types, 4 inline types, type guards, constructors, helpers, validation |
| `04-eihrteam-xml-api.md` | Package metadata, three-format pipeline, all public API functions with signatures and usage examples, CLI, conversion semantics, error handling |
| `05-workflows-and-patterns.md` | 6 application patterns: human-readable storage, full pipeline, DataSource, batch migration, programmatic IR manipulation, CLI-based conversion. Why XML over JSON. |
| `06-terminology.md` | Writing rules: backtick preservation, forbidden ambiguity words, sample-bound wording, stable Chinese-to-English glosses |
| `07-verification.md` | When and how to verify: Node.js scripts importing `@eihrteam/xml`, Python for JSON diffing |

## Hard constraints for working with this skill

- The **`@eihrteam/xml` source code** (`src/`) is the highest-priority source of truth. Resolve conflicts in favor of source behavior.
- Do not write unverified conclusions. If trusted sources don't settle a point, verify with a Node.js script importing `@eihrteam/xml`, or omit it.
- Preserve protocol identifiers (field names, XML tags, function names, type names) in backticks as canonical values. Explain in English; never rename.
- Status labels: `confirmed` (safe to reuse as a rule) vs `sample-bound` (only confirmed for a specific fixture — do not generalize).
- Never use `probably`, `maybe`, `likely`, `suspected`, `roughly`, or `seems to`.

## Release packaging

Every push triggers `.github/workflows/release-skill.yml`, which:
1. Checks out and runs `npm ci`
2. Validates root skill structure (SKILL.md frontmatter, required paths)
3. Runs `node --check` and `python -m py_compile` syntax validation
4. Runs the round-trip and XML validation smoke tests
5. Packages `SKILL.md` + `agents/` + `assets/` + `references/` + `scripts/` into `dist/skland-wiki-data-{sha}.zip` and `dist/skland-wiki-data-{sha}.tar.gz`
6. Creates or updates a GitHub release (pre-release on non-default branches)

The `dist/` directory is gitignored. `draft/` and `docs/` are excluded from release archives.
