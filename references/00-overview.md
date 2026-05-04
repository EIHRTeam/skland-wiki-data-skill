# 00 — Overview and Source of Truth

Status: `confirmed`

## What This Skill Covers

- The public SKLand Wiki data formats: **Wiki JSON** (`item/info` response shape), **`<sklandDocument>` XML**, and the **DocumentModel** intermediate representation
- The **`@eihrteam/xml`** npm package that converts bidirectionally between these formats
- **Application patterns** for building tools on top of wiki data

## Core Recommendation

**Use XML + `@eihrteam/xml` instead of raw JSON for development and storage.**

Raw wiki JSON uses a reference-DAG structure (`blockMap` / `childIds` / `widgetCommonMap` / `documentMap` with generated IDs) that is hard to read, diff, or edit. The `<sklandDocument>` XML format replaces generated IDs with nested trees, uses descriptive tag names (`<h1>` instead of `kind: 1`), and produces diff-friendly output. The `@eihrteam/xml` package handles all conversion, guaranteeing `DocumentModel` semantic equivalence across formats.

## Source-of-Truth Hierarchy

1. **`@eihrteam/xml` source code** (`src/` directory at the project root) — highest priority. The implementation defines the truth.
2. **Package README and CLAUDE.md** — trusted but subordinate to source.
3. **Public API responses** — last resort; sample-bound observations must be marked as `sample-bound`.

Conflicts resolve in favor of the higher-priority source.

## Status Vocabulary

| Tag | Meaning |
|-----|---------|
| `confirmed` | Settled by source code or widely-verified public data. Safe to rely on. |
| `sample-bound` | Observed in a specific fixture or API response. May not hold for all items. |

## Source Inventory

| Source | Proves | Status |
|--------|--------|--------|
| `src/model.ts` | DocumentModel type definitions, guards, constructors, helpers | `confirmed` |
| `src/jsonFormat.ts` | Wiki JSON parsing and rendering | `confirmed` |
| `src/xmlFormat.ts` | `<sklandDocument>` XML parsing and rendering | `confirmed` |
| `src/convert.ts` | Public conversion API | `confirmed` |
| `src/colors.ts` | 20-color bidirectional mapping | `confirmed` |
| `src/constants.ts` | Entry type maps, tag sets, table width defaults | `confirmed` |
| `src/ids.ts` | `IdFactory` random ID generation | `confirmed` |
| `src/cli.ts` | CLI entry | `confirmed` |
| `assets/fixtures/` | Sample itemId=114514 data | `sample-bound` |

## Stable Rules

- `DocumentModel` semantic equivalence is guaranteed across all conversion paths.
- Byte-level identity is **never** guaranteed. JSON output regenerates all internal IDs.
- The public API endpoint is `GET /web/v1/wiki/item/info?id=...`.
- The public response envelope is `{ code, message, timestamp, data: { item } }`.

## Do Not Infer

- Sample observations (itemId=114514) are not protocol guarantees.
- The list of source files above documents the current package version (0.3.3). Future versions may add or rename functions.
- Not every wiki JSON field has an XML counterpart. The conversion is lossy where read-model metadata is concerned (see `publicMeta`).
