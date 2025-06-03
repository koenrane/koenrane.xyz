# pylint: disable=C0302
"""
Script to check the built static site for common issues and errors.
"""

import argparse
import os
import re
import subprocess
import sys
from collections import Counter
from pathlib import Path
from typing import Dict, Literal, NamedTuple, Set
from urllib.parse import urlparse

import requests  # type: ignore[import]
import tqdm
import validators  # type: ignore[import]
from bs4 import BeautifulSoup, NavigableString, Tag

# Add the project root to sys.path
# pylint: disable=C0413
sys.path.append(str(Path(__file__).parent.parent))

from scripts import compress, source_file_checks
from scripts import utils as script_utils

_GIT_ROOT = script_utils.get_git_root()
_PUBLIC_DIR: Path = _GIT_ROOT / "public"
RSS_XSD_PATH = _GIT_ROOT / "scripts" / ".rss-2.0.xsd"

_IssuesDict = Dict[str, list[str] | list[Tag] | bool]

# Define the parser but don't parse immediately
parser = argparse.ArgumentParser(
    description="Check the built static site for issues."
)
parser.add_argument(
    "--check-fonts",
    action="store_true",
    default=False,
    help="Enable checking for preloaded fonts",
)


def check_localhost_links(soup: BeautifulSoup) -> list[str]:
    """
    Check for localhost links in the HTML.
    """
    localhost_links = []
    links = soup.find_all("a", href=True)
    for link in links:
        href = link["href"]
        if href.startswith("localhost:") or href.startswith(
            ("http://localhost", "https://localhost")
        ):
            localhost_links.append(href)
    return localhost_links


def check_favicons_missing(soup: BeautifulSoup) -> bool:
    """
    Check if favicons are missing.
    """
    return not soup.select("article p img.favicon")


def check_unrendered_footnotes(soup: BeautifulSoup) -> list[str]:
    """
    Check for unrendered footnotes in the format [^something].

    Returns a list of the footnote references themselves.
    """
    # Matches [^1], [^note], [^note-1], etc.
    footnote_pattern = r"\[\^[a-zA-Z0-9-_]+\]"
    unrendered_footnotes = []

    for p in soup.find_all("p"):
        matches = re.findall(footnote_pattern, p.text)
        if matches:
            unrendered_footnotes.extend(matches)

    return unrendered_footnotes


def check_invalid_internal_links(soup: BeautifulSoup) -> list[Tag]:
    """
    Check for links which do not have an href attribute or which start with
    "https://".
    """
    invalid_internal_links = []
    links = soup.find_all("a", class_="internal")
    for link in links:
        if not link.has_attr("href") or link["href"].startswith("https://"):
            invalid_internal_links.append(link)

    return invalid_internal_links


def check_invalid_anchors(soup: BeautifulSoup, base_dir: Path) -> list[str]:
    """
    Check for invalid internal anchor links in the HTML.
    """
    invalid_anchors: list[str] = []
    links = soup.find_all("a", href=True)
    for link in links:
        href = link["href"]
        if href.startswith("#"):
            # Check anchor in current page
            anchor_id = href[1:]
            if not soup.find(id=anchor_id):
                _append_to_list(
                    invalid_anchors,
                    href,
                    prefix="Invalid anchor: ",
                )
        elif (href.startswith("/") or href.startswith(".")) and "#" in href:
            # Check anchor in other internal page
            page_path, anchor = href.split("#", 1)
            # Remove leading ".." from page_path
            page_path = page_path.lstrip("./")
            full_path = base_dir / page_path
            if not full_path.suffix == ".html":
                full_path = full_path.with_suffix(".html")

            if full_path.is_file():
                with open(full_path, encoding="utf-8") as f:
                    page_soup = BeautifulSoup(f.read(), "html.parser")
                if not page_soup.find(id=anchor):
                    _append_to_list(
                        invalid_anchors,
                        href,
                        prefix="Invalid anchor: ",
                    )
            else:
                _append_to_list(
                    invalid_anchors,
                    href,
                    prefix="Invalid anchor: ",
                )  # Page doesn't exist
    return invalid_anchors


# Check that no blockquote element ends with ">",
# because it probably needed a newline before it
def check_blockquote_elements(soup: BeautifulSoup) -> list[str]:
    """
    Check for blockquote elements ending with ">" as long as they don't end in
    a "<\\w+>" pattern.
    """
    problematic_blockquotes: list[str] = []
    blockquotes = soup.find_all("blockquote")
    for blockquote in blockquotes:
        contents = list(blockquote.stripped_strings)
        if contents:
            last_part = contents[-1].strip()
            if last_part.endswith(">") and not re.search(r"<\w+>$", last_part):
                _append_to_list(
                    problematic_blockquotes,
                    " ".join(contents),
                    prefix="Problematic blockquote: ",
                )
    return problematic_blockquotes


def check_unrendered_html(soup: BeautifulSoup) -> list[str]:
    """
    Check for unrendered HTML in the page.

    Looks for text content containing HTML-like patterns (<tag>, </tag>, or
    <tag/>) that should have been rendered by the markdown processor.
    """
    problematic_texts: list[str] = []

    # Basic HTML tag pattern
    tag_pattern = r"(</?[a-zA-Z][a-zA-Z0-9]*(?: |/?>))"

    for element in soup.find_all(string=True):
        if not should_skip(element):  # Reuse existing skip logic
            text = element.strip()
            if text:
                # Look for HTML-like patterns
                matches = re.findall(tag_pattern, text)
                if matches:
                    _append_to_list(
                        problematic_texts,
                        text,
                        prefix=f"Unrendered HTML {matches}: ",
                    )

    return problematic_texts


def _append_to_list(
    lst: list[str],
    text: str,
    show_end: bool = False,
    preview_chars: int = 100,
    prefix: str = "",
) -> None:
    """
    Append a text string to a list, truncating if necessary.
    """
    if preview_chars <= 0:
        raise ValueError("preview_chars must be greater than 0")

    if not text:
        return

    to_append = text
    if len(text) > preview_chars:
        to_append = (
            text[-preview_chars:] + "..." if show_end else text[:preview_chars]
        )

    lst.append(prefix + to_append)


def paragraphs_contain_canary_phrases(soup: BeautifulSoup) -> list[str]:
    """
    Check for text nodes starting with specific phrases.

    Ignores text within <code> tags.
    """
    bad_anywhere = (r"> \[\![a-zA-Z]+\]",)  # Callout syntax
    bad_prefixes = (r"Table: ", r"Figure: ", r"Code: ", r"Caption: ")
    bad_paragraph_starting_prefixes = (r"^: ", r"^#+ ")

    problematic_paragraphs: list[str] = []

    def _maybe_add_text(text: str) -> None:
        text = text.strip()
        if any(re.search(pattern, text) for pattern in bad_anywhere) or any(
            re.search(prefix, text) for prefix in bad_prefixes
        ):
            _append_to_list(
                problematic_paragraphs, text, prefix="Problematic paragraph: "
            )

    # Check all <p> and <dt> elements
    for element in soup.find_all(["p", "dt"]):
        if any(
            re.search(prefix, element.text)
            for prefix in bad_paragraph_starting_prefixes
        ):
            _append_to_list(
                problematic_paragraphs,
                element.text,
                prefix="Problematic paragraph: ",
            )
        for text_node in element.find_all(string=True):
            if not any(parent.name == "code" for parent in text_node.parents):
                _maybe_add_text(text_node)

    # Check direct text in <article> and <blockquote>
    for parent in soup.find_all(["article", "blockquote"]):
        for child in parent.children:
            if isinstance(child, str):  # Check if it's a direct text node
                _maybe_add_text(child)

    return problematic_paragraphs


def check_unrendered_spoilers(soup: BeautifulSoup) -> list[str]:
    """
    Check for unrendered spoilers.
    """
    unrendered_spoilers: list[str] = []
    blockquotes = soup.find_all("blockquote")
    for blockquote in blockquotes:
        # Check each paragraph / text child in the blockquote
        for child in blockquote.children:
            if child.name == "p":
                text = child.get_text().strip()
                if text.startswith("! "):
                    _append_to_list(
                        unrendered_spoilers,
                        text,
                        prefix="Unrendered spoiler: ",
                    )
    return unrendered_spoilers


def check_unrendered_subtitles(soup: BeautifulSoup) -> list[str]:
    """
    Check for unrendered subtitle lines.
    """
    unrendered_subtitles: list[str] = []
    paragraphs = soup.find_all("p")
    for p in paragraphs:
        text = p.get_text().strip()
        if text.startswith("Subtitle:") and "subtitle" not in p.get(
            "class", []
        ):
            _append_to_list(
                unrendered_subtitles, text, prefix="Unrendered subtitle: "
            )
    return unrendered_subtitles


# Check the existence of local files with these extensions
_MEDIA_EXTENSIONS = list(compress.ALLOWED_EXTENSIONS) + [
    ".svg",
    ".avif",
    ".ico",
]


def resolve_media_path(src: str, base_dir: Path) -> Path:
    """
    Resolve a media file path, trying both absolute and relative paths.

    Args:
        src: The source path from the HTML tag
        base_dir: The base directory to resolve paths from

    Returns:
        The resolved Path object
    """
    if src.startswith("/"):
        return (base_dir / src.lstrip("/")).resolve()

    # For relative paths, try both direct and with base_dir
    full_path = (base_dir / src).resolve()
    if not full_path.is_file():
        # Try relative to base_dir
        full_path = (base_dir / src.lstrip("./")).resolve()

    return full_path


ALLOWED_ASSET_DOMAINS = {"assets.turntrout.com"}


def check_media_asset_sources(soup: BeautifulSoup) -> list[str]:
    """
    Check that media assets (images, SVGs, videos) are only hosted from allowed
    sources.

    Returns:
        list of asset URLs that are not from allowed sources
    """
    invalid_sources = []
    media_tags = soup.find_all(["img", "video", "source", "svg"])

    for tag in media_tags:
        src = tag.get("src") or tag.get("href")
        # Skip relative paths
        if not src or src.startswith(("/", ".", "..")):
            continue

        # Check if source is from allowed domain
        if "//" not in src or src.split("/")[2] not in ALLOWED_ASSET_DOMAINS:
            invalid_sources.append(f"{src} (in {tag.name} tag)")

    return invalid_sources


def check_local_media_files(soup: BeautifulSoup, base_dir: Path) -> list[str]:
    """
    Verify the existence of local media files (images, videos, SVGs).
    """
    missing_files = []
    media_tags = soup.find_all(["img", "video", "source", "svg"])

    for tag in media_tags:
        src = tag.get("src") or tag.get("href")
        if src and not src.startswith(("http://", "https://")):
            # It's a local file
            file_extension = Path(src).suffix.lower()
            if file_extension in _MEDIA_EXTENSIONS:
                full_path = resolve_media_path(src, base_dir)
                if not full_path.is_file():
                    missing_files.append(f"{src} (resolved to {full_path})")

    return missing_files


def check_asset_references(
    soup: BeautifulSoup, file_path: Path, base_dir: Path
) -> list[str]:
    """
    Check for asset references and verify their existence.
    """
    missing_assets = []

    def resolve_asset_path(href: str) -> Path:
        if href.startswith("/"):
            # Absolute path within the site
            return (base_dir / href.lstrip("/")).resolve()
        # Relative path
        return (file_path.parent / href).resolve()

    def check_asset(href: str) -> None:
        if href and not href.startswith(("http://", "https://")):
            full_path = resolve_asset_path(href)
            if not full_path.is_file():
                missing_assets.append(f"{href} (resolved to {full_path})")

    # Check link tags for CSS files (including preloaded stylesheets)
    for link in soup.find_all("link"):
        rel = link.get("rel", [])
        if isinstance(rel, list):
            rel = " ".join(rel)
        if "stylesheet" in rel or (
            "preload" in rel and link.get("as") == "style"
        ):
            check_asset(link.get("href"))

    # Check script tags for JS files
    for script in soup.find_all("script", src=True):
        check_asset(script["src"])

    return missing_assets


def check_katex_elements_for_errors(soup: BeautifulSoup) -> list[str]:
    """
    Check for KaTeX elements with color #cc0000.
    """
    problematic_katex: list[str] = []
    katex_elements = soup.select(".katex-error")
    for element in katex_elements:
        content = element.get_text().strip()
        _append_to_list(problematic_katex, content, prefix="KaTeX error: ")
    return problematic_katex


def katex_element_surrounded_by_blockquote(soup: BeautifulSoup) -> list[str]:
    """
    Check for KaTeX display elements that start with '>>' but aren't inside a
    blockquote.

    These mathematical statements should be inside a blockquote.
    """
    problematic_katex: list[str] = []

    # Find all KaTeX display elements
    katex_displays = soup.find_all(class_="katex-display")
    for katex in katex_displays:
        content = katex.get_text().strip()
        # Check if content starts with '>' and isn't inside a blockquote
        if content.startswith(">"):
            _append_to_list(problematic_katex, content, prefix="KaTeX error: ")

    return problematic_katex


def check_critical_css(soup: BeautifulSoup) -> bool:
    """
    Check if the page has exactly one critical CSS block in the head.
    """
    head = soup.find("head")
    if isinstance(head, Tag):
        critical_css_blocks = head.find_all("style", {"id": "critical-css"})
        return len(critical_css_blocks) == 1
    return False


def check_duplicate_ids(soup: BeautifulSoup) -> list[str]:
    """
    Check for duplicate anchor IDs in the HTML.

    Returns a list of:
    - IDs that appear multiple times
    - IDs existing with and without -\\d suffix (e.g., 'intro' and 'intro-1')
    Excludes IDs within mermaid flowcharts.
    """
    # Get all IDs except those in flowcharts
    elements_with_ids = [
        element["id"]
        for element in soup.find_all(id=True)
        if not element.find_parent(class_="flowchart")
    ]

    # Count occurrences of each ID
    id_counts = Counter(elements_with_ids)
    duplicates = []

    # Check for both duplicates and numbered variants
    for id_, count in id_counts.items():
        # It's ok for multiple fnrefs to reference the same note
        if id_.startswith("user-content-fnref-"):
            continue

        if count > 1:
            duplicates.append(f"{id_} (found {count} times)")

        # Check if this is a base ID with numbered variants
        if not re.search(r".*-\d+$", id_):  # If this is not a numbered ID
            numbered_variants = [
                other_id
                for other_id in id_counts
                if other_id.startswith(id_ + "-")
                and re.search(r".*-\d+$", other_id)
            ]
            if numbered_variants:
                total = count + sum(
                    id_counts[variant] for variant in numbered_variants
                )
                duplicates.append(
                    f"{id_} (found {total} times, including numbered variants)"
                )

    return duplicates


EMPHASIS_ELEMENTS_TO_SEARCH = (
    "p",
    "dt",
    "figcaption",
    "dd",
    "li",
    *(f"h{i}" for i in range(1, 7)),
)


def check_unrendered_emphasis(soup: BeautifulSoup) -> list[str]:
    """
    Check for any unrendered emphasis characters (* or _) in text content.
    Excludes code blocks, scripts, styles, and KaTeX elements.

    Args:
        soup: BeautifulSoup object to check

    Returns:
        list of strings containing problematic text with emphasis characters
    """
    problematic_texts: list[str] = []

    for text_elt in soup.find_all(EMPHASIS_ELEMENTS_TO_SEARCH):
        # Get text excluding code and KaTeX elements
        stripped_text = script_utils.get_non_code_text(text_elt)

        if stripped_text and (re.search(r"\*|\_(?!\_* +\%)", stripped_text)):
            _append_to_list(
                problematic_texts,
                stripped_text,
                show_end=True,
                prefix="Unrendered emphasis: ",
            )

    return problematic_texts


def should_skip(element: Tag | NavigableString) -> bool:
    """
    Check if element should be skipped based on formatting_improvement_html.ts
    rules.
    """
    skip_tags = {"code", "pre", "script", "style"}
    skip_classes = {"no-formatting", "elvish", "bad-handwriting"}

    # Check current element and all parents
    current: Tag | NavigableString | None = element
    while current:
        if isinstance(
            current, Tag
        ):  # Only check Tag elements, not NavigableString
            if current.name in skip_tags or any(
                class_ in (current.get("class", []) or [])
                for class_ in skip_classes
            ):
                return True
        current = current.parent if isinstance(current.parent, Tag) else None
    return False


def check_unprocessed_quotes(soup: BeautifulSoup) -> list[str]:
    """
    Check for text nodes containing straight quotes (" or ') that should have
    been processed by formatting_improvement_html.ts.

    Skips nodes that would be skipped by the formatter:
    - Inside code, pre, script, style tags
    - Elements with classes: no-formatting, elvish, bad-handwriting
    """
    problematic_quotes: list[str] = []

    # Check all text nodes
    for element in soup.find_all(string=True):
        if element.strip() and not should_skip(element):
            # Look for straight quotes
            straight_quotes = re.findall(r'["\']', element.string)
            if straight_quotes:
                _append_to_list(
                    problematic_quotes,
                    element.string,
                    prefix=f"Unprocessed quotes {straight_quotes}: ",
                )

    return problematic_quotes


def check_unprocessed_dashes(soup: BeautifulSoup) -> list[str]:
    """
    Check for text nodes containing multiple dashes (-- or ---) that should
    have been processed into em dashes by formatting_improvement_html.ts.
    """
    problematic_dashes: list[str] = []

    for element in soup.find_all(string=True):
        if element.strip() and not should_skip(element):
            # Look for two or more dashes in a row
            if re.search(r"[~\–\—\-\–]{2,}", element.string):
                _append_to_list(
                    problematic_dashes,
                    element.string,
                    prefix="Unprocessed dashes: ",
                )

    return problematic_dashes


# NOTE that this is in bytes, not characters
MAX_META_HEAD_SIZE = 9 * 1024  # 9 instead of 10 to avoid splitting tags


def meta_tags_early(file_path: Path) -> list[str]:
    """
    Check that meta and title tags are NOT present between MAX_HEAD_SIZE and
    </head>. EG Facebook only checks the first 10KB.

    Args:
        file_path: Path to the HTML file to check

    Returns:
        list of tags found after MAX_HEAD_SIZE but before </head>
    """
    issues: list[str] = []

    # Read entire HTML content first.
    # skipcq: PTC-W6004 - Only used for checks, not user-facing
    with open(file_path, "rb") as f:
        content_bytes = f.read()

    # If file is smaller than MAX_META_HEAD_SIZE, no issues possible
    if len(content_bytes) <= MAX_META_HEAD_SIZE:
        return []

    # Convert the first chunk and remainder to strings
    content = content_bytes.decode("utf-8")

    # Find where the byte boundary falls in terms of characters
    boundary_content = content_bytes[:MAX_META_HEAD_SIZE].decode("utf-8")
    char_boundary = len(boundary_content)

    # Consider everything past the byte boundary
    remainder = content[char_boundary:]

    # If no </head>, our checks don't apply
    if "</head>" not in remainder:
        return []

    # Only look up to the closing </head>
    head_content = remainder.split("</head>")[0]

    # Look for <meta ...> or <title ...> within that region
    for tag in ("meta", "title"):
        # Matches <meta ...> or </meta>, similarly for <title ...> or </title>
        pattern = rf"<{tag}[^>]*>"
        for match in re.finditer(pattern, head_content):
            tag_text = match.group(0)
            issues.append(
                f"<{tag}> tag found after first "
                f"{MAX_META_HEAD_SIZE // 1024}KB: {tag_text}"
            )

    return issues


def check_iframe_sources(soup: BeautifulSoup) -> list[str]:
    """
    Check that all iframe sources are responding with a successful status code.
    """
    problematic_iframes = []
    iframes = soup.find_all("iframe")

    for iframe in iframes:
        src = iframe.get("src")
        if not src:
            continue

        if src.startswith("//"):
            src = "https:" + src
        elif src.startswith("/") or src.startswith("."):
            continue  # Skip relative paths as they're checked by other fns

        title: str = iframe.get("title", "")
        alt: str = iframe.get("alt", "")
        description: str = f"{title=} ({alt=})"
        try:
            response = requests.head(src, timeout=10)
            if not response.ok:
                problematic_iframes.append(
                    f"Iframe source {src} returned status "
                    f"{response.status_code}. "
                    f"Description: {description}"
                )
        except requests.RequestException as e:
            problematic_iframes.append(
                f"Failed to load iframe source {src}: {str(e)}. "
                f"Description: {description}"
            )

    return problematic_iframes


def check_consecutive_periods(soup: BeautifulSoup) -> list[str]:
    """
    Check for consecutive periods in text content, including cases where
    they're separated by quotation marks.

    Returns:
        list of strings containing problematic text with consecutive periods
    """
    problematic_texts: list[str] = []

    for element in soup.find_all(string=True):
        if element.strip() and not should_skip(element):
            # Look for two periods with optional quote marks between
            if re.search(r'(?!\.\.\?)\.["“”]*\.', element.string):
                _append_to_list(
                    problematic_texts,
                    element.string,
                    prefix="Consecutive periods found: ",
                )

    return problematic_texts


def check_favicon_parent_elements(soup: BeautifulSoup) -> list[str]:
    """
    Check that all img.favicon elements are direct children of span elements.

    Returns:
        list of strings describing favicons that are not direct
         children of span elements.
    """
    problematic_favicons: list[str] = []

    for favicon in soup.select("img.favicon:not(.no-span)"):
        parent = favicon.parent
        if (
            not parent
            or parent.name != "span"
            or "favicon-span" not in (parent.get("class", []) or [])
        ):
            context = favicon.get("src", "unknown source")
            info = f"Favicon ({context}) is not a direct child of"
            info += " a span.favicon-span."
            if parent:
                info += " Instead, it's a child of "
                info += f"<{parent.name}>: {parent.get_text()}"
            problematic_favicons.append(info)

    return problematic_favicons


def check_preloaded_fonts(soup: BeautifulSoup) -> bool:
    """
    Check if the page preloads the EBGaramond font via subfont.

    Returns True if at least one preload link for EBGaramond subfont is found,
    False otherwise.
    """
    head = soup.find("head")
    if not isinstance(head, Tag):
        return False

    preload_links = head.find_all("link", {"rel": "preload", "as": "font"})
    for link in preload_links:
        href = link.get("href", "")
        if "subfont/ebgaramond" in href.lower():
            return True

    return False


def check_malformed_hrefs(soup: BeautifulSoup) -> list[str]:
    """
    Check for syntactically malformed href attributes in `<a>` tags using the
    `validators` library.
    """
    malformed_links: list[str] = []
    for link in soup.find_all("a", href=True):
        href = link.get("href")
        if href.startswith("mailto:"):
            email = href.split(":")[1]
            if not validators.email(email):
                _append_to_list(
                    malformed_links,
                    href,
                    prefix="Syntactically invalid email: ",
                )
            continue

        if (
            "external" not in link.get("class", [])
            or not href
            or href.startswith(("/", "#", ".", "tel:"))
        ):
            continue

        # Allow spaces in URLs for readability
        if not validators.url(href) and " " not in href:
            _append_to_list(
                malformed_links, href, prefix="Syntactically invalid href: "
            )

    return malformed_links


def check_file_for_issues(
    file_path: Path,
    base_dir: Path,
    md_path: Path | None,
    should_check_fonts: bool,
) -> _IssuesDict:
    """
    Check a single HTML file for various issues.

    Args:
        file_path: Path to the HTML file to check
        base_dir: Path to the base directory of the site
        md_path: Path to the markdown file that generated the HTML file
        should_check_fonts: Whether to check for preloaded fonts

    Returns:
        Dictionary of issues found in the HTML file
    """
    soup = script_utils.parse_html_file(file_path)
    if script_utils.is_redirect(soup):
        return {}

    issues: _IssuesDict = {
        "localhost_links": check_localhost_links(soup),
        "invalid_internal_links": check_invalid_internal_links(soup),
        "invalid_anchors": check_invalid_anchors(soup, base_dir),
        "malformed_hrefs": check_malformed_hrefs(soup),
        "problematic_paragraphs": paragraphs_contain_canary_phrases(soup),
        "missing_media_files": check_local_media_files(soup, base_dir),
        "trailing_blockquotes": check_blockquote_elements(soup),
        "missing_assets": check_asset_references(soup, file_path, base_dir),
        "problematic_katex": check_katex_elements_for_errors(soup),
        "unrendered_subtitles": check_unrendered_subtitles(soup),
        "unrendered_footnotes": check_unrendered_footnotes(soup),
        "missing_critical_css": not check_critical_css(soup),
        "empty_body": script_utils.body_is_empty(soup),
        "duplicate_ids": check_duplicate_ids(soup),
        "unrendered_spoilers": check_unrendered_spoilers(soup),
        "unrendered_emphasis": check_unrendered_emphasis(soup),
        "katex_outside_blockquote": katex_element_surrounded_by_blockquote(
            soup
        ),
        "unprocessed_quotes": check_unprocessed_quotes(soup),
        "unprocessed_dashes": check_unprocessed_dashes(soup),
        "unrendered_html": check_unrendered_html(soup),
        "emphasis_spacing": check_emphasis_spacing(soup),
        "link_spacing": check_link_spacing(soup),
        "long_description": check_description_length(soup),
        "late_header_tags": meta_tags_early(file_path),
        "problematic_iframes": check_iframe_sources(soup),
        "consecutive_periods": check_consecutive_periods(soup),
        "invalid_favicon_parents": check_favicon_parent_elements(soup),
        "invalid_media_asset_sources": check_media_asset_sources(soup),
        "video_source_order_and_match": check_video_source_order_and_match(
            soup
        ),
    }

    if should_check_fonts:
        issues["missing_preloaded_font"] = not check_preloaded_fonts(soup)

    # Only check markdown assets if md_path exists and is a file
    if md_path and md_path.is_file():
        issues["missing_markdown_assets"] = check_markdown_assets_in_html(
            soup, md_path
        )

    if file_path.name == "about.html":  # Not all pages need to be checked
        issues["missing_favicon"] = check_favicons_missing(soup)
    return issues


def check_rss_file_for_issues(
    git_root_path: Path, custom_xsd_path: Path | None = None
) -> None:
    """
    Check an RSS file for various issues.

    Uses xmllint via `brew install libxml2`.
    """
    rss_path = git_root_path / "public" / "rss.xml"
    subprocess.run(
        [
            "/usr/bin/xmllint",
            "--noout",
            "--schema",
            str(custom_xsd_path or RSS_XSD_PATH),
            str(rss_path),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def _print_issues(  # pragma: no cover
    file_path: Path,
    issues: _IssuesDict,
) -> None:
    """
    Print issues found in a file.
    """
    if any(lst for lst in issues.values()):
        print(f"Issues found in {file_path}:")
        for issue, lst in issues.items():
            if lst:
                if isinstance(lst, list):
                    print(f"  {issue}:")
                    for item in lst:
                        print(f"    - {item}")
                elif isinstance(lst, bool):
                    print(f"  {issue}: {lst}")

        print()  # Add a blank line between files with issues


def _strip_path(path_str: str) -> str:
    """
    Strip the git root path from a path string.
    """
    beginning_stripped = re.sub(
        r"^ *(\.{1,2}((?=\/asset_staging)"
        r"|\/(?!asset_staging)))?(/asset_staging/)?",
        "",
        path_str,
    )
    return re.sub(r" +$", "", beginning_stripped)


_TAGS_TO_CHECK_FOR_MISSING_ASSETS = ("img", "video", "svg", "audio", "source")


def get_md_asset_counts(md_path: Path) -> Counter[str]:
    """
    Get the counts of all assets referenced in the markdown file.
    """
    # skipcq: PTC-W6004, it's just serverside open -- not user-facing
    with open(md_path, encoding="utf-8") as f:
        content = f.read()

    trimmed_content = source_file_checks.remove_code_and_math(content)

    # Match ![alt](src) pattern, capturing the src
    md_pattern_assets = re.findall(r"!\[.*?\]\((.*?)\)", trimmed_content)

    # Match HTML tags with src attributes
    possible_tag_pattern = rf"{'|'.join(_TAGS_TO_CHECK_FOR_MISSING_ASSETS)}"
    tag_pattern = rf"<(?:{possible_tag_pattern}) [^>]*?src=[\"'](.*?)[\"']"
    tag_pattern_assets = re.findall(tag_pattern, trimmed_content)

    return Counter(
        _strip_path(asset) for asset in md_pattern_assets + tag_pattern_assets
    )


def check_markdown_assets_in_html(
    soup: BeautifulSoup, md_path: Path
) -> list[str]:
    """
    Check that all assets referenced in the markdown source appear in the HTML
    at least as many times as they appear in the markdown.

    Args:
        soup: BeautifulSoup object of the HTML content
        md_path: Path to the markdown file that generated the HTML file

    Returns:
        list of asset references that have fewer instances in HTML
    """
    if not md_path.exists():
        raise FileNotFoundError(f"Markdown file {md_path} does not exist")

    md_asset_counts = get_md_asset_counts(md_path)

    # Count asset sources in HTML
    html_asset_counts: Counter[str] = Counter()
    for tag in _TAGS_TO_CHECK_FOR_MISSING_ASSETS:
        for element in soup.find_all(tag):
            if src := element.get("src"):
                html_asset_counts[_strip_path(src)] += 1

    # Check each markdown asset exists in HTML with sufficient count
    missing_assets = []
    for asset, md_count in md_asset_counts.items():
        html_count = html_asset_counts[asset]
        if html_count < md_count:
            missing_assets.append(
                f"Asset {asset} appears {md_count} times in markdown "
                f"but only {html_count} times in HTML"
            )

    return missing_assets


def check_spacing(
    element: Tag,
    allowed_chars: str,
    prefix: Literal["before", "after"],
) -> list[str]:
    """
    Check spacing between element and a sibling.
    """
    sibling = (
        element.previous_sibling
        if prefix == "before"
        else element.next_sibling
    )
    if not isinstance(sibling, NavigableString) or not sibling.strip():
        return []

    # Properly escape characters for regex pattern
    ok_chars = "".join([re.escape(c) for c in allowed_chars])
    ok_regex_chars = rf"[{ok_chars}]"
    ok_regex_expr = (
        rf"^.*{ok_regex_chars}$"
        if prefix == "before"
        else rf"^{ok_regex_chars}.*$"
    )

    if not re.search(ok_regex_expr, sibling, flags=re.MULTILINE):
        preview = f"<{element.name}>{element.get_text()}</{element.name}>"
        if prefix == "before":
            preview = f"{sibling.get_text()}{preview}"
        else:
            preview = f"{preview}{sibling.get_text()}"

        return [f"Missing space {prefix}: {preview}"]
    return []


ALLOWED_ELT_PRECEDING_CHARS = "[({-—~×“=+‘ \n\t\r"
ALLOWED_ELT_FOLLOWING_CHARS = "])}.,;!?:-—~×+”…=’ \n\t\r"


def _check_element_spacing(
    element: Tag,
    prev_allowed_chars: str,
    next_allowed_chars: str,
) -> list[str]:
    """
    Helper function to check spacing around HTML elements.

    Args:
        element: The HTML element to check
        prev_allowed_chars: Characters allowed before the element without space
        next_allowed_chars: Characters allowed after the element without space

    Returns:
        list of strings describing spacing issues
    """
    return check_spacing(
        element, prev_allowed_chars, "before"
    ) + check_spacing(element, next_allowed_chars, "after")


def check_link_spacing(soup: BeautifulSoup) -> list[str]:
    """
    Check for non-footnote links that don't have proper spacing with
    surrounding text.

    Links should have a space before them unless preceded by specific
    characters.
    """
    problematic_links: list[str] = []

    # Find all links that aren't footnotes
    for link in soup.find_all("a"):
        # Skip footnote links
        if link.get("href", "").startswith("#user-content-fn"):
            continue

        problematic_links.extend(
            _check_element_spacing(
                link, ALLOWED_ELT_PRECEDING_CHARS, ALLOWED_ELT_FOLLOWING_CHARS
            )
        )

    return problematic_links


# Whitelisted emphasis patterns that should be ignored
# If both prev and next are in the whitelist, then the emphasis is whitelisted
WHITELISTED_EMPHASIS = {
    ("Some", ""),  # For e.g. "Some<i>one</i>"
}


def check_emphasis_spacing(soup: BeautifulSoup) -> list[str]:
    """
    Check for emphasis/strong elements that don't have proper spacing with
    surrounding text.

    Ignores specific whitelisted cases.
    """
    problematic_emphasis: list[str] = []

    # Find all emphasis elements
    for element in soup.find_all(["em", "strong", "i", "b", "del"]):
        # Check if this is a whitelisted case
        prev_sibling = element.previous_sibling
        next_sibling = element.next_sibling

        if isinstance(prev_sibling, NavigableString) and isinstance(
            next_sibling, NavigableString
        ):
            prev_text = prev_sibling.strip()
            current_text = element.get_text(strip=True)

            # Check for exact matches in whitelisted cases
            is_whitelisted = False
            for prev, next_ in WHITELISTED_EMPHASIS:
                if prev_text.endswith(prev) and current_text.startswith(next_):
                    is_whitelisted = True
                    break
            if is_whitelisted:
                continue

        problematic_emphasis.extend(
            _check_element_spacing(
                element,
                ALLOWED_ELT_PRECEDING_CHARS,
                ALLOWED_ELT_FOLLOWING_CHARS,
            )
        )

    return problematic_emphasis


# Facebook recommends descriptions under 155 characters
MAX_DESCRIPTION_LENGTH = 155
MIN_DESCRIPTION_LENGTH = 10


def check_description_length(soup: BeautifulSoup) -> list[str]:
    """
    Check if the page description is within the recommended length for social
    media previews.

    Returns a list with a single string if the description is too long, or an
    empty list otherwise.
    """
    description_element = soup.find("meta", attrs={"name": "description"})
    description = (
        description_element.get("content")
        if description_element and isinstance(description_element, Tag)
        else None
    )

    if description:
        if len(description) > MAX_DESCRIPTION_LENGTH:
            return [
                f"Description too long: {len(description)} characters "
                f"(recommended <= {MAX_DESCRIPTION_LENGTH})"
            ]
        if len(description) < MIN_DESCRIPTION_LENGTH:
            return [
                f"Description too short: {len(description)} characters "
                f"(recommended >= {MIN_DESCRIPTION_LENGTH})"
            ]
        return []
    return ["Description not found"]


def check_css_issues(file_path: Path) -> list[str]:
    """
    Check for CSS issues in a file.
    """
    if not file_path.exists():
        return [f"CSS file {file_path} does not exist"]
    with open(file_path, encoding="utf-8") as f:
        content = f.read()
        if not re.search(r"@supports", content):
            return [
                f"CSS file {file_path.name} does not contain @supports,"
                " which is required for dropcaps in Firefox"
            ]
    return []


def _validate_source_type(
    type_attr: str | list[str] | None,
    expected_type: str,
    source_index: int,
    video_preview: str,
) -> list[str]:
    """
    Validate the type attribute of a <source> tag.
    """
    issues: list[str] = []
    if (
        not isinstance(type_attr, str)
        or type_attr.lower() != expected_type.lower()
    ):
        issues.append(
            f"Video source {source_index} type != '{expected_type}':"
            f" {video_preview} (got '{type_attr}')"
        )
    return issues


IssuesAndMaybeSrc = NamedTuple(
    "IssuesAndMaybeSrc", [("issues", list[str]), ("valid_src", str | None)]
)


def _validate_source_src(
    src_attr: str | list[str] | None,
    expected_ext: str,
    source_index: int,
    video_preview: str,
) -> IssuesAndMaybeSrc:
    """
    Validate the src attribute of a <source> tag.
    """
    issues: list[str] = []
    if not isinstance(src_attr, str):
        _append_to_list(
            issues,
            f"Video source {source_index} 'src' missing or not a string:"
            f" {video_preview}",
        )
        return IssuesAndMaybeSrc(issues, None)

    # Parse URL to ignore query/fragment for extension check
    parsed_src = urlparse(src_attr)
    path_only = parsed_src.path
    _, ext = os.path.splitext(path_only)
    if ext.lower() != expected_ext.lower():
        issues.append(
            f"Video source {source_index} 'src'"
            f" does not end with {expected_ext}: "
            f"'{src_attr}' in {video_preview}"
        )
        validated_src = None
    else:
        validated_src = src_attr  # Store the original src if valid

    return IssuesAndMaybeSrc(issues, validated_src)


def _validate_single_source_tag(
    source_tag: Tag,
    expected_type: str,
    expected_ext: str,
    source_index: int,
    video_preview: str,
) -> IssuesAndMaybeSrc:
    """
    Validate a single <source> tag using helper functions.
    """
    type_issues = _validate_source_type(
        source_tag.get("type"), expected_type, source_index, video_preview
    )
    src_issues, valid_src = _validate_source_src(
        source_tag.get("src"), expected_ext, source_index, video_preview
    )

    all_issues = type_issues + src_issues
    src_to_return = valid_src if not all_issues else None
    return IssuesAndMaybeSrc(all_issues, src_to_return)


def _compare_base_paths(src1: str, src2: str, video_preview: str) -> list[str]:
    """
    Compare the base paths (including query strings) of two source URLs.
    """
    paths = {}
    for source_idx, src in enumerate([src1, src2]):
        parsed = urlparse(src)
        base_path, _ = os.path.splitext(parsed.path)
        paths[source_idx] = base_path + (
            f"?{parsed.query}" if parsed.query else ""
        )

    if paths[0] != paths[1]:
        return [
            f"Video source base paths mismatch: '{paths[0]}'"
            f" vs '{paths[1]}' in {video_preview}"
        ]
    return []


def _check_single_video(
    video: Tag, expected_sources: list[tuple[str, str]]
) -> list[str]:
    """
    Checks a single <video> tag for source order, type, and matching base
    paths.
    """
    issues: list[str] = []
    sources = [
        child
        for child in video.children
        if isinstance(child, Tag) and child.name == "source"
    ]
    open_tag = str(video).split(">", 1)[0] + ">"

    if len(sources) < len(expected_sources):
        _append_to_list(
            issues,
            f"<video> tag has < {len(expected_sources)}"
            f" <source> children: {open_tag}",
        )
        return issues  # Cannot proceed if sources are missing

    all_sources_valid = True
    valid_srcs: list[str | None] = []

    for source_idx, (expected_type, expected_ext) in enumerate(
        expected_sources
    ):
        source_issues, valid_src = _validate_single_source_tag(
            sources[source_idx],
            expected_type,
            expected_ext,
            source_idx + 1,
            open_tag,
        )
        issues.extend(source_issues)
        valid_srcs.append(valid_src)
        if not valid_src:
            all_sources_valid = False

    if all_sources_valid:
        comparison_issues = _compare_base_paths(
            valid_srcs[0] or "",
            valid_srcs[1] or "",
            open_tag,
        )
        issues.extend(comparison_issues)

    return issues


def _should_skip_video(video: Tag) -> bool:
    """
    Check if a <video> tag should be skipped.
    """
    return not isinstance(video, Tag) or video.get("id") == "pond-video"


def check_video_source_order_and_match(soup: BeautifulSoup) -> list[str]:
    """
    Check <video> elements have the MP4 <source> tag first, then the WEBM
    <source> tag, with matching base src.
    """
    all_issues: list[str] = []
    expected_sources: list[tuple[str, str]] = [
        ("video/mp4; codecs=hvc1", ".mp4"),
        ("video/webm", ".webm"),
    ]

    for video in soup.find_all("video"):
        if _should_skip_video(video):
            continue
        video_issues = _check_single_video(video, expected_sources)
        all_issues.extend(video_issues)

    return all_issues


def check_robots_txt_location(base_dir: Path) -> list[str]:
    """
    Check that robots.txt exists in the root directory and not in
    subdirectories.
    """
    issues = []
    root_robots = base_dir / "robots.txt"
    if not root_robots.is_file():
        issues.append("robots.txt not found in site root")

    return issues


def main() -> None:
    """
    Check all HTML files in the public directory for issues.
    """
    args = parser.parse_args()
    issues_found: bool = False

    # check_rss_file_for_issues(git_root)
    css_issues = check_css_issues(_PUBLIC_DIR / "index.css")
    if css_issues:
        _print_issues(_PUBLIC_DIR / "index.css", {"CSS_issues": css_issues})
        issues_found = True

    # Check robots.txt location
    robots_issues = check_robots_txt_location(_PUBLIC_DIR)
    if robots_issues:
        _print_issues(_PUBLIC_DIR, {"robots_txt_issues": robots_issues})
        issues_found = True

    md_dir: Path = _GIT_ROOT / "content"
    permalink_to_md_path_map = script_utils.build_html_to_md_map(md_dir)
    files_to_skip: Set[str] = script_utils.collect_aliases(md_dir)

    for root, _, files in os.walk(_PUBLIC_DIR):
        if "drafts" in root:
            continue
        for file in tqdm.tqdm(files, desc="Webpages checked"):
            if file.endswith(".html") and Path(file).stem not in files_to_skip:
                file_path = Path(root) / file

                # Only derive md_path for public_dir files
                md_path = None
                if root.endswith("public"):
                    md_path = permalink_to_md_path_map.get(
                        file_path.stem
                    ) or permalink_to_md_path_map.get(file_path.stem.lower())
                    if not md_path and script_utils.should_have_md(file_path):
                        raise FileNotFoundError(
                            f"Markdown file for {file_path.stem} not found"
                        )

                issues = check_file_for_issues(
                    file_path,
                    _PUBLIC_DIR,
                    md_path,
                    # pylint: disable=possibly-used-before-assignment
                    should_check_fonts=args.check_fonts,
                )

                if any(lst for lst in issues.values()):
                    _print_issues(file_path, issues)
                    issues_found = True

    if issues_found:
        sys.exit(1)


if __name__ == "__main__":
    main()
