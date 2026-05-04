# 06 — Terminology and Writing Policy

Status: `confirmed`

## Core Rules

### 1. Preserve Protocol Identifiers in Backticks

Always wrap protocol terms in backticks:

- **Field names**: `itemId`, `brief`, `document`, `widgetCommonMap`, `documentMap`, `chapterGroup`, `blockMap`, `childIds`, `blockIds`
- **XML tag names**: `<sklandDocument>`, `<color>`, `<entry>`, `<align>`, `<imgIntro>`, `<metainfo>`, `<chapters>`, `<publicMeta>`
- **XML attribute names**: `value`, `href`, `kind`, `header`, `widths`, `showInDetail`, `rowspan`, `colspan`
- **Function names**: `wikiJsonToXml`, `xmlToWikiJson`, `parseWikiJson`, `parseXml`, `renderWikiJson`, `renderXml`
- **Enum values**: `confirmed`, `sample-bound`, `card-big`, `link-imgText`, `link-text`
- **Type names**: `InfoRoot`, `InfoItem`, `DocumentModel`, `ParagraphBlock`, `TextRunInline`

### 2. Explain, Do Not Rename

Allowed:
> `item/info` is the public read-model endpoint; it returns an `InfoRoot` object.

Disallowed:
> The official snapshot API returns the full entry data.

### 3. Forbidden Ambiguity Words

Never use:
- `probably`, `maybe`, `likely`, `suspected`, `roughly`, `seems to`, `appears to`
- `should` (when meaning "I guess") — use only for documented requirements

If the trusted sources do not settle a point, **verify it or omit it**.

### 4. Sample-Bound Wording

When a fact is observed only in the itemId=114514 fixture (or any single sample), use explicit phrasing:
- "In the current sample pair..."
- "This is sample-bound, not a permanent protocol rule."
- "Observed only in itemId=114514."

Never upgrade a sample observation into a universal rule by changing the wording.

### 5. Stable Chinese-to-English Glosses

| Chinese | English gloss |
|---------|--------------|
| `正式页` | "public page" or "public response" |
| `编辑页` | "edit page" |
| `读取模型` | "read model" |
| `公开元数据` | "public metadata" |

### 6. Status Tags

Every reference file and every non-obvious claim carries one of:
- `confirmed` — settled by source code or widely-verified public data
- `sample-bound` — observed in a specific fixture only

## Do Not Infer

- Do not translate protocol names into invented English names.
- Do not coin new abbreviations for terms already given stable glosses above.
- Do not swap between a Chinese term and its English gloss within the same explanation.
