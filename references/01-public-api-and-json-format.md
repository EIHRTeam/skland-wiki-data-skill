# 01 — Public API and Wiki JSON Format

Status: `confirmed` for structural rules; `sample-bound` for fixture-specific field values.

## Endpoint

```
GET /web/v1/wiki/item/info?id={itemId}
```

This is a **public, unauthenticated** read endpoint. It returns the full public view of a wiki item.

## Response Envelope: `InfoRoot`

```json
{
  "code": 0,
  "message": "OK",
  "timestamp": "1776017920",
  "data": {
    "item": { ... }
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `code` | `number` | Response code; `0` on success |
| `message` | `string` | Human-readable status |
| `timestamp` | `string` | Server Unix timestamp |
| `data.item` | `InfoItem` | The item payload |

## `InfoItem` — Top-Level Fields

| Field | Type | Description |
|-------|------|-------------|
| `itemId` | `string` | Unique item identifier |
| `name` | `string` | Display name (public metadata) |
| `lang` | `string` | Language code, e.g. `"zh_Hans"` |
| `status` | `number` | Publish status |
| `tagIds` | `string[]` | Tag ID list |
| `createdUser` | `object` | `{ id, nickname }` of creator |
| `lastUpdatedUser` | `object` | `{ id, nickname }` of last editor |
| `lastAuditPassedAt` | `string` | Timestamp of last audit pass |
| `mainType` | `object` | `{ id, name }` main category |
| `subType` | `object` | `{ id, name }` sub-category |
| `brief` | `Brief` | Brief / summary data |
| `document` | `Document` | Full document body |

The `name`, `lang`, `status`, `tagIds`, `createdUser`, `lastUpdatedUser`, `lastAuditPassedAt`, `mainType`, and `subType` fields are **read-model metadata** — they appear in the public response but are not part of the editable content body.

## `brief` Model

```json
{
  "name": "Sample Item",
  "cover": "https://example.invalid/sample-cover.png",
  "subTypeList": [{ "subTypeId": "10000", "value": "10001" }],
  "associate": null,
  "composite": null,
  "description": {
    "id": "brief-doc",
    "version": "1.0.0",
    "blockIds": ["brief-block"],
    "blockMap": { "brief-block": { ... } },
    "authorMap": {}
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | Item display name |
| `cover` | `string` | Cover image URL |
| `subTypeList` | `SubType[]` | Array of `{ subTypeId, value }` |
| `associate` | `object \| null` | Optional association: `{ id, type }` |
| `composite` | `object \| null` | Optional composite data |
| `description` | `RichDocument` | Rich-text brief description |

### `RichDocument` (description block)

```json
{
  "id": "brief-doc",
  "version": "1.0.0",
  "blockIds": ["brief-block"],
  "blockMap": { ... },
  "authorMap": {}
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Document identifier |
| `version` | `string` | Content version |
| `blockIds` | `string[]` | Ordered list of top-level block IDs |
| `blockMap` | `Record<string, Block>` | Map of block ID → block object |
| `authorMap` | `object` | Author metadata (public-only, may be empty `{}`) |

## `document` Model

```json
{
  "chapterGroup": [
    {
      "title": "Profile",
      "widgets": [
        { "id": "wText", "title": "Overview", "size": "large" }
      ]
    }
  ],
  "extraInfo": {
    "illustration": "",
    "showType": "",
    "composite": ""
  },
  "widgetCommonMap": { ... },
  "documentMap": { ... }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `chapterGroup` | `ChapterGroupEntry[]` | Array of chapter groups, each with `title` and `widgets[]` |
| `extraInfo` | `object` | Extra metadata: `illustration`, `showType`, `composite` |
| `widgetCommonMap` | `Record<string, Widget>` | Map of widget ID → widget payload |
| `documentMap` | `Record<string, RichDocument>` | Map of document ID → rich-text document |

### Widget Types

#### `type: "common"` — Text/Content Widget

```json
{
  "type": "common",
  "tableList": [],
  "tabList": [
    { "tabId": "default", "title": "Overview", "icon": "" }
  ],
  "tabDataMap": {
    "default": {
      "content": "doc-overview",
      "intro": null,
      "audioList": []
    }
  }
}
```

- `tabList` — ordered array of `{ tabId, title, icon }`. `icon` may be `""` for text-only tabs.
- `tabDataMap` — map of `tabId` → `{ content (document ID ref), intro (ImageIntro|null), audioList }`.

#### `type: "audio"` — Audio Widget

```json
{
  "type": "audio",
  "tableList": [],
  "tabList": [],
  "tabDataMap": {
    "default": {
      "intro": null,
      "content": "",
      "audioList": [
        { "title": "Compass", "profile": "song", "resourceUrl": "https://..." }
      ]
    }
  }
}
```

- `audioList` — array of `{ title, profile, resourceUrl }`.

#### `type: "table"` — Simple Table Widget

Uses `tableList` array of `{ id, title, rowMap, columnMap, cellMap }`. Not covered in detail here; see XML format for the structure.

### Rich-Text Document Structure

Wiki JSON uses a **reference DAG** (not a nested tree):

- `blockIds` — ordered top-level block IDs
- `blockMap` — `{ [blockId]: Block }`, each block has `id`, `parentId`, `align`, `kind`, plus type-specific fields
- For lists: `childIds` + `itemMap` (nested sub-lists reference by ID)
- For tables: `rowMap`, `columnMap`, `cellMap` (grid cells reference by ID)

This DAG structure is the primary reason XML is recommended — XML flattens the DAG into nested trees, making it far more readable.

#### Block Kinds

| `kind` | Block Type |
|--------|-----------|
| `"text"` | Paragraph (body, heading1–3 determined by `text.kind`) |
| `"quote"` | Quote block with nested `childIds` |
| `"list"` | List (ordered/unordered via `list.kind`) |
| `"image"` | Image |
| `"line"` | Horizontal line |
| `"table"` | Complex table |

#### Inline Element Kinds

| `kind` | Inline Type |
|--------|------------|
| `"text"` | Plain text (may have `bold`, `italic`, `underline`, `strike`, `color` flags) |
| `"link"` | Hyperlink with `href` |
| `"entry"` | Entry reference with `showType`, `entryId`, optional `count` |
| `"pron"` | Pronunciation/ruby text |

## JSON Color Names (20 colors)

| JSON Name | Category |
|-----------|----------|
| `light_text_primary` | Text scale |
| `light_text_secondary` | Text scale |
| `light_text_tertiary` | Text scale |
| `light_text_quaternary` | Text scale |
| `light_rank_gray` | Rank |
| `light_rank_green` | Rank |
| `light_rank_blue` | Rank |
| `light_rank_purple` | Rank |
| `light_rank_yellow` | Rank |
| `light_rank_orange` | Rank |
| `light_function_orange` | Function |
| `light_function_turquoise` | Function |
| `light_function_green` | Function |
| `light_function_sandstone` | Function |
| `light_function_yellow` | Function |
| `light_function_red` | Function |
| `light_function_blue` | Function |
| `light_function_brown` | Function |
| `light_function_violet` | Function |
| `light_function_blueness` | Function |

## JSON Entry `showType` Values (3 types)

| `showType` | Description |
|-----------|-------------|
| `card-big` | Large card entry reference |
| `link-imgText` | Image-link entry reference |
| `link-text` | Text-link entry reference |
