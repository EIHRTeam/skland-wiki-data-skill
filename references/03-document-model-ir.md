# 03 — DocumentModel Intermediate Representation

Status: `confirmed`. Source: `@eihrteam/xml` `src/model.ts`.

The `DocumentModel` is the **canonical intermediate representation** used by `@eihrteam/xml`. All conversion paths go through it: JSON → DocumentModel → XML, and XML → DocumentModel → JSON. It decouples the JSON reference DAG from the XML nested tree, enabling format-independent data manipulation.

## Contents

- [Top-Level: `DocumentModel`](#top-level-documentmodel)
- [Chapter and Grouping Types](#chapter-and-grouping-types)
- [Block Types (6)](#block-types-6)
  - [`ParagraphBlock`](#paragraphblock)
  - [`QuoteBlock`](#quoteblock)
  - [`ListBlock`](#listblock)
  - [`ImageBlock`](#imageblock)
  - [`HorizontalLineBlock`](#horizontallineblock)
  - [`ComplexTableBlock`](#complextableblock)
- [Inline Types (4)](#inline-types-4)
  - [`TextRunInline`](#textruninline)
  - [`PronunciationInline`](#pronunciationinline)
  - [`LinkInline`](#linkinline)
  - [`EntryRefInline`](#entryrefinline)
- [Type Guards](#type-guards)
- [Constructors](#constructors)
- [Helpers](#helpers)
- [Why DocumentModel Exists](#why-documentmodel-exists)
- [Error Type](#error-type)

## Top-Level: `DocumentModel`

```ts
interface DocumentModel {
  itemId: string
  infoRootMeta: Record<string, unknown>   // Envelope metadata (code, message, timestamp)
  publicMeta: Record<string, unknown>     // Item-level read-model metadata (name, lang, status, etc.)
  briefExtra: Record<string, unknown>     // Brief-level extra fields (associate, composite)
  documentExtraInfo: Record<string, unknown>  // Document extra (illustration, showType, composite)
  name: string                            // Display name
  cover: string                           // Cover image URL
  showInDetail: boolean                   // Whether cover shows in detail view
  subTypes: SubType[]                     // Array of { subTypeId, value }
  descriptionWasNull: boolean             // True if source brief description was null
  description: Block[]                    // Brief description blocks
  chapterGroups: ChapterGroup[]           // Content chapter groups
}
```

## Chapter and Grouping Types

```ts
interface ChapterGroup {
  title: string
  chapters: Chapter[]
}

interface Chapter {
  title: string
  size: string          // "large" | "middle" | "small"
  chapterType: string   // "common" | "simple_table" | "audio"
  content: Block[]      // Direct content (for non-tabbed common chapters)
  tabs: Tab[]           // Tab content (for tabbed common chapters)
  audios: AudioItem[]   // Audio tracks (for audio chapters)
  tableRows: TableRow[] // Simple table rows (for simple_table chapters)
}

interface Tab {
  title: string | null
  icon: string | null
  intro: ImageIntro | null
  content: Block[]
}

interface ImageIntro {
  name: string
  introType: string
  imageUrl: string
  description: string
}

interface AudioItem {
  title: string
  profile: string
  resourceUrl: string
}

interface TableRow {
  cells: Array<[string, string]>  // [label, value] pairs
}

interface SubType {
  subTypeId: string
  value: string
}
```

## Block Types (6)

```ts
type Block = ParagraphBlock | QuoteBlock | ListBlock
           | ImageBlock | HorizontalLineBlock | ComplexTableBlock
```

### `ParagraphBlock`

```ts
interface ParagraphBlock {
  blockType: 'paragraph'
  kind: string    // "body" | "heading1" | "heading2" | "heading3"
  align: string   // "left" | "center" | "right"
  inlines: Inline[]
}
```

### `QuoteBlock`

```ts
interface QuoteBlock {
  blockType: 'quote'
  children: Block[]
}
```

### `ListBlock`

```ts
interface ListBlock {
  blockType: 'list'
  ordered: boolean
  items: ListItem[]
}

interface ListItem {
  blocks: Block[]
}
```

### `ImageBlock`

```ts
interface ImageBlock {
  blockType: 'image'
  url: string
  width: string
  height: string
  size: string
  imageId: string
  imageFormat: string
  description: string
}
```

### `HorizontalLineBlock`

```ts
interface HorizontalLineBlock {
  blockType: 'horizontalLine'
  kind: string   // "1" through "5"
}
```

### `ComplexTableBlock`

```ts
interface ComplexTableBlock {
  blockType: 'complexTable'
  headerMode: string        // "none" | "row" | "col" | "both"
  columnWidths: number[]
  cells: ComplexTableCell[]
  rowCount: number
  columnCount: number
}

interface ComplexTableCell {
  rowIndex: number
  columnIndex: number
  blocks: Block[]
  rowSpan: number    // default 1
  colSpan: number    // default 1
}
```

## Inline Types (4)

```ts
type Inline = TextRunInline | PronunciationInline | LinkInline | EntryRefInline
```

### `TextRunInline`

```ts
interface TextRunInline {
  inlineType: 'text'
  text: string
  bold: boolean
  italic: boolean
  underline: boolean
  strike: boolean
  color: string | null   // JSON color name, e.g. "light_rank_green"
}
```

### `PronunciationInline`

```ts
interface PronunciationInline {
  inlineType: 'pronunciation'
  content: string   // Pipe-delimited: "text1|reading1|text2|reading2|..."
}
```

### `LinkInline`

```ts
interface LinkInline {
  inlineType: 'link'
  href: string
  text: string
}
```

### `EntryRefInline`

```ts
interface EntryRefInline {
  inlineType: 'entry'
  entryType: string   // "card-big" | "link-img" | "link-txt"
  targetId: string
  count: string
}
```

## Type Guards

```ts
function isParagraph(block: Block): block is ParagraphBlock    // blockType === 'paragraph'
function isQuote(block: Block): block is QuoteBlock             // blockType === 'quote'
function isList(block: Block): block is ListBlock               // blockType === 'list'
function isImage(block: Block): block is ImageBlock             // blockType === 'image'
function isComplexTable(block: Block): block is ComplexTableBlock // blockType === 'complexTable'
function isTextRun(inline: Inline): inline is TextRunInline     // inlineType === 'text'
function isRecord(value: unknown): value is Record<string, unknown>
```

## Constructors

### `textRun(text, options?)`

```ts
function textRun(
  text: string,
  options?: Partial<Omit<TextRunInline, 'inlineType' | 'text'>>
): TextRunInline
```

Defaults: `bold: false`, `italic: false`, `underline: false`, `strike: false`, `color: null`.

### `paragraph(inlines?, kind?, align?)`

```ts
function paragraph(
  inlines?: Inline[],
  kind?: string,    // default "body"
  align?: string    // default "left"
): ParagraphBlock
```

## Helpers

### `normalizeBlocks(blocks: Block[]): Block[]`

Normalizes a block tree for comparison:
1. Merges adjacent `TextRunInline` items with identical formatting (`bold`, `italic`, `underline`, `strike`, `color`)
2. Removes empty body paragraphs (no inlines with content)
3. Strips leading/trailing empty body paragraphs
4. Collapses consecutive empty paragraphs into one
5. Sorts `ComplexTableCell` items by position
6. Validates table structure (header mode, row/col counts, widths, cell coverage)

### `blocksToPlainText(blocks: Block[]): string`

Extracts plain text from `ParagraphBlock` elements only. Non-paragraph blocks are skipped. Joined with `'\n'`.

### `inlinesToPlainText(inlines: Inline[]): string`

Extracts plain text from inline elements. Joins `text` (for `TextRunInline`), `content` (for pronunciation), or `text` (for links).

### `iterImageBlocks(blocks: Block[]): Generator<ImageBlock>`

Recursively yields all `ImageBlock` elements from a block tree, including those nested inside quotes, lists, and complex tables.

### `mergeAdjacentTextRuns(inlines: Inline[]): Inline[]`

Merges adjacent `TextRunInline` elements that have identical formatting attributes into a single run.

### `validateComplexTableBlock(block: ComplexTableBlock): void`

Validates:
- `headerMode` is one of `"none"`, `"row"`, `"col"`, `"both"`
- `rowCount` and `columnCount` are positive
- `columnWidths` length matches `columnCount`
- All widths are positive finite numbers
- Cell positions are non-negative
- Cell spans are positive integers
- Cell rows/columns stay within bounds
- All grid positions are covered (no gaps)
- Image widths inside cells are numeric

### `isEmptyParagraph(block: Block): boolean`

True if the block is a `body` paragraph with no inlines that have content.

### `inlineHasContent(inline: Inline): boolean`

True if the inline has meaningful content (non-empty text, href, pronunciation, or targetId).

### `isHeaderPosition(headerMode, rowIndex, columnIndex): boolean`

Returns whether a cell at `(rowIndex, columnIndex)` should be rendered as a header (`<th>`) given the table's `headerMode`.

## Why DocumentModel Exists

The wiki JSON format uses a reference DAG (`blockMap` keyed by generated IDs, `childIds` lists, `widgetCommonMap`/`documentMap` keyed by widget/doc IDs). Editing this directly requires understanding the ID graph, regenerating IDs correctly, and maintaining referential integrity.

The XML format uses nested trees with descriptive tag names — easy to read, diff, and edit, but not directly consumable by the wiki API.

`DocumentModel` sits between them: a clean, typed, format-independent tree. You can parse from either format, manipulate the tree programmatically, and render to either format. This is the recommended approach for any programmatic wiki data manipulation.

## Error Type

```ts
class XmlWikiConversionError extends Error {
  constructor(message: string)
}
```

Also exported as `EndfieldWikitextConversionError` (deprecated alias).
