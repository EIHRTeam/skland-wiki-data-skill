# 02 — `<sklandDocument>` XML Format and Cheatsheet

Status: `confirmed`

The `<sklandDocument>` XML format is the human-readable, diff-friendly alternative to the opaque wiki JSON reference DAG. It is the **recommended canonical format** for storage, editing, and review.

## Root Structure

```xml
<?xml version="1.0" encoding="UTF-8"?>
<sklandDocument>
    <itemId>114514</itemId>
    <publicMeta>{"infoRoot":{...},"item":{...},"brief":{...},"documentExtraInfo":{...}}</publicMeta>
    <metainfo>
        <name>Item Name</name>
        <cover showInDetail="true">https://...</cover>
        <subTypes>
            <subType id="10000">10001</subType>
        </subTypes>
    </metainfo>
    <description source="null">
        Brief description text with <b>rich formatting</b>.
    </description>
    <chapters name="Group Title">
        <chapter size="large" name="Chapter Name">...</chapter>
    </chapters>
</sklandDocument>
```

| Element | Parent | Required | Description |
|---------|--------|----------|-------------|
| `<itemId>` | `<sklandDocument>` | Yes | Item identifier |
| `<publicMeta>` | `<sklandDocument>` | No | Inline JSON with read-model metadata keys: `infoRoot`, `item`, `brief`, `documentExtraInfo` |
| `<metainfo>` | `<sklandDocument>` | Yes | Display metadata wrapper |
| `<name>` | `<metainfo>` | Yes | Item display name |
| `<cover>` | `<metainfo>` | Yes | Cover image URL; attr `showInDetail="true\|false"` |
| `<subTypes>` | `<metainfo>` | Yes | Wrapper; contains `<subType id="...">value</subType>` |
| `<description>` | `<sklandDocument>` | No | Brief description rich-text; attr `source="null"` when the source description was `null` |
| `<chapters>` | `<sklandDocument>` | No (zero or more) | Chapter group; attr `name` is the group title |

## Block Elements Cheatsheet

| Tag | Attributes | Allowed Children | Description |
|-----|-----------|-----------------|-------------|
| `<h1>` | — | inline text, inline elements | Level 1 heading |
| `<h2>` | — | inline text, inline elements | Level 2 heading |
| `<h3>` | — | inline text, inline elements | Level 3 heading |
| `<align value="...">` | `value="left" \| "center" \| "right"` | inline text, inline elements | Aligned paragraph |
| `<quote>` | — | nested blocks (h1, align, ul, etc.) | Quote block |
| `<ul>` | — | `<li>` elements; nested `<ul>`/`<ol>` after `<li>` | Unordered list |
| `<ol>` | — | `<li>` elements; nested `<ul>`/`<ol>` after `<li>` | Ordered list |
| `<img>` | — | `<id>`, `<format>`, `<width>`, `<height>`, `<size>`, `<url>`, `<description>` | Image block |
| `<line kind="...">` | `kind="1" \| "2" \| "3" \| "4" \| "5"` | — (self-closing) | Horizontal separator line |
| `<table header="..." widths="...">` | `header="none" \| "row" \| "col" \| "both"`, `widths="n,n,..."` | `<tr>` containing `<th>`/`<td>` | Complex table |

### `<img>` Child Elements

| Child | Required | Description |
|-------|----------|-------------|
| `<id>` | No | Image identifier (for reverse-mapping; may be empty) |
| `<format>` | No | Image format (for reverse-mapping; may be empty) |
| `<width>` | Yes | Pixel width |
| `<height>` | Yes | Pixel height |
| `<size>` | Yes | File size in bytes |
| `<url>` | Yes | Image URL |
| `<description>` | Yes | Alt text / caption |

### Table Cell Attributes

`<th>` and `<td>` support:

| Attribute | Default | Description |
|-----------|---------|-------------|
| `rowspan` | `1` | Rows spanned |
| `colspan` | `1` | Columns spanned |

## Inline Elements Cheatsheet

| Tag | Attributes | Description |
|-----|-----------|-------------|
| `<b>` | — | Bold text |
| `<i>` | — | Italic text |
| `<u>` | — | Underlined text |
| `<s>` | — | Strikethrough text |
| `<color value="...">` | `value` (XML color code, see table below) | Colored text |
| `<a href="...">` | `href` (URL) | Hyperlink |
| `<pron>` | — | Pronunciation / ruby text; content is pipe-delimited: `text1\|reading1\|text2\|reading2\|...` |
| `<entry type="..." count="..." id="...">` | `type` (see entry map), `count` (number), `id` (target item ID) | Entry reference; self-closing |

## Chapter Types

### Common Chapter (default)

```xml
<chapter size="large" name="Chapter Name">
    <tab name="Tab Name" icon="">
        Tab content — rich text with inline elements.
    </tab>
    <tab name="Image Tab" icon="https://...">
        <imgIntro>
            <name>Image Title</name>
            <type>Image Type</type>
            <imgUrl>https://...</imgUrl>
            <description>Image description</description>
        </imgIntro>
        Content after the image intro.
    </tab>
</chapter>
```

- `size`: `"large"`, `"middle"`, or `"small"`
- `<tab>`: optional, for tabbed chapters. `icon=""` for text-only tabs, URL for icon tabs.
- `<imgIntro>`: optional per-tab image intro with `<name>`, `<type>`, `<imgUrl>`, `<description>`

### Simple Table Chapter

```xml
<chapter size="large" name="Table Name" table="true">
    <table>
        <row>
            <cell label="Label A">Value A</cell>
            <cell label="Label B">Value B</cell>
        </row>
    </table>
</chapter>
```

- Attribute `table="true"` on `<chapter>`.
- 2-column layout: `<cell label="...">` provides the label.
- Cell content supports rich text and inline elements.

### Audio Chapter

```xml
<chapter size="small" name="Audio Name" audio="true">
    <audios>
        <audio name="Track Name" src="https://...">
            Profile text (plain text only)
        </audio>
    </audios>
</chapter>
```

- Attribute `audio="true"` on `<chapter>`.
- Text inside `<audio>` is the profile/description (plain text only, no rich formatting).

## Color Mapping Table (20 colors)

### Text Scale

| XML | JSON | Description |
|-----|------|-------------|
| `s_1` | `light_text_primary` | Primary text color |
| `s_2` | `light_text_secondary` | Secondary text color |
| `s_3` | `light_text_tertiary` | Tertiary text color |
| `s_4` | `light_text_quaternary` | Quaternary text color |

### Rank Scale

| XML | JSON | Description |
|-----|------|-------------|
| `r_1` | `light_rank_gray` | Rank gray |
| `r_2` | `light_rank_green` | Rank green |
| `r_3` | `light_rank_blue` | Rank blue |
| `r_4` | `light_rank_purple` | Rank purple |
| `r_5` | `light_rank_yellow` | Rank yellow |
| `r_6` | `light_rank_orange` | Rank orange |

### Function Scale

| XML | JSON | Description |
|-----|------|-------------|
| `f_orange` | `light_function_orange` | Function orange |
| `f_turquoise` | `light_function_turquoise` | Function turquoise |
| `f_green` | `light_function_green` | Function green |
| `f_sandstone` | `light_function_sandstone` | Function sandstone |
| `f_yellow` | `light_function_yellow` | Function yellow |
| `f_red` | `light_function_red` | Function red |
| `f_blue` | `light_function_blue` | Function blue |
| `f_brown` | `light_function_brown` | Function brown |
| `f_violet` | `light_function_violet` | Function violet |
| `f_blueness` | `light_function_blueness` | Function blueness |

Usage in XML: `<color value="r_2">green text</color>`
Usage in JSON: `{ "kind": "text", "text": { "text": "green text", "color": "light_rank_green" } }`

## Entry Type Mapping

| XML `<entry type="...">` | JSON `showType` | Description |
|--------------------------|-----------------|-------------|
| `card-big` | `card-big` | Large card |
| `link-img` | `link-imgText` | Image link |
| `link-txt` | `link-text` | Text link |

Usage in XML: `<entry type="card-big" count="7" id="8"/>`
Usage in JSON: `{ "kind": "entry", "entry": { "showType": "card-big", "entryId": "8", "count": 7 } }`

## `<publicMeta>` Format

`<publicMeta>` contains an inline JSON object that preserves read-model metadata not represented in the XML tree structure:

```json
{
  "infoRoot": { "code": 0, "message": "OK", "timestamp": "..." },
  "item": { "name": "...", "lang": "zh_Hans", "status": 1, "tagIds": [], ... },
  "brief": { "associate": null, "composite": null },
  "documentExtraInfo": { "illustration": "", "showType": "", "composite": "" }
}
```

Keys:
- `infoRoot` — envelope fields (`code`, `message`, `timestamp`)
- `item` — item-level read-model metadata (`name`, `lang`, `status`, `tagIds`, `createdUser`, `lastUpdatedUser`, `lastAuditPassedAt`, `mainType`, `subType`)
- `brief` — brief-level metadata (`associate`, `composite`)
- `documentExtraInfo` — document extra fields (`illustration`, `showType`, `composite`)

When converting XML back to JSON with `xmlToWikiJson`, the `publicMeta` JSON is merged back into the `InfoRoot`/`InfoItem` structure to produce a complete response object.

## JSON-to-XML Side-by-Side Example

### JSON (from `item/info`)

```json
{
  "kind": "text",
  "text": {
    "kind": "body",
    "inlineElements": [
      { "kind": "text", "text": { "text": "This is " } },
      { "kind": "text", "text": { "text": "bold", "bold": true } },
      { "kind": "text", "text": { "text": " and " } },
      { "kind": "text", "text": { "text": "red", "color": "light_function_red" } }
    ]
  }
}
```

### Equivalent XML

```xml
This is <b>bold</b> and <color value="f_red">red</color>
```

### JSON (image block)

```json
{
  "kind": "image",
  "image": { "url": "https://...", "width": 254, "height": 254, "size": 8614, "description": "Alt text" }
}
```

### Equivalent XML

```xml
<img>
    <width>254</width>
    <height>254</height>
    <size>8614</size>
    <url>https://...</url>
    <description>Alt text</description>
</img>
```

## Do Not Infer

- Byte-level XML output is not stable across `@eihrteam/xml` package versions. Only `DocumentModel` equivalence is guaranteed.
- Not every JSON field has a 1:1 XML element counterpart — `publicMeta` is a catch-all for metadata.
- XML attribute ordering is not specified; do not rely on it.
- `<id>` and `<format>` inside `<img>` are used for reverse-mapping image identifiers back to JSON. When missing from XML input, they will not be generated in the JSON output.
