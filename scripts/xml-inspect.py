"""SKLand Wiki Data — XML inspection utilities for <sklandDocument> files.

Uses Python standard library xml.etree.ElementTree only.

Functions:
    validate_xml_basic(path) — Check well-formedness and root tag.
    list_skland_tags(xml_text) — Collect all unique tag names present.
    extract_text_content(xml_text) — Extract all text content as a single string.
    count_blocks(xml_text) — Count chapter groups, chapters, and block elements.
"""

from __future__ import annotations

import json
import sys
from xml.etree import ElementTree


def validate_xml_basic(path: str) -> dict:
    """Check well-formedness and that root is <sklandDocument>."""
    try:
        tree = ElementTree.parse(path)
        root = tree.getroot()
        valid = root.tag == "sklandDocument"
        return {
            "valid": valid,
            "rootTag": root.tag,
            "error": None if valid else f"Root tag is <{root.tag}>, expected <sklandDocument>",
        }
    except ElementTree.ParseError as e:
        return {"valid": False, "rootTag": None, "error": str(e)}
    except OSError as e:
        return {"valid": False, "rootTag": None, "error": str(e)}


def list_skland_tags(xml_text: str) -> dict:
    """Collect all unique tag names present in the XML."""
    root = ElementTree.fromstring(xml_text)
    tags: set[str] = set()

    def _collect(el):
        tags.add(el.tag)
        for child in el:
            _collect(child)

    _collect(root)
    return {"rootTag": root.tag, "allTags": sorted(tags)}


def extract_text_content(xml_text: str) -> dict:
    """Extract all text content, joined with newlines."""
    root = ElementTree.fromstring(xml_text)
    texts: list[str] = []

    def _extract(el):
        if el.text and el.text.strip():
            texts.append(el.text.strip())
        if el.tail and el.tail.strip():
            texts.append(el.tail.strip())
        for child in el:
            _extract(child)

    _extract(root)
    return {"text": "\n".join(texts)}


_BLOCK_TAGS = {"h1", "h2", "h3", "align", "quote", "ul", "ol", "img", "line"}
_CHAPTER_TYPES = {"common", "simple_table", "audio"}


def count_blocks(xml_text: str) -> dict:
    """Count chapter groups, chapters, and block elements."""
    root = ElementTree.fromstring(xml_text)
    namespace = ""
    # Handle possible XML namespace
    if "}" in root.tag:
        namespace = root.tag.split("}")[0] + "}"

    def _tag(local: str) -> str:
        return f"{namespace}{local}"

    chapter_groups = root.findall(f".//{_tag('chapters')}")
    chapters = root.findall(f".//{_tag('chapter')}")
    chapter_types: dict[str, int] = {}
    for ch in chapters:
        if ch.get("table") == "true":
            chapter_types["simple_table"] = chapter_types.get("simple_table", 0) + 1
        elif ch.get("audio") == "true":
            chapter_types["audio"] = chapter_types.get("audio", 0) + 1
        else:
            chapter_types["common"] = chapter_types.get("common", 0) + 1

    block_counts: dict[str, int] = {}
    for tag in _BLOCK_TAGS:
        count = len(root.findall(f".//{_tag(tag)}"))
        if count > 0:
            block_counts[tag] = count

    images = root.findall(f".//{_tag('img')}")
    table_count = sum(
        1
        for t in root.findall(f".//{_tag('table')}")
        if not (t.getparent() is not None and t.getparent().get("table") == "true")
    )

    return {
        "chapterGroupCount": len(chapter_groups),
        "chapterCount": len(chapters),
        "chapterTypes": chapter_types,
        "blockCounts": block_counts,
        "imageCount": len(images),
        "complexTableCount": table_count,
    }


def _main() -> None:
    if len(sys.argv) < 3:
        print(
            "Usage: python scripts/xml-inspect.py <command> <file>",
            file=sys.stderr,
        )
        print("Commands: validate, tags, text, count", file=sys.stderr)
        sys.exit(1)

    command = sys.argv[1]
    path = sys.argv[2]

    with open(path, encoding="utf-8") as f:
        xml_text = f.read()

    commands = {
        "validate": lambda: validate_xml_basic(path),
        "tags": lambda: list_skland_tags(xml_text),
        "text": lambda: extract_text_content(xml_text),
        "count": lambda: count_blocks(xml_text),
    }

    fn = commands.get(command)
    if not fn:
        print(f"Unknown command: {command}", file=sys.stderr)
        print("Available: validate, tags, text, count", file=sys.stderr)
        sys.exit(1)

    result = fn()
    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    _main()
