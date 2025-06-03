import subprocess
import sys
from collections import Counter
from pathlib import Path
from typing import TYPE_CHECKING
from unittest.mock import patch

import pytest
import requests  # type: ignore[import]
from bs4 import BeautifulSoup

from .. import utils as script_utils

sys.path.append(str(Path(__file__).parent.parent))

if TYPE_CHECKING:
    from .. import built_site_checks
else:
    import built_site_checks


@pytest.fixture
def site_setup(tmp_path):
    """Set up a basic site directory structure."""
    public_dir = tmp_path / "public"
    content_dir = tmp_path / "content"
    public_dir.mkdir()
    content_dir.mkdir()

    return {
        "public_dir": public_dir,
        "content_dir": content_dir,
        "tmp_path": tmp_path,
    }


@pytest.fixture
def mock_environment(site_setup, monkeypatch):
    """Set up common mocks and environment variables."""
    public_dir = site_setup["public_dir"]
    tmp_path = site_setup["tmp_path"]

    # Mock functions and constants
    monkeypatch.setattr(built_site_checks, "_PUBLIC_DIR", public_dir)
    monkeypatch.setattr(built_site_checks, "_GIT_ROOT", tmp_path)
    monkeypatch.setattr(sys, "argv", ["built_site_checks.py"])

    # Mock common utility functions
    monkeypatch.setattr(script_utils, "collect_aliases", lambda md_dir: set())

    return site_setup


@pytest.fixture
def valid_css_file(mock_environment):
    """Create a valid CSS file."""
    public_dir = mock_environment["public_dir"]
    index_css = public_dir / "index.css"
    index_css.write_text(
        "@supports (initial-letter: 4) { p::first-letter { initial-letter: 4; } }"
    )
    return index_css


@pytest.fixture
def invalid_css_file(mock_environment):
    """Create an invalid CSS file (missing @supports)."""
    public_dir = mock_environment["public_dir"]
    index_css = public_dir / "index.css"
    index_css.write_text("p::first-letter { float: left; font-size: 4em; }")
    return index_css


@pytest.fixture
def robots_txt_file(mock_environment):
    """Create a robots.txt file."""
    public_dir = mock_environment["public_dir"]
    robots_txt = public_dir / "robots.txt"
    robots_txt.touch()
    return robots_txt


@pytest.fixture
def html_file(mock_environment):
    """Create a test HTML file."""
    public_dir = mock_environment["public_dir"]
    html_file = public_dir / "test.html"
    html_file.write_text("<html><body>Test content</body></html>")
    return html_file


@pytest.fixture
def md_file(mock_environment):
    """Create a markdown file corresponding to the test HTML file."""
    content_dir = mock_environment["content_dir"]
    md_file = content_dir / "test.md"
    md_file.touch()
    return md_file


@pytest.fixture
def disable_md_requirement(monkeypatch):
    monkeypatch.setattr(
        script_utils, "should_have_md", lambda file_path: False
    )


@pytest.mark.parametrize(
    "input_path,expected",
    [
        # Basic stripping of spaces and dots
        (" path/to/file ", "path/to/file"),
        ("path/to/file", "path/to/file"),
        ("./path/to/file", "path/to/file"),
        # Empty or whitespace-only strings
        ("", ""),
        (" ", ""),
        # Paths with valid dots
        ("path/to/file.txt", "path/to/file.txt"),
        ("path.to/file.txt", "path.to/file.txt"),
    ],
)
def test_strip_path(input_path: str, expected: str) -> None:
    """Test the _strip_path function with various input paths."""
    assert built_site_checks._strip_path(input_path) == expected


@pytest.fixture
def sample_html() -> str:
    return """
    <html>
    <body>
        <a href="http://localhost:8000">Localhost Link</a>
        <a href="https://turntrout.com">Turntrout Link</a>
        <a href="/other-page#invalid-anchor">Turntrout Link with Anchor</a>
        <a href="#valid-anchor">Valid Anchor</a>
        <a href="#invalid-anchor">Invalid Anchor</a>
        <div id="valid-anchor">Valid Anchor Content</div>
        <p>Normal paragraph</p>
        <p>Table: This is a table description</p>
        <p>This is a delayed-paragraph Table: </p>
        <p>Figure: This is a figure caption</p>
        <p>Code: This is a code snippet</p>
        <img src="existing-image.jpg" alt="Existing Image">
        <img src="missing-image.png" alt="Missing Image">
        <video src="existing-video.mp4"></video>
        <svg src="missing-svg.svg"></svg>
    </body>
    </html>
    """


@pytest.fixture
def sample_html_with_katex_errors() -> str:
    return """
    <html>
    <body>
        <span class="katex-error">\\rewavcxx</span>
    </body>
    </html>
    """


@pytest.fixture
def sample_soup(sample_html: str) -> BeautifulSoup:
    return BeautifulSoup(sample_html, "html.parser")


@pytest.fixture
def temp_site_root(tmp_path: Path) -> Path:
    return tmp_path


@pytest.fixture
def sample_html_with_assets() -> str:
    return """
    <html>
    <head>
        <link rel="stylesheet" href="/styles/main.css">
        <link rel="preload" href="./index.css" as="style" onload="this.rel='stylesheet'">
        <script src="/js/script.js"></script>
    </head>
    <body>
        <img src="../images/photo.jpg">
    </body>
    </html>
    """


@pytest.fixture
def sample_soup_with_assets(sample_html_with_assets: str) -> BeautifulSoup:
    return BeautifulSoup(sample_html_with_assets, "html.parser")


@pytest.mark.parametrize(
    "preview_chars",
    [0, -1],
)
def test_add_to_list_exceptions(preview_chars: int) -> None:
    """Test that _add_to_list raises ValueError for non-positive preview_chars."""
    lst: list[str] = []
    with pytest.raises(
        ValueError, match="preview_chars must be greater than 0"
    ):
        built_site_checks._append_to_list(
            lst, "test", preview_chars=preview_chars
        )


@pytest.mark.parametrize(
    "input_text, prefix, expected_output",
    [
        ("short text", "", ["short text"]),
        ("short text", "Prefix: ", ["Prefix: short text"]),
        ("", "", []),
        ("", "Prefix: ", []),
    ],
)
def test_add_to_list_no_truncation(
    input_text: str, prefix: str, expected_output: list[str]
) -> None:
    """Test _add_to_list when text length <= preview_chars."""
    lst: list[str] = []
    built_site_checks._append_to_list(
        lst, input_text, preview_chars=20, prefix=prefix
    )
    assert lst == expected_output


LONG_TEXT = "This is a very long text that needs to be truncated."
PREVIEW_CHARS = 10


@pytest.mark.parametrize(
    "prefix, expected_output",
    [
        ("", ["This is a "]),
        ("Prefix: ", ["Prefix: This is a "]),
    ],
)
def test_add_to_list_truncate_start(
    prefix: str, expected_output: list[str]
) -> None:
    """Test _add_to_list truncation with show_end=False."""
    lst: list[str] = []
    built_site_checks._append_to_list(
        lst,
        LONG_TEXT,
        preview_chars=PREVIEW_CHARS,
        show_end=False,
        prefix=prefix,
    )
    assert lst == expected_output


@pytest.mark.parametrize(
    "prefix, expected_output",
    [
        ("", ["truncated...."]),
        ("Prefix: ", ["Prefix: truncated...."]),
    ],
)
def test_append_to_list_truncate_end(
    prefix: str, expected_output: list[str]
) -> None:
    """Test _append_to_list truncation with show_end=True."""
    lst: list[str] = []
    built_site_checks._append_to_list(
        lst,
        LONG_TEXT,
        preview_chars=PREVIEW_CHARS,
        show_end=True,
        prefix=prefix,
    )
    assert lst == expected_output


def test_check_localhost_links(sample_soup):
    result = built_site_checks.check_localhost_links(sample_soup)
    assert result == ["http://localhost:8000"]


def test_check_invalid_anchors(sample_soup, temp_site_root):
    result = built_site_checks.check_invalid_anchors(
        sample_soup, temp_site_root
    )
    assert set(result) == {
        "Invalid anchor: #invalid-anchor",
        "Invalid anchor: /other-page#invalid-anchor",
    }


@pytest.mark.parametrize(
    "index_html_content, target_html_content, other_files_content, expected_invalid_anchors",
    [
        # Case 1: Valid anchor in target.html
        (
            '<a href="/target.html#valid-anchor">Link</a>',
            '<div id="valid-anchor"></div>',
            {},
            [],
        ),
        # Case 2: Invalid anchor in target.html (anchor missing)
        (
            '<a href="/target.html#missing-anchor">Link</a>',
            '<div id="valid-anchor"></div>',
            {},
            ["Invalid anchor: /target.html#missing-anchor"],
        ),
        # Case 3: Link to a non-existent page
        (
            '<a href="/missing.html#anchor">Link</a>',
            '<div id="valid-anchor"></div>',  # target.html exists but isn't linked
            {},
            ["Invalid anchor: /missing.html#anchor"],
        ),
        # Case 4: Relative path link (./) to valid anchor
        (
            '<a href="./target.html#valid-anchor">Link</a>',
            '<div id="valid-anchor"></div>',
            {},
            [],
        ),
        # Case 5: Relative path link (./) to invalid anchor
        (
            '<a href="./target.html#missing-anchor">Link</a>',
            '<div id="valid-anchor"></div>',
            {},
            ["Invalid anchor: ./target.html#missing-anchor"],
        ),
        # Case 6: Link without .html suffix to existing page with valid anchor
        (
            '<a href="/target#valid-anchor">Link</a>',
            '<div id="valid-anchor"></div>',
            {},
            [],
        ),
        # Case 7: Link without .html suffix to existing page with invalid anchor
        (
            '<a href="/target#missing-anchor">Link</a>',
            '<div id="valid-anchor"></div>',
            {},
            ["Invalid anchor: /target#missing-anchor"],
        ),
        # Case 8: Link without .html suffix to non-existent page
        (
            '<a href="/missing#anchor">Link</a>',
            '<div id="valid-anchor"></div>',  # target.html exists but isn't linked
            {},
            ["Invalid anchor: /missing#anchor"],
        ),
        # Case 9: Multiple links, some valid, some invalid
        (
            """
            <a href="/target.html#valid-anchor">Valid 1</a>
            <a href="/target.html#missing-anchor">Invalid 1</a>
            <a href="/other.html#valid-other-anchor">Valid 2</a>
            <a href="/other.html#missing-other-anchor">Invalid 2</a>
            <a href="/missing.html#anchor">Invalid 3 (Page Missing)</a>
            <a href="./target.html#valid-anchor">Valid Relative</a>
            <a href="/target#valid-anchor">Valid No Suffix</a>
            <a href="/other#missing-other-anchor">Invalid No Suffix</a>
            """,
            '<div id="valid-anchor"></div>',
            {"other.html": '<div id="valid-other-anchor"></div>'},
            [
                "Invalid anchor: /target.html#missing-anchor",
                "Invalid anchor: /other.html#missing-other-anchor",
                "Invalid anchor: /missing.html#anchor",
                "Invalid anchor: /other#missing-other-anchor",
            ],
        ),
    ],
)
def test_check_invalid_anchors_external_page(
    temp_site_root: Path,
    index_html_content: str,
    target_html_content: str,
    other_files_content: dict[str, str],
    expected_invalid_anchors: list[str],
):
    """
    Test check_invalid_anchors for links pointing to anchors on other pages
    within the site.
    """
    # Create index.html
    index_path = temp_site_root / "index.html"
    index_path.write_text(f"<html><body>{index_html_content}</body></html>")

    # Create target.html
    target_path = temp_site_root / "target.html"
    target_path.write_text(f"<html><body>{target_html_content}</body></html>")

    # Create other specified HTML files
    for filename, content in other_files_content.items():
        other_path = temp_site_root / filename
        other_path.write_text(f"<html><body>{content}</body></html>")

    # Parse index.html
    soup = BeautifulSoup(index_path.read_text(), "html.parser")

    # Run the check
    result = built_site_checks.check_invalid_anchors(soup, temp_site_root)

    # Assert the results
    assert sorted(result) == sorted(expected_invalid_anchors)


def test_check_problematic_paragraphs(sample_soup):
    result = built_site_checks.paragraphs_contain_canary_phrases(sample_soup)
    assert len(result) == 3
    assert (
        "Problematic paragraph: Table: This is a table description" in result
    )
    assert "Problematic paragraph: Figure: This is a figure caption" in result
    assert "Problematic paragraph: Code: This is a code snippet" in result
    assert "Problematic paragraph: Normal paragraph" not in result
    assert (
        "Problematic paragraph: This is a delayed-paragraph Table: "
        not in result
    )


def test_check_problematic_paragraphs_with_direct_text():
    html = """
    <html>
    <body>
        <article>
            Figure: Text
            <p>Normal paragraph</p>
            <blockquote>Figure: Blockquote</blockquote>
        </article>
    </body>
    </html>
    """
    soup = BeautifulSoup(html, "html.parser")
    result = built_site_checks.paragraphs_contain_canary_phrases(soup)
    assert "Problematic paragraph: Figure: Text" in result
    assert "Problematic paragraph: Figure: Blockquote" in result
    assert "Problematic paragraph: Normal paragraph" not in result


def test_check_katex_elements_for_errors(sample_html_with_katex_errors):
    html = BeautifulSoup(sample_html_with_katex_errors, "html.parser")
    result = built_site_checks.check_katex_elements_for_errors(html)
    assert result == ["KaTeX error: \\rewavcxx"]


@pytest.mark.parametrize(
    "input_path,expected_path",
    [
        # Test absolute path
        ("/images/test.jpg", "images/test.jpg"),
        # Test relative path with ./
        ("./images/test.jpg", "images/test.jpg"),
        # Test path without leading ./ or /
        ("images/test.jpg", "images/test.jpg"),
        # Test nested paths
        ("/deep/nested/path/image.png", "deep/nested/path/image.png"),
        # Test current directory
        ("./file.jpg", "file.jpg"),
        # Test file in root
        ("/file.jpg", "file.jpg"),
    ],
)
def test_resolve_media_path(input_path, expected_path, temp_site_root):
    """Test the resolve_media_path helper function."""
    result = built_site_checks.resolve_media_path(input_path, temp_site_root)
    assert result == (temp_site_root / expected_path).resolve()


def test_check_local_media_files(sample_soup, temp_site_root):
    # Create an existing image file
    (temp_site_root / "existing-image.jpg").touch()
    (temp_site_root / "existing-video.mp4").touch()

    result = built_site_checks.check_local_media_files(
        sample_soup, temp_site_root
    )
    assert set(result) == {
        "missing-image.png (resolved to "
        + str((temp_site_root / "missing-image.png").resolve())
        + ")",
        "missing-svg.svg (resolved to "
        + str((temp_site_root / "missing-svg.svg").resolve())
        + ")",
    }


@pytest.mark.parametrize(
    "html,expected,existing_files",
    [
        ('<img src="local.jpg">', ["local.jpg (resolved to {})"], []),
        ('<img src="https://example.com/image.png">', [], []),
        (
            '<video src="video.mp4"></video>',
            ["video.mp4 (resolved to {})"],
            [],
        ),
        ('<svg src="icon.svg"></svg>', ["icon.svg (resolved to {})"], []),
        ('<img src="existing.png">', [], ["existing.png"]),
    ],
)
def test_check_local_media_files_parametrized(
    html, expected, existing_files, temp_site_root
):
    # Create any existing files
    for file in existing_files:
        (temp_site_root / file).touch()

    soup = BeautifulSoup(html, "html.parser")
    result = built_site_checks.check_local_media_files(soup, temp_site_root)

    # Format the expected paths with the actual resolved paths
    expected = [
        exp.format(
            str((temp_site_root / exp.split(" (resolved to ")[0]).resolve())
        )
        for exp in expected
    ]

    assert result == expected


def test_check_file_for_issues(tmp_path):
    """Test check_file_for_issues function."""
    file_path = tmp_path / "test.html"
    file_path.write_text(
        """
    <html>
    <body>
        <a href="https://localhost:8000">Localhost Link</a>
        <a href="#invalid-anchor">Invalid Anchor</a>
        <p>Table: Test table</p>
        <img src="missing-image.jpg" alt="Missing Image">
        <img src="https://example.com/image.png" alt="External Image">
        <blockquote>This is a blockquote</blockquote>
        <blockquote>This is a problematic blockquote ></blockquote>
        <blockquote>This ending tag is fine<BOS></blockquote>
        <p>Subtitle: Unrendered subtitle</p>
        <p class="subtitle">Rendered subtitle</p>
    </body>
    </html>
    """
    )
    issues = built_site_checks.check_file_for_issues(
        file_path, tmp_path, tmp_path / "content", should_check_fonts=False
    )
    assert issues["localhost_links"] == ["https://localhost:8000"]
    assert issues["invalid_anchors"] == ["Invalid anchor: #invalid-anchor"]
    assert issues["problematic_paragraphs"] == [
        "Problematic paragraph: Table: Test table"
    ]
    expected_missing = [
        f"missing-image.jpg (resolved to {(tmp_path / 'missing-image.jpg').resolve()})"
    ]
    assert issues["missing_media_files"] == expected_missing


complicated_blockquote = """
<blockquote class="callout quote" data-callout="quote">
<div class="callout-title"><div class="callout-icon"></div><div class="callout-title-inner"> <a href="https://www.lesswrong.com/posts/2JJtxitp6nqu6ffak/basic-facts-about-language-models-during-training-1#Residual_stream_outliers_grow_rapidly_then_stabilize_and_decline" class="external alias" target="_blank">Basic facts about language models during trai<span style="white-space:nowrap;">ning<img src="https://assets.turntrout.com/static/images/external-favicons/lesswrong_com.avif" class="favicon" alt=""></span></a> &gt; <img src="https://assets.turntrout.com/static/images/posts/m1uteifqbbyox6qp9xnx.avif" alt="" loading="lazy"></div></div>
</blockquote>
"""


def test_complicated_blockquote(tmp_path):
    file_path = tmp_path / "test.html"
    file_path.write_text(complicated_blockquote)
    issues = built_site_checks.check_file_for_issues(
        file_path, tmp_path, tmp_path / "content", should_check_fonts=False
    )
    assert issues["trailing_blockquotes"] == [
        "Problematic blockquote: Basic facts about language models during trai ning >"
    ]


def test_check_file_for_issues_with_redirect(tmp_path):
    file_path = tmp_path / "test.html"
    file_path.write_text(
        '<html><head><meta http-equiv="refresh" content="0;url=/new-page"></head></html>'
    )
    issues = built_site_checks.check_file_for_issues(
        file_path, tmp_path, tmp_path / "content", should_check_fonts=False
    )
    assert issues == {}


@pytest.mark.parametrize(
    "html,expected",
    [
        # Test favicon inside article and p tag (valid)
        (
            '<html><body><article><p><img class="favicon" src="favicon.ico"></p></article></body></html>',
            False,
        ),
        # Test favicon missing article tag (invalid)
        (
            '<html><body><p><img class="favicon" src="favicon.ico"></p></body></html>',
            True,
        ),
        # Test favicon missing p tag (invalid)
        (
            '<html><body><article><img class="favicon" src="favicon.ico"></article></body></html>',
            True,
        ),
        # Test no favicon at all (invalid)
        (
            '<html><head><link rel="stylesheet" href="style.css"></head><body></body></html>',
            True,
        ),
        # Test empty page (invalid)
        (
            "<html><head></head><body></body></html>",
            True,
        ),
    ],
)
def test_check_favicons_missing(html, expected):
    soup = BeautifulSoup(html, "html.parser")
    result = built_site_checks.check_favicons_missing(soup)
    assert result == expected


def test_check_unrendered_subtitles():
    html = """
    <html>
    <body>
        <p>Normal paragraph</p>
        <p>Subtitle: This should be a subtitle</p>
        <p class="subtitle">This is a properly rendered subtitle</p>
        <p>Subtitle: Another unrendered subtitle</p>
    </body>
    </html>
    """
    soup = BeautifulSoup(html, "html.parser")
    result = built_site_checks.check_unrendered_subtitles(soup)
    assert result == [
        "Unrendered subtitle: Subtitle: This should be a subtitle",
        "Unrendered subtitle: Subtitle: Another unrendered subtitle",
    ]


def test_check_valid_rss_file_with_xmllint(temp_site_root):
    """Test that check_rss_file_for_issues validates a correctly formatted RSS file"""
    script_utils.get_git_root()
    rss_path = temp_site_root / "public" / "rss.xml"
    rss_path.parent.mkdir(parents=True, exist_ok=True)

    valid_rss_content = """<?xml version="1.0" encoding="UTF-8" ?>
    <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
      <channel>
        <title>Example RSS Feed</title>
        <link>http://www.example.com</link>
        <description>This is an example RSS feed</description>
        <item>
          <title>First Item</title>
          <link>http://www.example.com/first-item</link>
          <description>This is the first item.</description>
        </item>
      </channel>
    </rss>
    """

    rss_path.write_text(valid_rss_content)
    try:
        built_site_checks.check_rss_file_for_issues(
            temp_site_root, built_site_checks.RSS_XSD_PATH
        )
    except subprocess.CalledProcessError:
        pytest.fail("check_rss_file_for_issues failed with valid RSS content")


def test_check_invalid_rss_file_with_xmllint(temp_site_root):
    """Test that check_rss_file_for_issues fails on an invalid RSS file"""
    script_utils.get_git_root()
    rss_path = temp_site_root / "public" / "rss.xml"
    rss_path.parent.mkdir(parents=True, exist_ok=True)

    invalid_rss_content = """<?xml version="1.0" encoding="UTF-8" ?>
    <rss version="2.0">
      <channel>
        <title>Invalid RSS Feed</title>
        <!-- Missing <link> and <description> -->
        <item>
          <title>First Item</title>
          <link>http://www.example.com/first-item</link>
          <description>This is the first item.</description>
        </item>
      </channel>
    </rss>
    """

    rss_path.write_text(invalid_rss_content)
    with pytest.raises(subprocess.CalledProcessError):
        built_site_checks.check_rss_file_for_issues(
            temp_site_root, built_site_checks.RSS_XSD_PATH
        )


def test_check_unrendered_footnotes():
    html = """
    <html>
    <body>
        <p>Normal paragraph</p>
        <p>Text with [^1] unrendered footnote</p>
        <p>Another [^note] footnote reference</p>
        <p>Not a [^] footnote</p>
        <p>Regular [text] in brackets</p>
    </body>
    </html>
    """
    soup = BeautifulSoup(html, "html.parser")
    result = built_site_checks.check_unrendered_footnotes(soup)
    assert result == ["[^1]", "[^note]"]


@pytest.mark.parametrize(
    "html,expected",
    [
        ("<p>Text with [^1] footnote</p>", ["[^1]"]),
        ("<p>Multiple [^1] [^2] footnotes</p>", ["[^1]", "[^2]"]),
        ("<p>No footnotes here</p>", []),
        ("<p>Not a [^] footnote</p>", []),
        ("<p>Regular [text] in brackets</p>", []),
    ],
)
def test_check_unrendered_footnotes_parametrized(html, expected):
    soup = BeautifulSoup(html, "html.parser")
    result = built_site_checks.check_unrendered_footnotes(soup)
    assert result == expected


@pytest.mark.parametrize(
    "html,expected",
    [
        # Test basic duplicate ID
        (
            """
            <div id="test"></div>
            <div id="test"></div>
            """,
            ["test (found 2 times)"],
        ),
        # Test ID with numbered variant
        (
            """
            <div id="test"></div>
            <div id="test-1"></div>
            """,
            ["test (found 2 times, including numbered variants)"],
        ),
        # Test multiple numbered variants
        (
            """
            <div id="test"></div>
            <div id="test-1"></div>
            <div id="test-2"></div>
            """,
            ["test (found 3 times, including numbered variants)"],
        ),
        # Test multiple issues
        (
            """
            <div id="test"></div>
            <div id="test"></div>
            <div id="other"></div>
            <div id="other-1"></div>
            """,
            [
                "test (found 2 times)",
                "other (found 2 times, including numbered variants)",
            ],
        ),
        # Test flowchart exclusion
        (
            """
            <div class="flowchart">
                <div id="test"></div>
                <div id="test"></div>
            </div>
            <div id="test"></div>
            """,
            [],  # IDs in flowcharts should be ignored
        ),
        # Test no duplicates
        (
            """
            <div id="test1"></div>
            <div id="test2"></div>
            """,
            [],
        ),
    ],
)
def test_check_duplicate_ids(html, expected):
    soup = BeautifulSoup(html, "html.parser")
    result = built_site_checks.check_duplicate_ids(soup)
    assert sorted(result) == sorted(expected)


@pytest.mark.parametrize(
    "html,expected",
    [
        # Test footnote references (should be allowed to have duplicates)
        (
            """
            <p><a id="user-content-fnref-crux"></a>First reference</p>
            <p><a id="user-content-fnref-crux"></a>Second reference</p>
            <p><a id="user-content-fn-1"></a>The footnote</p>
            """,
            [],  # No issues reported for duplicate fnref IDs
        ),
        # Test mixed footnote and regular IDs
        (
            """
            <p><a id="user-content-fnref-1"></a>First reference</p>
            <p><a id="user-content-fnref-1"></a>Second reference</p>
            <p id="test">Test</p>
            <p id="test">Duplicate test</p>
            """,
            ["test (found 2 times)"],  # Only regular duplicate ID is reported
        ),
        # Test footnote content IDs (should flag duplicates)
        (
            """
            <p><a id="user-content-fn-1"></a>First footnote</p>
            <p><a id="user-content-fn-1"></a>Duplicate footnote</p>
            """,
            [
                "user-content-fn-1 (found 2 times)"
            ],  # Duplicate footnote content IDs should be reported
        ),
    ],
)
def test_check_duplicate_ids_with_footnotes(html, expected):
    soup = BeautifulSoup(html, "html.parser")
    result = built_site_checks.check_duplicate_ids(soup)
    assert sorted(result) == sorted(expected)


@pytest.mark.parametrize(
    "html,expected",
    [
        # Test basic paragraph cases
        (
            """
            <p>Normal paragraph</p>
            <p>Table: Test table</p>
            """,
            ["Problematic paragraph: Table: Test table"],
        ),
        # Test definition term cases
        (
            """
            <dt>Normal term</dt>
            <dt>: Invalid term</dt>
            """,
            ["Problematic paragraph: : Invalid term"],
        ),
        # Test mixed cases
        (
            """
            <p>Table: Test table</p>
            <dt>: Invalid term</dt>
            <p>Normal paragraph</p>
            <dt>Normal term</dt>
            """,
            [
                "Problematic paragraph: Table: Test table",
                "Problematic paragraph: : Invalid term",
            ],
        ),
        # Test empty elements
        (
            """
            <p></p>
            <dt></dt>
            """,
            [],
        ),
    ],
)
def test_check_problematic_paragraphs_with_dt(html, expected):
    """Check that unrendered description list entries are flagged."""
    soup = BeautifulSoup(html, "html.parser")
    result = built_site_checks.paragraphs_contain_canary_phrases(soup)
    assert sorted(result) == sorted(expected)


def test_check_unrendered_spoilers():
    html = """
    <html>
    <body>
        <blockquote>
            <p>! This is an unrendered spoiler.</p>
            <p>This is normal text.</p>
        </blockquote>
        <blockquote>
            <p>This is a regular blockquote.</p>
        </blockquote>
        <p>! Outside of blockquote should not be detected.</p>
    </body>
    </html>
    """
    soup = BeautifulSoup(html, "html.parser")
    result = built_site_checks.check_unrendered_spoilers(soup)
    assert result == ["Unrendered spoiler: ! This is an unrendered spoiler."]


@pytest.mark.parametrize(
    "html,expected",
    [
        # Test unrendered spoiler inside blockquote
        (
            """
            <blockquote>
                <p>! Spoiler text here.</p>
            </blockquote>
            """,
            ["Unrendered spoiler: ! Spoiler text here."],
        ),
        # Test multiple unrendered spoilers
        (
            """
            <blockquote>
                <p>! First spoiler.</p>
                <p>! Second spoiler.</p>
            </blockquote>
            """,
            [
                "Unrendered spoiler: ! First spoiler.",
                "Unrendered spoiler: ! Second spoiler.",
            ],
        ),
        # Test no unrendered spoilers
        (
            """
            <blockquote>
                <p>This is a regular paragraph.</p>
            </blockquote>
            """,
            [],
        ),
        # Test unrendered spoiler not in blockquote (should not be detected)
        (
            """
            <p>! This should not be detected.</p>
            """,
            [],
        ),
        # Test text node directly inside blockquote
        (
            """
            <blockquote>
                ! This is a text node, not inside a <p> tag.
                <p>This should not be detected.</p>
            </blockquote>
            """,
            [],
        ),
    ],
)
def test_check_unrendered_spoilers_parametrized(html, expected):
    soup = BeautifulSoup(html, "html.parser")
    result = built_site_checks.check_unrendered_spoilers(soup)
    assert result == expected


@pytest.mark.parametrize(
    "html,expected",
    [
        # Test unrendered heading
        (
            """
            <p># Unrendered heading</p>
            <p>## Another unrendered heading</p>
            <p>Normal paragraph</p>
            """,
            [
                "Problematic paragraph: # Unrendered heading",
                "Problematic paragraph: ## Another unrendered heading",
            ],
        ),
        # Test mixed problematic cases
        (
            """
            <p># Heading</p>
            <p>Table: Description</p>
            <p>Normal text</p>
            """,
            [
                "Problematic paragraph: # Heading",
                "Problematic paragraph: Table: Description",
            ],
        ),
        # Test heading-like content mid-paragraph (should not be detected)
        (
            """
            <p>This is not a # heading</p>
            <p>Also not a ## heading</p>
            """,
            [],
        ),
    ],
)
def test_check_problematic_paragraphs_with_headings(html, expected):
    """Check that unrendered headings (paragraphs starting with #) are flagged."""
    soup = BeautifulSoup(html, "html.parser")
    result = built_site_checks.paragraphs_contain_canary_phrases(soup)
    assert sorted(result) == sorted(expected)


@pytest.mark.parametrize(
    "html,expected",
    [
        # Test bad_anywhere patterns
        (
            """
            <p>> [!warning] Alert text</p>
            """,
            [
                "Problematic paragraph: > [!warning] Alert text",
            ],
        ),
        # Test direct text in article and blockquote
        (
            """
            <article>
                Table: Direct text in article
                <p>Normal paragraph</p>
            </article>
            <blockquote>
                Figure: Direct text in blockquote
                <p>Normal paragraph</p>
                <p>Caption: here's a stray figcaption.</p>
            </blockquote>
            """,
            [
                "Problematic paragraph: Table: Direct text in article",
                "Problematic paragraph: Figure: Direct text in blockquote",
                "Problematic paragraph: Caption: here's a stray figcaption.",
            ],
        ),
        # Test code tag exclusions
        (
            """
            <p>Normal text <code>Table: This should be ignored</code></p>
            <p><code>Figure: Also ignored</code> but Table: this isn't</p>
            """,
            ["Problematic paragraph: but Table: this isn't"],
        ),
        # Test nested structures
        (
            """
            <article>
                <blockquote>
                    Table: Nested text
                    <p>Normal paragraph</p>
                    <p>Table: In paragraph</p>
                </blockquote>
                Figure: More direct text
            </article>
            """,
            [
                "Problematic paragraph: Table: Nested text",
                "Problematic paragraph: Table: In paragraph",
                "Problematic paragraph: Figure: More direct text",
            ],
        ),
        # Test bad paragraph starting prefixes
        (
            """
            <p>: Invalid prefix</p>
            <p># Unrendered heading</p>
            <p>## Another heading</p>
            <p>Normal: text</p>
            """,
            [
                "Problematic paragraph: : Invalid prefix",
                "Problematic paragraph: # Unrendered heading",
                "Problematic paragraph: ## Another heading",
            ],
        ),
        # Test mixed content with code blocks
        (
            """
            <p>
                <code>Table: Ignored</code>
                Table: Not ignored
                <code>Figure: Also ignored</code>
            </p>
            """,
            ["Problematic paragraph: Table: Not ignored"],
        ),
        # Test text nodes in different contexts
        (
            """
            <p>Text before <em>Table: problematic</em></p>
            <p>Text before <em>Figure: also problematic</em></p>
            <p>Text before <em>Code: still problematic</em></p>
            """,
            [
                "Problematic paragraph: Table: problematic",
                "Problematic paragraph: Figure: also problematic",
                "Problematic paragraph: Code: still problematic",
            ],
        ),
        # Test edge cases with special characters
        (
            """
            <p>> [!note] With spaces</p>
            """,
            [
                "Problematic paragraph: > [!note] With spaces",
            ],
        ),
    ],
)
def test_check_problematic_paragraphs_comprehensive(html, expected):
    """Comprehensive test suite for check_problematic_paragraphs function."""
    soup = BeautifulSoup(html, "html.parser")
    result = built_site_checks.paragraphs_contain_canary_phrases(soup)
    assert sorted(result) == sorted(expected)


@pytest.mark.parametrize(
    "html,expected",
    [
        # Basic emphasis cases
        (
            "<p>Text with *asterisk*</p>",
            ["Unrendered emphasis: Text with *asterisk*"],
        ),
        (
            "<p>Text with _underscore_</p>",
            ["Unrendered emphasis: Text with _underscore_"],
        ),
        # Percentage cases (should be ignored)
        ("<p>Text with ___ % coverage</p>", []),
        # Mixed cases
        (
            "<p>Mixed *emphasis* with _100% value_</p>",
            ["Unrendered emphasis: Mixed *emphasis* with _100% value_"],
        ),
        # Code and KaTeX exclusions
        (
            "<p>Text with <code>*ignored*</code> and *emphasis*</p>",
            ["Unrendered emphasis: Text with  and *emphasis*"],
        ),
        (
            "<p>Math <span class='katex'>*x*</span> and *emphasis*</p>",
            ["Unrendered emphasis: Math  and *emphasis*"],
        ),
        # Multiple elements
        (
            """
            <div>
                <p>First *paragraph*</p>
                <h1>Heading with _emphasis_</h1>
                <figcaption>Caption with *stars*</figcaption>
            </div>
        """,
            [
                "Unrendered emphasis: First *paragraph*",
                "Unrendered emphasis: Heading with _emphasis_",
                "Unrendered emphasis: Caption with *stars*",
            ],
        ),
        # Edge cases
        (
            "<p>Text_with_multiple_underscores</p>",
            ["Unrendered emphasis: Text_with_multiple_underscores"],
        ),
        (
            "<p>Text*with*multiple*asterisks</p>",
            ["Unrendered emphasis: Text*with*multiple*asterisks"],
        ),
        (
            "<p>Unicode: 你好 *emphasis* 再见</p>",
            ["Unrendered emphasis: Unicode: 你好 *emphasis* 再见"],
        ),
        (
            "<p>HTML &amp; *emphasis*</p>",
            ["Unrendered emphasis: HTML & *emphasis*"],
        ),
        (
            '<article><p>Test test</p><ul><li>These results don’t _prove_that <abbr class="small-caps">power</abbr>-seeking is bad for other agents in the environment.</li></ul></article>',
            [
                "Unrendered emphasis: These results don’t _prove_that power-seeking is bad for other agents in the environment."
            ],
        ),
    ],
)
def test_check_unrendered_emphasis(html, expected):
    """Test the check_unrendered_emphasis function."""
    soup = BeautifulSoup(html, "html.parser")
    result = built_site_checks.check_unrendered_emphasis(soup)
    print(result)
    assert sorted(result) == sorted(expected)


@pytest.mark.parametrize(
    "html,expected",
    [
        # Test KaTeX display starting with >> outside blockquote
        (
            """
            <span class="katex-display">>> Some definition</span>
            """,
            ["KaTeX error: >> Some definition"],
        ),
        # Test KaTeX display without >>
        (
            """
            <span class="katex-display">x + y = z</span>
            """,
            [],
        ),
        # Test multiple KaTeX displays
        (
            """
            <span class="katex-display">>> First definition</span>
            <span class="katex-display">Normal equation</span>
            <span class="katex-display">> Second definition</span>
            """,
            [
                "KaTeX error: >> First definition",
                "KaTeX error: > Second definition",
            ],
        ),
    ],
)
def test_katex_element_surrounded_by_blockquote(html, expected):
    soup = BeautifulSoup(html, "html.parser")
    result = built_site_checks.katex_element_surrounded_by_blockquote(soup)
    assert result == expected


@pytest.mark.parametrize(
    "html,expected",
    [
        # Basic straight quotes that should be caught
        (
            '<p>Text with "quotes"</p>',
            ["Unprocessed quotes ['\"', '\"']: Text with \"quotes\""],
        ),
        (
            "<p>Text with 'quotes'</p>",
            ["Unprocessed quotes [\"'\", \"'\"]: Text with 'quotes'"],
        ),
        # Quotes in skipped elements should be ignored
        ('<code>Text with "quotes"</code>', []),
        ('<pre>Text with "quotes"</pre>', []),
        ('<div class="no-formatting">Text with "quotes"</div>', []),
        ('<div class="elvish">Text with "quotes"</div>', []),
        # Nested skipped elements
        ('<div><code>Text with "quotes"</code></div>', []),
        ('<div class="no-formatting"><p>Text with "quotes"</p></div>', []),
        # Mixed content
        (
            """
            <div>
                <p>Normal "quote"</p>
                <code>Ignored "quote"</code>
                <p>Another 'quote'</p>
            </div>
        """,
            [
                "Unprocessed quotes [\"'\", \"'\"]: Another 'quote'",
                "Unprocessed quotes ['\"', '\"']: Normal \"quote\"",
            ],
        ),
    ],
)
def test_check_unprocessed_quotes(html, expected):
    soup = BeautifulSoup(html, "html.parser")
    result = built_site_checks.check_unprocessed_quotes(soup)
    assert sorted(result) == sorted(expected)


@pytest.mark.parametrize(
    "html,expected",
    [
        # Basic dash cases that should be caught
        (
            "<p>Text with -- dash</p>",
            ["Unprocessed dashes: Text with -- dash"],
        ),
        (
            "<p>Text with --- dash</p>",
            ["Unprocessed dashes: Text with --- dash"],
        ),
        (
            "<p>since--as you know</p>",
            ["Unprocessed dashes: since--as you know"],
        ),
        # Horizontal rules
        ("<p>\n---\n</p>", ["Unprocessed dashes: \n---\n"]),
        # Dashes in skipped elements should be ignored
        ("<code>Text with -- dash</code>", []),
        ("<pre>Text with -- dash</pre>", []),
        ('<div class="no-formatting">Text with -- dash</div>', []),
        ('<div class="elvish">Text with -- dash</div>', []),
        # Special cases that should be ignored (from formatting_improvement_html.ts tests)
        ("<p>- First level\n - Second level</p>", []),  # list items
        ("<p>> - First level</p>", []),  # Quoted lists
        ("<p>a browser- or OS-specific fashion</p>", []),  # Compound words
        # Mixed content
        (
            """
            <div>
                <p>Text with -- dash</p>
                <code>Ignored -- dash</code>
                <p>Another --- dash</p>
            </div>
        """,
            [
                "Unprocessed dashes: Text with -- dash",
                "Unprocessed dashes: Another --- dash",
            ],
        ),
    ],
)
def test_check_unprocessed_dashes(html, expected):
    soup = BeautifulSoup(html, "html.parser")
    result = built_site_checks.check_unprocessed_dashes(soup)
    assert sorted(result) == sorted(expected)


@pytest.mark.parametrize(
    "html,expected",
    [
        # Basic HTML tags that should be caught
        (
            "<p>&lt;div&gt; tag</p>",
            ["Unrendered HTML ['<div>']: <div> tag"],
        ),
        (
            "<p>&lt;/br&gt; tag</p>",
            ["Unrendered HTML ['</br>']: </br> tag"],
        ),
        # Self-closing tags
        (
            "<p>&lt;img/&gt; tag</p>",
            ["Unrendered HTML ['<img/>']: <img/> tag"],
        ),
        # Tags with attributes
        (
            '<p>&lt;div class="test"&gt; tag</p>',
            ["Unrendered HTML ['<div ']: <div class=\"test\"> tag"],
        ),
        # Multiple tags in one element
        (
            "<p>&lt;div&gt; and &lt;/div&gt; tags</p>",
            ["Unrendered HTML ['<div>', '</div>']: <div> and </div> tags"],
        ),
        # Tags in skipped elements should be ignored
        ("<code>&lt;div&gt; tag</code>", []),
        ("<pre>&lt;div&gt; tag</pre>", []),
        ('<div class="no-formatting">&lt;div&gt; tag</div>', []),
        ('<div class="elvish">&lt;div&gt; tag</div>', []),
        # Nested skipped elements
        ("<div><code>&lt;div&gt; tag</code></div>", []),
        ('<div class="no-formatting"><p>&lt;div&gt; tag</p></div>', []),
        # Mixed content
        (
            """
            <div>
                <p>&lt;div&gt; tag</p>
                <code>&lt;div&gt; tag</code>
                <p>&lt;/br&gt; tag</p>
            </div>
            """,
            [
                "Unrendered HTML ['<div>']: <div> tag",
                "Unrendered HTML ['</br>']: </br> tag",
            ],
        ),
        # Cases that should not be caught
        ("<p>Text with < or > symbols</p>", []),
        ("<p>Text with <3 heart</p>", []),
        ("<p>Math like 2 < x > 1</p>", []),
        # Complex case with nested elements
        (
            """<p>&lt;video autoplay loop muted playsinline src="<a href="https://assets.turntrout.com/static/images/posts/safelife2.mp4" class="external alias" target="_blank">https://assets.turntrout.com/static/images/posts/safelife2.<abbr class="small-caps">mp4</abbr><span style="white-space:nowrap;">"<img src="https://assets.turntrout.com/static/images/turntrout-favicons/favicon.ico" class="favicon" alt=""></span></a> style="width: 100%; height: 100%; object-fit: cover; margin: 0" ／type="video/<abbr class="small-caps">mp4</abbr>"&gt;<source src="https://assets.turntrout.com/static/images/posts/safelife2.mp4" type="video/mp4; codecs=hvc1"></p>""",
            [
                "Unrendered HTML ['<video ']: <video autoplay loop muted playsinline src=\""
            ],
        ),
    ],
)
def test_check_unrendered_html(html, expected):
    soup = BeautifulSoup(html, "html.parser")
    result = built_site_checks.check_unrendered_html(soup)
    assert sorted(result) == sorted(expected)


_TAGS_TO_CHECK = built_site_checks._TAGS_TO_CHECK_FOR_MISSING_ASSETS


@pytest.mark.parametrize(
    "md_content,html_content,expected",
    [
        # Basic image reference
        ("![Alt text](image.jpg)", "<img src='image.jpg'>", []),
        # Missing image from HTML
        (
            "![Alt text](missing.jpg)",
            "<img src='other.jpg'>",
            [
                "Asset missing.jpg appears 1 times in markdown but only 0 times in HTML"
            ],
        ),
        # Test all supported asset tags
        (
            "\n".join(
                [
                    f"<{tag} src='test.{tag}.file'></{tag}>"
                    for tag in _TAGS_TO_CHECK
                ]
            ),
            "\n".join(
                [
                    f"<{tag} src='test.{tag}.file'></{tag}>"
                    for tag in _TAGS_TO_CHECK
                ]
            ),
            [],
        ),
        # Missing assets for each tag type
        (
            "\n".join(
                [
                    f"<{tag} src='missing.{tag}.file'></{tag}>"
                    for tag in _TAGS_TO_CHECK
                ]
            ),
            "<div>No assets</div>",
            [
                f"Asset missing.{tag}.file appears 1 times in markdown but only 0 times in HTML"
                for tag in _TAGS_TO_CHECK
            ],
        ),
        # Mixed markdown and HTML tags
        (
            "![](image.jpg)\n<video src='video.mp4'>\n<audio src='audio.mp3'>",
            "<img src='image.jpg'><video src='video.mp4'><audio src='audio.mp3'>",
            [],
        ),
        # Extra HTML assets -> OK
        (
            "<video src='video.mp4'>\n<audio src='audio.mp3'>",
            "<video src='video.mp4'><audio src='audio.mp3'>",
            [],
        ),
        # Test whitespace handling around asset references
        (
            "![ ](  image.jpg  )\n<video src=' video.mp4 '>\n<audio src=' audio.mp3  '>",
            "<img src='image.jpg'><video src='video.mp4'><audio src='audio.mp3'>",
            [],
        ),
        (
            "![ ](  missing.jpg  )",
            "<img src='other.jpg'>",
            [
                "Asset missing.jpg appears 1 times in markdown but only 0 times in HTML"
            ],
        ),
        # Test asset appearing multiple times in markdown but fewer times in HTML
        (
            "![First](repeat.jpg)\n![Second](repeat.jpg)",
            "<img src='repeat.jpg'>",
            [
                "Asset repeat.jpg appears 2 times in markdown but only 1 times in HTML"
            ],
        ),
        # Test different path formats (absolute vs relative)
        (
            """
            ![](/asset_staging/test1.png)
            ![](/asset_staging/test2.png)
            <img src="/asset_staging/test3.png">
            """,
            """
            <img src="./asset_staging/test1.png">
            <img src="../asset_staging/test2.png">
            <img src="/asset_staging/test3.png">
            """,
            [],
        ),
        # Test stripping done by remark-attributes
        (
            "![ ](  image.jpg  )",
            "<img src='/asset_staging/image.jpg'>",
            [],
        ),
    ],
)
def test_check_markdown_assets_in_html(
    monkeypatch,
    tmp_path: Path,
    md_content: str,
    html_content: str,
    expected: list[str],
):
    """Test that markdown assets are properly checked against HTML output for all supported tags"""
    # Setup test files
    md_path = tmp_path / "content" / "test.md"
    html_path = tmp_path / "public" / "test.html"

    # Create directory structure
    md_path.parent.mkdir(parents=True, exist_ok=True)
    html_path.parent.mkdir(parents=True, exist_ok=True)

    # Write test files
    md_path.write_text(md_content)
    html_path.write_text(f"<html><body>{html_content}</body></html>")

    # Mock get_git_root to return tmp_path using monkeypatch
    monkeypatch.setattr("scripts.utils.get_git_root", lambda: tmp_path)

    # Run test
    soup = BeautifulSoup(html_content, "html.parser")
    result = built_site_checks.check_markdown_assets_in_html(soup, md_path)
    assert sorted(result) == sorted(expected)


def test_check_markdown_assets_in_html_with_invalid_md_path():
    """Test that check_markdown_assets_in_html returns an empty list when md_path is None"""
    soup = BeautifulSoup("<html><body></body></html>", "html.parser")
    md_path = Path("nonexistent.md")
    pytest.raises(
        FileNotFoundError,
        built_site_checks.check_markdown_assets_in_html,
        soup,
        md_path,
    )


@pytest.mark.parametrize(
    "html,expected",
    [
        # Test each whitelisted case - should be ignored
        *[
            (
                f"<p>{prev}<i>{next_}</i> else</p>",
                [],
            )
            for prev, next_ in built_site_checks.WHITELISTED_EMPHASIS
        ],
        # Test whitelisted case with extra whitespace - should be ignored
        *[
            (
                f"<p>{prev}  <i>{next_}</i>  else</p>",
                [],
            )
            for prev, next_ in built_site_checks.WHITELISTED_EMPHASIS
        ],
        # Test non-whitelisted case - should be ignored since Some is whitelisted
        (
            "<p>Some<i>thing</i> else</p>",
            [],
        ),
        # Test partial match - should be flagged
        (
            "<p>Somebody<i>one</i> else</p>",
            ["Missing space before: Somebody<i>one</i>"],
        ),
        # Test case sensitivity - should be flagged
        (
            "<p>some<i>one</i> else</p>",
            ["Missing space before: some<i>one</i>"],
        ),
        # Test with other emphasis elements - should be ignored since Some is whitelisted
        (
            "<p>Some<em>one</em> else</p>",
            [],
        ),
        # Test with nested elements - should be ignored since Some is whitelisted
        (
            "<p>Some<i><strong>one</strong></i> else</p>",
            [],
        ),
    ],
)
def test_check_emphasis_spacing_whitelist(html, expected):
    """Test the check_emphasis_spacing function's whitelist functionality."""
    soup = BeautifulSoup(html, "html.parser")
    result = built_site_checks.check_emphasis_spacing(soup)
    assert sorted(result) == sorted(expected)


def test_check_spacing_after_branch():
    html = "<p><a href='#'>link</a>missing_space</p>"
    soup = BeautifulSoup(html, "html.parser")

    link_element = soup.find("a")

    # Test the "after" branch specifically
    result = built_site_checks.check_spacing(
        link_element, built_site_checks.ALLOWED_ELT_FOLLOWING_CHARS, "after"
    )

    expected = ["Missing space after: <a>link</a>missing_space"]
    assert result == expected


_MAX_DESCRIPTION_LENGTH = built_site_checks.MAX_DESCRIPTION_LENGTH
_MIN_DESCRIPTION_LENGTH = built_site_checks.MIN_DESCRIPTION_LENGTH


@pytest.mark.parametrize(
    "html,expected",
    [
        # Test description within limit
        (
            """
            <html>
            <head>
                <meta name="description" content="This is a valid description.">
            </head>
            </html>
            """,
            [],
        ),
        # Test description exceeding limit
        (
            f"""
            <html>
            <head>
                <meta name="description" content="{'a' * (_MAX_DESCRIPTION_LENGTH + 1)}">
            </head>
            </html>
            """,
            [
                f"Description too long: {_MAX_DESCRIPTION_LENGTH + 1} characters (recommended <= {_MAX_DESCRIPTION_LENGTH})"
            ],
        ),
        # Test description below minimum length
        (
            f"""
            <html>
            <head>
                <meta name="description" content="{'a' * (_MIN_DESCRIPTION_LENGTH - 1)}">
            </head>
            </html>
            """,
            [
                f"Description too short: {_MIN_DESCRIPTION_LENGTH - 1} characters (recommended >= {_MIN_DESCRIPTION_LENGTH})"
            ],
        ),
        # Test missing description
        (
            """
            <html>
            <head>
            </head>
            </html>
            """,
            ["Description not found"],
        ),
        # Test empty description
        (
            """
            <html>
            <head>
                <meta name="description" content="">
            </head>
            </html>
            """,
            ["Description not found"],
        ),
    ],
)
def test_check_description_length(html: str, expected: list[str]) -> None:
    """Test the check_description_length function."""
    soup = BeautifulSoup(html, "html.parser")
    result = built_site_checks.check_description_length(soup)
    assert result == expected


@pytest.mark.parametrize(
    "css_content,expected",
    [
        # Test CSS with @supports
        (
            """
            @supports (initial-letter: 4) {
                p::first-letter {
                    initial-letter: 4;
                }
            }
            """,
            [],
        ),
        # Test CSS without @supports
        (
            """
            p::first-letter {
                float: left;
                font-size: 4em;
            }
            """,
            [
                "CSS file test.css does not contain @supports, which is "
                "required for dropcaps in Firefox"
            ],
        ),
        # Test empty CSS
        (
            "",
            [
                "CSS file test.css does not contain @supports, which is "
                "required for dropcaps in Firefox"
            ],
        ),
        # Test CSS with multiple @supports
        (
            """
            @supports (display: grid) {
                .grid { display: grid; }
            }
            @supports (initial-letter: 4) {
                p::first-letter { initial-letter: 4; }
            }
            """,
            [],
        ),
    ],
)
def test_check_css_issues(
    tmp_path: Path, css_content: str, expected: list[str]
):
    """Test the check_css_issues function with various CSS contents."""
    # Create a temporary CSS file
    css_file = tmp_path / "test.css"
    css_file.write_text(css_content)

    result = built_site_checks.check_css_issues(css_file)
    assert result == expected


def test_check_css_issues_missing_file(tmp_path: Path):
    """Test check_css_issues with a non-existent file."""
    css_file = tmp_path / "nonexistent.css"
    result = built_site_checks.check_css_issues(css_file)
    assert result == [f"CSS file {css_file} does not exist"]


@pytest.mark.parametrize(
    "html,expected",
    [
        # Single critical CSS - valid
        (
            '<html><head><style id="critical-css">.css{}</style></head></html>',
            True,
        ),
        # No critical CSS - invalid
        ("<html><head><style>.css{}</style></head></html>", False),
        # No head - invalid
        ("<html><head></head></html>", False),
        # Multiple critical CSS blocks - invalid
        (
            '<html><head><style id="critical-css">.css{}</style><style id="critical-css">.more{}</style></head></html>',
            False,
        ),
        # Critical CSS outside head - invalid
        (
            '<html><head></head><body><style id="critical-css">.css{}</style></body></html>',
            False,
        ),
    ],
)
def test_check_critical_css(html, expected):
    soup = BeautifulSoup(html, "html.parser")
    result = built_site_checks.check_critical_css(soup)
    assert result == expected


_MAX_META_HEAD_SIZE = built_site_checks.MAX_META_HEAD_SIZE


@pytest.mark.parametrize(
    "html,expected",
    [
        # Test meta/title tags after MAX_HEAD_SIZE
        (
            f"<head>{('a' * _MAX_META_HEAD_SIZE)}<meta name='test'><title>Late tags</title></head>",
            [
                "<meta> tag found after first 9KB: <meta name='test'>",
                "<title> tag found after first 9KB: <title>",
            ],
        ),
        # Test tags before MAX_HEAD_SIZE (should be fine)
        (
            f"<head><meta name='test'><title>Early tags</title></head>{'a' * _MAX_META_HEAD_SIZE}",
            [],
        ),
        # Test tags split across MAX_HEAD_SIZE boundary
        (
            f"<head>{'a' * (_MAX_META_HEAD_SIZE - 10)}<meta name='test'><title>Split tags</title></head>",
            ["<title> tag found after first 9KB: <title>"],
        ),
        # Test no head tag
        (
            f"{'a' * _MAX_META_HEAD_SIZE}<meta name='test'><title>No head</title>",
            [],
        ),
        # Test empty file
        (
            "",
            [],
        ),
        # Test multiple meta tags after MAX_HEAD_SIZE
        (
            f"<head>{'a' * _MAX_META_HEAD_SIZE}<meta name='test1'><meta name='test2'></head>",
            [
                "<meta> tag found after first 9KB: <meta name='test1'>",
                "<meta> tag found after first 9KB: <meta name='test2'>",
            ],
        ),
    ],
)
def test_meta_tags_first_10kb(tmp_path, html, expected):
    """Test checking for meta and title tags after first 9KB of file."""
    test_file = tmp_path / "test.html"
    test_file.write_text(html)

    result = built_site_checks.meta_tags_early(test_file)
    assert sorted(result) == sorted(expected)


@pytest.mark.parametrize(
    "html,expected_count",
    [
        # Test valid internal link
        ('<a class="internal" href="/some/path">Valid Link</a>', 0),
        # Test internal link without href
        ('<a class="internal">Missing href</a>', 1),
        # Test internal link with https://
        (
            '<a class="internal" href="https://example.com">External Link</a>',
            1,
        ),
        # Test multiple invalid links
        (
            """
            <div>
                <a class="internal">No href</a>
                <a class="internal" href="https://example.com">External</a>
                <a class="internal" href="/valid">Valid</a>
            </div>
            """,
            2,
        ),
        # Test link without internal class (should be ignored)
        (
            '<a href="https://example.com">External without internal class</a>',
            0,
        ),
        # Test mixed valid and invalid
        (
            """
            <div>
                <a class="internal" href="/path1">Valid 1</a>
                <a class="internal">Invalid 1</a>
                <a class="internal" href="/path2">Valid 2</a>
                <a class="internal" href="https://example.com">Invalid 2</a>
            </div>
            """,
            2,
        ),
    ],
)
def test_check_invalid_internal_links(html, expected_count):
    """Test the check_invalid_internal_links function with various test cases."""
    soup = BeautifulSoup(html, "html.parser")
    result = built_site_checks.check_invalid_internal_links(soup)
    assert len(result) == expected_count
    for link in result:
        assert "internal" in link.get("class", [])
        # Verify the link is actually invalid
        assert not link.has_attr("href") or link["href"].startswith("https://")


@pytest.mark.parametrize(
    "md_content,expected_counts",
    [
        # Basic Markdown Image
        ("![alt text](image.png)", {"image.png": 1}),
        # Basic HTML Image
        ('<img src="photo.jpg">', {"photo.jpg": 1}),
        # Basic HTML Video
        ('<video src="movie.mp4"></video>', {"movie.mp4": 1}),
        # Basic HTML Audio
        ('<audio src="sound.mp3"></audio>', {"sound.mp3": 1}),
        # Basic HTML Source (often inside video/audio)
        ('<source src="track.vtt">', {"track.vtt": 1}),
        # Basic HTML SVG (using src, though href is common too)
        ('<svg src="icon.svg"></svg>', {"icon.svg": 1}),
        # Multiple different assets
        (
            "![alt](img1.gif)\n<img src='img2.jpeg'>",
            {"img1.gif": 1, "img2.jpeg": 1},
        ),
        # Multiple same assets
        ("![alt](img.png)\n<img src='img.png'>", {"img.png": 2}),
        # Path stripping needed
        ("![alt]( /asset_staging/path/img.png )", {"path/img.png": 1}),
        # Path stripping with dots and spaces
        ("![alt](  ./another/img.png)", {"another/img.png": 1}),
        # --- Ignored Cases ---
        # Asset inside fenced code block (HTML)
        ("```html\n<img src='ignored.jpg'>\n```", {}),
        # Asset inside fenced code block (Markdown)
        ("```markdown\n![alt](ignored.md.png)\n```", {}),
        # Asset inside inline code
        ("This is ` <img src='ignored-inline.gif'> ` code.", {}),
        ("Also `![alt](ignored-inline-md.jpeg)` this.", {}),
        # Asset inside math block (double dollar)
        ("$$ \\includegraphics{ignored-math.png} $$", {}),
        # Asset inside inline math (single dollar)
        ("Equation: $x = y + z; \\path{ignored-inline-math.pdf}$", {}),
        # --- Mixed Cases ---
        # Valid asset alongside ignored code block asset
        (
            "![alt](valid.png)\n```html\n<img src='ignored.jpg'>\n```",
            {"valid.png": 1},
        ),
        # Valid asset alongside ignored inline code asset
        (
            "<img src=\"valid.gif\"> This is ` <img src='ignored-inline.gif'> ` code.",
            {"valid.gif": 1},
        ),
        # Valid asset alongside ignored math block asset
        (
            "$$ \\includegraphics{ignored-math.png} $$\n<video src='valid.mp4'></video>",
            {"valid.mp4": 1},
        ),
        # Valid asset alongside ignored inline math asset
        (
            "Equation: $x = y + z; \\path{ignored-inline-math.pdf}$\n![alt](valid.jpg)",
            {"valid.jpg": 1},
        ),
        # Complex mix
        (
            """
         This is ![a valid image](image1.png).

         ```html
         <p>This is code with an <img src="ignored1.jpg"></p>
         ```

         Another valid one <img src="image2.png">. Also `inline ![ignored](ignored2.jpg)` code.

         $$
         \\command{ignored3.pdf}
         $$

         Final one: ![alt](image1.png)
         """,
            {"image1.png": 2, "image2.png": 1},
        ),
        # --- Edge Cases ---
        # Empty content
        ("", {}),
        # Content with no assets
        ("Just some text.", {}),
        # Content with unrelated HTML/Markdown
        ("<h1>Title</h1>\n* List item", {}),
    ],
)
def test_get_md_asset_counts(tmp_path, md_content, expected_counts):
    """Test get_md_asset_counts with various markdown content including ignored blocks."""
    md_file = tmp_path / "test.md"
    md_file.write_text(md_content, encoding="utf-8")
    result = built_site_checks.get_md_asset_counts(md_file)
    assert result == Counter(expected_counts)


@pytest.mark.parametrize(
    "html,expected,mock_responses",
    [
        # Test successful response
        (
            '<iframe src="https://example.com" title="Example" alt="Alt text"></iframe>',
            [],
            [(True, 200)],
        ),
        # Test failed response
        (
            '<iframe src="https://fail.com" title="Fail Test" alt="Alt desc"></iframe>',
            [
                "Iframe source https://fail.com returned status 404. Description: title='Fail Test' (alt='Alt desc')"
            ],
            [(False, 404)],
        ),
        # Test request exception
        (
            '<iframe src="https://error.com" title="Error Test"></iframe>',
            [
                "Failed to load iframe source https://error.com: Connection error. Description: title='Error Test' (alt='')"
            ],
            [Exception("Connection error")],
        ),
        # Test multiple iframes
        (
            """
            <iframe src="https://success.com" title="Success"></iframe>
            <iframe src="https://fail.com" title="Fail"></iframe>
            <iframe src="https://error.com" title="Error"></iframe>
            """,
            [
                "Iframe source https://fail.com returned status 404. Description: title='Fail' (alt='')",
                "Failed to load iframe source https://error.com: Connection error. Description: title='Error' (alt='')",
            ],
            [(True, 200), (False, 404), Exception("Connection error")],
        ),
        # Test protocol-relative URL
        (
            '<iframe src="//protocol-relative.com" title="Protocol"></iframe>',
            [
                "Iframe source https://protocol-relative.com returned status 404. Description: title='Protocol' (alt='')"
            ],
            [(False, 404)],
        ),
        # Test relative URL (should be skipped)
        (
            '<iframe src="/relative/path" title="Relative"></iframe>',
            [],
            [],
        ),
        # Test iframe without src
        (
            '<iframe title="No Src"></iframe>',
            [],
            [],
        ),
        # Test relative URL (should be skipped)
        (
            '<iframe src="./relative/path" title="Relative"></iframe>',
            [],
            [],
        ),
    ],
)
def test_check_iframe_sources(
    monkeypatch, html: str, expected: list[str], mock_responses: list
):
    """Test the check_iframe_sources function with various scenarios."""
    soup = BeautifulSoup(html, "html.parser")

    # Counter to track which response to return
    response_index = 0

    def mock_head(url: str, timeout: int) -> object:
        nonlocal response_index
        if response_index >= len(mock_responses):
            raise ValueError("Not enough mock responses provided")

        response = mock_responses[response_index]
        response_index += 1

        if isinstance(response, Exception):
            raise requests.RequestException(str(response))

        ok, status_code = response
        mock_response = type(
            "MockResponse", (), {"ok": ok, "status_code": status_code}
        )
        return mock_response

    # Patch the requests.head function
    monkeypatch.setattr(requests, "head", mock_head)

    result = built_site_checks.check_iframe_sources(soup)
    assert sorted(result) == sorted(expected)


@pytest.mark.parametrize(
    "html,expected",
    [
        # Basic cases - missing spaces
        (
            "<p>text<a href='#'>link</a></p>",
            ["Missing space before: text<a>link</a>"],
        ),
        # Test allowed characters before link
        *[
            (f"<p>text{char}<a href='#'>link</a> text</p>", [])
            for char in built_site_checks.ALLOWED_ELT_PRECEDING_CHARS
        ],
        # Test allowed characters after link
        *[
            (f"<p>text <a href='#'>link</a>{char}text</p>", [])
            for char in built_site_checks.ALLOWED_ELT_FOLLOWING_CHARS
        ],
        # Test mixed cases
        (
            "<p>text(<a href='#'>good</a> text<a href='#'>bad</a>)</p>",
            ["Missing space before:  text<a>bad</a>"],
        ),
        # Test footnote links (should be ignored)
        (
            "<p>text<a href='#user-content-fn-1'>footnote</a></p>",
            [],
        ),
        # Test multiple links
        (
            """
            <p>text<a href='#'>one</a> text</p>
            <p>text <a href='#'>two</a> text</p>
            <p>text<a href='#'>three</a> text</p>
            """,
            [
                "Missing space before: text<a>one</a>",
                "Missing space before: text<a>three</a>",
            ],
        ),
        (
            "<p>Hi <a href='#'>Test<span>span</span></a> text</p>",
            [],
        ),
        (  # Multiline matching
            "<p>Hi <a href='#'>Test<span>span</span></a> text\n\nTest</p>",
            [],
        ),
    ],
)
def test_check_link_spacing(html, expected):
    """Test the check_link_spacing function."""
    soup = BeautifulSoup(html, "html.parser")
    result = built_site_checks.check_link_spacing(soup)
    assert sorted(result) == sorted(expected)


@pytest.mark.parametrize(
    "html,expected",
    [
        # Basic consecutive periods
        (
            "<p>Test..</p>",
            ["Consecutive periods found: Test.."],
        ),
        # Periods separated by quotes
        (
            '<p>Test.".</p>',
            ['Consecutive periods found: Test.".'],
        ),
        # Periods separated by curly quotes
        (
            "<p>Test.”.</p>",
            ["Consecutive periods found: Test.”."],
        ),
        # Multiple instances in one element
        (
            '<p>First.. Second.".</p>',
            ['Consecutive periods found: First.. Second.".'],
        ),
        # Skipped elements
        (
            "<code>Test..</code>",
            [],
        ),
        ('<div class="no-formatting">Test..</div>', []),
        # Mixed content with skipped elements
        (
            """
            <div>
                <p>Valid..</p>
                <code>Skipped..</code>
                <p>Also.".</p>
            </div>
            """,
            [
                "Consecutive periods found: Valid..",
                'Consecutive periods found: Also.".',
            ],
        ),
        # Edge cases
        (
            "<p>Single period. No issue</p>",
            [],
        ),
        (
            "<p>Multiple... periods</p>",
            ["Consecutive periods found: Multiple... periods"],
        ),
        # Nested elements
        (
            "<p>Test<em>..</em>nested</p>",
            ["Consecutive periods found: .."],
        ),
        # Ignore ..?
        (
            "<p>Test..?</p>",
            [],
        ),
    ],
)
def test_check_consecutive_periods(html, expected):
    """Test the check_consecutive_periods function."""
    soup = BeautifulSoup(html, "html.parser")
    result = built_site_checks.check_consecutive_periods(soup)
    assert sorted(result) == sorted(expected)


@pytest.mark.parametrize(
    "html,expected",
    [
        # Test favicon directly under span with correct class (valid)
        (
            '<span class="favicon-span"><img class="favicon" src="test.ico"></span>',
            [],
        ),
        # Test favicon without parent span (invalid)
        (
            '<div><img class="favicon" src="test.ico"></div>',
            [
                "Favicon (test.ico) is not a direct child of a span.favicon-span. Instead, it's a child of <div>: "
            ],
        ),
        # Test favicon nested deeper (invalid)
        (
            '<span class="favicon-span"><div><img class="favicon" src="test.ico"></div></span>',
            [
                "Favicon (test.ico) is not a direct child of a span.favicon-span. Instead, it's a child of <div>: "
            ],
        ),
        # Test multiple favicons
        (
            """
            <div>
                <span class="favicon-span"><img class="favicon" src="valid.ico"></span>
                <div><img class="favicon" src="invalid.ico"></div>
            </div>
            """,
            [
                "Favicon (invalid.ico) is not a direct child of a span.favicon-span. Instead, it's a child of <div>: "
            ],
        ),
        # Test favicon with no parent
        (
            '<img class="favicon" src="orphan.ico">',
            [
                "Favicon (orphan.ico) is not a direct child of a span.favicon-span. Instead, it's a child of <[document]>: "
            ],
        ),
        # Test non-favicon images (should be ignored)
        (
            '<div><img src="regular.png"></div>',
            [],
        ),
        # Test favicon under span but missing required class (invalid)
        (
            '<span><img class="favicon" src="test.ico"></span>',
            [
                "Favicon (test.ico) is not a direct child of a span.favicon-span. Instead, it's a child of <span>: "
            ],
        ),
    ],
)
def test_check_favicon_parent_elements(html, expected):
    soup = BeautifulSoup(html, "html.parser")
    assert built_site_checks.check_favicon_parent_elements(soup) == expected


@pytest.mark.parametrize(
    "file_structure,expected",
    [
        # Test robots.txt in root (valid)
        (["robots.txt"], []),
        # Test missing robots.txt
        ([], ["robots.txt not found in site root"]),
        # Test robots.txt in subdirectory (should still report missing from root)
        (["static/robots.txt"], ["robots.txt not found in site root"]),
    ],
)
def test_check_robots_txt_location(
    tmp_path: Path, file_structure: list[str], expected: list[str]
):
    """Test the check_robots_txt_location function with various file structures."""
    # Create the test files
    for file_path in file_structure:
        full_path = tmp_path / file_path
        full_path.parent.mkdir(parents=True, exist_ok=True)
        full_path.touch()

    result = built_site_checks.check_robots_txt_location(tmp_path)
    assert result == expected


@pytest.mark.parametrize(
    "html,expected",
    [
        # Test with preloaded EBGaramond subfont (valid)
        (
            """
            <html>
            <head>
                <link rel="preload" as="font" href="/subfont/EBGaramond-Regular.woff2">
            </head>
            </html>
            """,
            True,
        ),
        # Test with preloaded font but wrong name (invalid)
        (
            """
            <html>
            <head>
                <link rel="preload" as="font" href="/subfont/SomeOtherFont.woff2">
            </head>
            </html>
            """,
            False,
        ),
        # Test with preload but wrong type (invalid)
        (
            """
            <html>
            <head>
                <link rel="preload" as="style" href="/subfont/EBGaramond-Regular.woff2">
            </head>
            </html>
            """,
            False,
        ),
        # Test with no preloaded fonts (invalid)
        (
            """
            <html>
            <head>
                <link rel="stylesheet" href="style.css">
            </head>
            </html>
            """,
            False,
        ),
        # Test with no head (invalid)
        (
            "<html><body></body></html>",
            False,
        ),
        # Test with case insensitivity (valid)
        (
            """
            <html>
            <head>
                <link rel="preload" as="font" href="/subfont/ebgaramond-italic.woff2">
            </head>
            </html>
            """,
            True,
        ),
        # Test with multiple preloaded fonts including the required one (valid)
        (
            """
            <html>
            <head>
                <link rel="preload" as="font" href="/subfont/OtherFont.woff2">
                <link rel="preload" as="font" href="/subfont/EBGaramond-Bold.woff2">
            </head>
            </html>
            """,
            True,
        ),
    ],
)
def test_check_preloaded_fonts(html, expected):
    """Test the check_preloaded_fonts function with various HTML structures."""
    soup = BeautifulSoup(html, "html.parser")
    assert built_site_checks.check_preloaded_fonts(soup) == expected


def test_check_file_for_issues_with_fonts(tmp_path):
    """Test that the font check is included when should_check_fonts is True."""
    # Create a test HTML file with no preloaded font
    html_content = """
    <html>
    <head><title>Test</title></head>
    <body><p>Test content</p></body>
    </html>
    """
    file_path = tmp_path / "test.html"
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(html_content)

    # Check with fonts enabled
    issues = built_site_checks.check_file_for_issues(
        file_path, tmp_path, None, should_check_fonts=True
    )

    # Verify that missing_preloaded_font is in the issues
    assert "missing_preloaded_font" in issues
    assert issues["missing_preloaded_font"] is True

    # Check with fonts disabled
    issues = built_site_checks.check_file_for_issues(
        file_path, tmp_path, None, should_check_fonts=False
    )

    # Verify that missing_preloaded_font is not in the issues
    assert "missing_preloaded_font" not in issues


@pytest.mark.parametrize(
    "html,expected",
    [
        # Test valid relative paths (should be allowed)
        (
            """
            <img src="/images/test.jpg">
            <img src="./images/test.jpg">
            <img src="../images/test.jpg">
            """,
            [],
        ),
        # Test valid assets.turntrout.com domain
        (
            """
            <img src="https://assets.turntrout.com/image.jpg">
            <video src="https://assets.turntrout.com/video.mp4">
            <source src="https://assets.turntrout.com/audio.mp3">
            """,
            [],
        ),
        # Test invalid domains
        (
            """
            <img src="https://example.com/image.jpg">
            <video src="https://invalid.com/video.mp4">
            """,
            [
                "https://invalid.com/video.mp4 (in video tag)",
                "https://example.com/image.jpg (in img tag)",
            ],
        ),
        # Test protocol-relative URLs
        (
            """
            <img src="https://assets.turntrout.com/image.jpg">
            <img src="https://example.com/image.jpg">
            """,
            [
                "https://example.com/image.jpg (in img tag)",
            ],
        ),
        # Test SVG elements
        (
            """
            <svg src="https://assets.turntrout.com/icon.svg"></svg>
            <svg src="https://example.com/icon.svg"></svg>
            """,
            [
                "https://example.com/icon.svg (in svg tag)",
            ],
        ),
        # Test mixed content
        (
            """
            <div>
                <img src="/local/image.jpg">
                <img src="https://assets.turntrout.com/valid.jpg">
                <img src="https://invalid.com/image.jpg">
                <video src="another.com/video.mp4"></video>
            </div>
            """,
            [
                "https://invalid.com/image.jpg (in img tag)",
                "another.com/video.mp4 (in video tag)",
            ],
        ),
        # Test elements without src attribute
        (
            """
            <img>
            <video></video>
            <source>
            <svg></svg>
            """,
            [],
        ),
    ],
)
def test_check_media_asset_sources(html, expected):
    """Test the check_media_asset_sources function with various HTML structures."""
    soup = BeautifulSoup(html, "html.parser")
    result = built_site_checks.check_media_asset_sources(soup)
    assert sorted(result) == sorted(expected)


@pytest.mark.parametrize(
    "html_content, existing_files, expected_missing",
    [
        # Test case 1: All assets exist
        (
            """
            <link rel="stylesheet" href="/styles/main.css">
            <link rel="preload" href="./styles/preloaded.css" as="style">
            <script src="/js/script.js"></script>
            <script src="./js/relative.js"></script>
            """,
            [
                "styles/main.css",
                "styles/preloaded.css",
                "js/script.js",
                "js/relative.js",
            ],
            [],
        ),
        # Test case 2: Some assets missing
        (
            """
            <link rel="stylesheet" href="/styles/main.css">
            <link rel="stylesheet" href="/styles/missing.css">
            <script src="/js/script.js"></script>
            <script src="missing.js"></script>
            """,
            ["styles/main.css", "js/script.js"],
            [
                "/styles/missing.css (resolved to public/styles/missing.css)",
                "missing.js (resolved to public/missing.js)",
            ],
        ),
        # Test case 3: External assets (should be ignored)
        (
            """
            <link rel="stylesheet" href="https://example.com/style.css">
            <script src="https://example.com/script.js"></script>
            """,
            [],
            [],
        ),
        # Test case 4: Missing href/src attributes
        (
            """
            <link rel="stylesheet">
            <script></script>
            """,
            [],
            [],
        ),
        # Test case 5: Link with list-like rel attribute
        (
            """
            <link rel="preload stylesheet" href="/styles/list_rel.css">
            """,
            ["styles/list_rel.css"],
            [],
        ),
        # Test case 6: Mixed missing and existing
        (
            """
            <link rel="stylesheet" href="/styles/exists1.css">
            <script src="missing1.js"></script>
            <link rel="stylesheet" href="missing2.css">
            <script src="/js/exists2.js"></script>
            """,
            ["styles/exists1.css", "js/exists2.js"],
            [
                "missing1.js (resolved to public/missing1.js)",
                "missing2.css (resolved to public/missing2.css)",
            ],
        ),
    ],
)
def test_check_asset_references(
    tmp_path: Path,
    html_content: str,
    existing_files: list[str],
    expected_missing: list[str],
) -> None:
    """Test the check_asset_references function."""
    base_dir = tmp_path / "public"
    base_dir.mkdir()
    # Create a dummy html file path relative to base_dir
    html_file_path = base_dir / "index.html"
    html_file_path.touch()

    # Create existing asset files
    for file_rel_path in existing_files:
        asset_path = base_dir / file_rel_path
        asset_path.parent.mkdir(parents=True, exist_ok=True)
        asset_path.touch()

    soup = BeautifulSoup(
        f"<html><head>{html_content}</head></html>", "html.parser"
    )

    # Adjust expected paths to be relative to the base_dir for assertion
    expected_missing_resolved = sorted(
        [
            exp.replace("(resolved to public/", f"(resolved to {base_dir}/")
            for exp in expected_missing
        ]
    )

    missing_assets = built_site_checks.check_asset_references(
        soup, html_file_path, base_dir
    )
    assert sorted(missing_assets) == expected_missing_resolved


def test_check_file_for_issues_markdown_check_called_with_valid_md(tmp_path):
    """Test that check_markdown_assets_in_html is called when md_path is valid."""
    base_dir = tmp_path / "public"
    base_dir.mkdir()
    content_dir = tmp_path / "content"
    content_dir.mkdir()

    html_file_path = base_dir / "test.html"
    html_file_path.write_text("<html><body>Test</body></html>")
    md_file_path = content_dir / "test.md"
    md_file_path.touch()
    assert md_file_path.is_file()

    with patch(
        "built_site_checks.check_markdown_assets_in_html",
        return_value=["Mocked issue"],
    ) as mock_check:
        issues = built_site_checks.check_file_for_issues(
            html_file_path, base_dir, md_file_path, should_check_fonts=False
        )

    mock_check.assert_called_once_with(
        BeautifulSoup("<html><body>Test</body></html>", "html.parser"),
        md_file_path,
    )
    assert "missing_markdown_assets" in issues
    assert issues["missing_markdown_assets"] == ["Mocked issue"]


def test_check_file_for_issues_markdown_check_not_called_with_invalid_md(
    tmp_path,
):
    """Test that check_markdown_assets_in_html is NOT called when md_path is invalid."""
    base_dir = tmp_path / "public"
    base_dir.mkdir()
    content_dir = tmp_path / "content"
    content_dir.mkdir()

    html_file_path = base_dir / "test.html"
    html_file_path.write_text("<html><body>Test</body></html>")
    non_existent_md_path = content_dir / "non_existent.md"

    with patch(
        "built_site_checks.check_markdown_assets_in_html",
        return_value=[],
    ) as mock_check_none:
        issues_none = built_site_checks.check_file_for_issues(
            html_file_path, base_dir, None, should_check_fonts=False
        )
    mock_check_none.assert_not_called()
    assert "missing_markdown_assets" not in issues_none

    with patch(
        "built_site_checks.check_markdown_assets_in_html",
        return_value=[],
    ) as mock_check_non_existent:
        issues_non_existent = built_site_checks.check_file_for_issues(
            html_file_path,
            base_dir,
            non_existent_md_path,
            should_check_fonts=False,
        )
    mock_check_non_existent.assert_not_called()
    assert "missing_markdown_assets" not in issues_non_existent


@pytest.mark.parametrize(
    "filename, should_check_favicon",
    [
        ("about.html", True),
        ("index.html", False),
        ("other.html", False),
    ],
)
def test_check_file_for_issues_favicon_check_called(
    tmp_path, filename, should_check_favicon
):
    """Test that check_favicons_missing is called only for about.html."""
    base_dir = tmp_path / "public"
    base_dir.mkdir()
    file_path = base_dir / filename
    file_path.write_text("<html><body>No favicon info</body></html>")

    # We don't need to mock check_favicons_missing, just check if the key is added
    issues = built_site_checks.check_file_for_issues(
        file_path, base_dir, None, should_check_fonts=False
    )

    if should_check_favicon:
        assert issues["missing_favicon"] is True
    else:
        assert "missing_favicon" not in issues


@pytest.mark.parametrize(
    "test_args,expected_check_fonts",
    [
        ([], False),
        (["--check-fonts"], True),
    ],
)
def test_parser_args_check_fonts(
    test_args: list[str], expected_check_fonts: bool
):
    with patch.object(sys, "argv", ["built_site_checks.py"] + test_args):
        args = built_site_checks.parser.parse_args()
        assert args.check_fonts == expected_check_fonts


def test_main_no_issues(
    mock_environment,
    valid_css_file,
    robots_txt_file,
    html_file,
    monkeypatch,
    disable_md_requirement,
):
    """Test main() when no issues are found."""
    monkeypatch.setattr(
        built_site_checks, "check_file_for_issues", lambda *args, **kwargs: {}
    )

    monkeypatch.setattr(
        script_utils, "build_html_to_md_map", lambda md_dir: {}
    )

    # For successful execution, sys.exit should not be called
    with patch.object(sys, "exit") as mock_exit:
        built_site_checks.main()
        mock_exit.assert_not_called()


def test_main_css_issues(
    mock_environment,
    invalid_css_file,
    robots_txt_file,
    html_file,
    monkeypatch,
    disable_md_requirement,
):
    monkeypatch.setattr(
        built_site_checks, "check_file_for_issues", lambda *args, **kwargs: {}
    )

    monkeypatch.setattr(
        script_utils, "build_html_to_md_map", lambda md_dir: {}
    )

    with patch.object(built_site_checks, "_print_issues") as mock_print:
        with pytest.raises(SystemExit) as excinfo:
            built_site_checks.main()
        assert excinfo.value.code == 1

        mock_print.assert_any_call(
            invalid_css_file,
            {
                "CSS_issues": [
                    "CSS file index.css does not contain @supports, which is required for dropcaps in Firefox"
                ]
            },
        )


def test_main_robots_txt_issues(
    mock_environment,
    valid_css_file,
    html_file,
    monkeypatch,
    disable_md_requirement,
):
    """Test main() when robots.txt is missing."""
    monkeypatch.setattr(
        built_site_checks, "check_file_for_issues", lambda *args, **kwargs: {}
    )

    monkeypatch.setattr(
        script_utils, "build_html_to_md_map", lambda md_dir: {}
    )

    with patch.object(built_site_checks, "_print_issues") as mock_print:
        with pytest.raises(SystemExit) as excinfo:
            built_site_checks.main()
        assert excinfo.value.code == 1

        # Verify robots.txt issues were printed
        mock_print.assert_any_call(
            mock_environment["public_dir"],
            {"robots_txt_issues": ["robots.txt not found in site root"]},
        )


def test_main_html_issues(
    mock_environment,
    valid_css_file,
    robots_txt_file,
    html_file,
    monkeypatch,
    disable_md_requirement,
):
    """Test main() when HTML files have issues."""
    html_issues = {"localhost_links": ["http://localhost:8000"]}

    monkeypatch.setattr(
        built_site_checks,
        "check_file_for_issues",
        lambda *args, **kwargs: html_issues,
    )

    monkeypatch.setattr(
        script_utils, "build_html_to_md_map", lambda md_dir: {}
    )

    # Mock _print_issues to verify correct issue types
    with patch.object(built_site_checks, "_print_issues") as mock_print:
        with pytest.raises(SystemExit) as excinfo:
            built_site_checks.main()
        assert excinfo.value.code == 1

        # Verify HTML issues were printed
        mock_print.assert_any_call(html_file, html_issues)


def test_main_handles_markdown_mapping(
    mock_environment,
    valid_css_file,
    robots_txt_file,
    html_file,
    md_file,
    monkeypatch,
    disable_md_requirement,
):
    """Test that main() correctly handles markdown path mapping."""
    md_map = {"test": md_file}

    # Create a spy on check_file_for_issues to verify md_path parameter
    with patch.object(
        built_site_checks, "check_file_for_issues", return_value={}
    ) as mock_check:
        monkeypatch.setattr(
            script_utils, "build_html_to_md_map", lambda md_dir: md_map
        )

        built_site_checks.main()

        # Verify check_file_for_issues was called with correct md_path
        mock_check.assert_called_with(
            html_file,
            mock_environment["public_dir"],
            md_file,
            should_check_fonts=False,
        )


def test_main_markdown_not_found_error(
    mock_environment,
    valid_css_file,
    robots_txt_file,
    html_file,
    monkeypatch,
):
    """Test that main() raises ValueError when a required markdown file is missing."""
    # Set up empty md map (missing the mapping)
    md_map = {}

    # Mock mapping functions
    monkeypatch.setattr(
        script_utils, "build_html_to_md_map", lambda md_dir: md_map
    )

    # Set should_have_md to return True (indicating it needs markdown)
    monkeypatch.setattr(script_utils, "should_have_md", lambda file_path: True)

    # Run main function, expect ValueError
    with pytest.raises(
        FileNotFoundError,
        match=f"Markdown file for {html_file.stem} not found",
    ):
        built_site_checks.main()


def test_main_command_line_args(
    mock_environment,
    valid_css_file,
    robots_txt_file,
    html_file,
    monkeypatch,
    disable_md_requirement,
):
    """Test that main() correctly handles command line arguments."""
    monkeypatch.setattr(sys, "argv", ["built_site_checks.py", "--check-fonts"])

    # Create a spy on check_file_for_issues to verify should_check_fonts parameter
    with patch.object(
        built_site_checks, "check_file_for_issues", return_value={}
    ) as mock_check:
        monkeypatch.setattr(
            script_utils, "build_html_to_md_map", lambda md_dir: {}
        )

        built_site_checks.main()

        # Verify check_file_for_issues was called with should_check_fonts=True
        mock_check.assert_called_with(
            html_file,
            mock_environment["public_dir"],
            None,
            should_check_fonts=True,
        )


def test_main_skips_drafts(
    mock_environment,
    valid_css_file,
    robots_txt_file,
    html_file,
    monkeypatch,
):
    monkeypatch.setattr(
        script_utils, "should_have_md", lambda file_path: False
    )

    with patch.object(built_site_checks, "_print_issues") as mock_print:
        built_site_checks.main()
        mock_print.assert_not_called()


@pytest.mark.parametrize(
    "html,expected_issues",
    [
        # Valid case: WEBM then MP4, matching base names
        (
            """
            <video>
                <source src="video.mp4" type="video/mp4; codecs=hvc1">
                <source src="video.webm" type="video/webm">
            </video>
            """,
            [],
        ),
        # Incorrect order: WEBM then MP4
        (
            """
            <video>
                <source src="video.webm" type="video/webm">
                <source src="video.mp4" type="video/mp4; codecs=hvc1">
            </video>
            """,
            [
                "Video source 2 type != 'video/webm': <video> (got 'video/mp4; codecs=hvc1')",
                "Video source 2 'src' does not end with .webm: 'video.mp4' in <video>",
                "Video source 1 type != 'video/mp4; codecs=hvc1': <video> (got 'video/webm')",
                "Video source 1 'src' does not end with .mp4: 'video.webm' in <video>",
            ],
        ),
        # Missing WEBM source (only MP4 present)
        (
            """
            <video>
                <source src="video.mp4" type="video/mp4; codecs=hvc1">
            </video>
            """,
            ["<video> tag has < 2 <source> children: <video>"],
        ),
        # Missing MP4 source (only WEBM present)
        (
            """
            <video>
                <source src="video.webm" type="video/webm">
            </video>
            """,
            ["<video> tag has < 2 <source> children: <video>"],
        ),
        # Wrong type attribute for WEBM
        (
            """
            <video>
                <source src="video.mp4" type="video/mp4; codecs=hvc1">
                <source src="video.webm" type="video/ogg">
            </video>
            """,
            ["Video source 2 type != 'video/webm': <video> (got 'video/ogg')"],
        ),
        # Wrong type attribute for MP4
        (
            """
            <video>
                <source src="video.mp4" type="video/ogg">
                <source src="video.webm" type="video/webm">
            </video>
            """,
            [
                "Video source 1 type != 'video/mp4; codecs=hvc1': <video> (got 'video/ogg')"
            ],
        ),
        # Wrong file extension for WEBM src
        (
            """
            <video>
                <source src="video.mp4" type="video/mp4; codecs=hvc1">
                <source src="video.ogg" type="video/webm">
            </video>
            """,
            [
                "Video source 2 'src' does not end with .webm: 'video.ogg' in <video>"
            ],
        ),
        # Wrong file extension for MP4 src
        (
            """
            <video>
                <source src="video.ogg" type="video/mp4; codecs=hvc1">
                <source src="video.webm" type="video/webm">
            </video>
            """,
            [
                "Video source 1 'src' does not end with .mp4: 'video.ogg' in <video>"
            ],
        ),
        # Fewer than two source tags
        (
            """
            <video>
                <source src="video.webm" type="video/webm">
            </video>
            """,
            ["<video> tag has < 2 <source> children: <video>"],
        ),
        # Source tags missing src
        (
            """
            <video>
                <source src="video.mp4" type="video/mp4; codecs=hvc1">
                <source type="video/webm">
            </video>
            """,
            [
                "Video source 2 'src' missing or not a string: <video>",
            ],
        ),
        # Source tags missing type
        (
            """
            <video>
                <source src="video.mp4" type="video/mp4; codecs=hvc1">
                <source src="video.webm">
            </video>
            """,
            ["Video source 2 type != 'video/webm': <video> (got 'None')"],
        ),
        # Video tags with no source children
        (
            """
            <video controls>
                Your browser does not support the video tag.
            </video>
            """,
            ['<video> tag has < 2 <source> children: <video controls="">'],
        ),
        # Multiple video tags, one valid, one invalid
        (
            """
            <video>
                <source src="good.mp4" type="video/mp4; codecs=hvc1">
                <source src="good.webm" type="video/webm">
            </video>
            <video>
                <source src="bad.webm" type="video/webm">
                <source src="bad.mp4" type="video/mp4; codecs=hvc1">
            </video>
            """,
            [
                "Video source 2 type != 'video/webm': <video> (got 'video/mp4; codecs=hvc1')",
                "Video source 2 'src' does not end with .webm: 'bad.mp4' in <video>",
                "Video source 1 type != 'video/mp4; codecs=hvc1': <video> (got 'video/webm')",
                "Video source 1 'src' does not end with .mp4: 'bad.webm' in <video>",
            ],
        ),
        # Case variations in extensions and types (should still be valid)
        (
            """
            <video>
                <source src="video.MP4" type="VIDEO/MP4; codecs=hvc1">
                <source src="video.WEBm" type="VIDEO/webm">
            </video>
            """,
            [],
        ),
        # Paths with query strings or fragments (should compare base correctly)
        (
            """
            <video>
                <source src="video.mp4?v=1#t=10" type="video/mp4; codecs=hvc1">
                <source src="video.webm?v=1#t=10" type="video/webm">
            </video>
            """,
            [],
        ),
        (
            """
            <video>
                <source src="FIRSTvideo.mp4" type="video/mp4; codecs=hvc1">
                <source src="SECONDvideo.webm" type="video/webm">
            </video>
            """,
            [
                "Video source base paths mismatch: 'FIRSTvideo' vs 'SECONDvideo' in <video>"
            ],
        ),
        # Video tag with id='pond-video'
        (
            """
            <video id="pond-video">
                <source src="video.mov" type="video/mp4; codecs=hvc1">
                <source src="video.webm" type="video/webm">
            </video>
            """,
            [],
        ),
    ],
)
def test_check_video_source_order_and_match(
    html: str, expected_issues: list[str]
) -> None:
    """Test the check_video_source_order_and_match function."""
    soup = BeautifulSoup(html, "html.parser")
    # Ensure the function being tested is correctly referenced
    result = built_site_checks.check_video_source_order_and_match(soup)
    assert sorted(result) == sorted(expected_issues)


@pytest.mark.parametrize(
    "html_content, expected_issues",
    [
        # --- Valid Cases ---
        ('<a class="external" href="https://example.com">Valid HTTPS</a>', []),
        ('<a class="external" href="http://example.com">Valid HTTP</a>', []),
        # Internal/Relative/Fragment/Mailto/Tel links (no 'external' class, should be ignored by check)
        ('<a href="/relative/path">Valid Relative Path</a>', []),
        ('<a href="./relative">Valid Relative Dot Path</a>', []),
        ('<a href="../relative">Valid Relative Parent Path</a>', []),
        ('<a href="#fragment">Valid Fragment</a>', []),
        ('<a href="mailto:test@example.com">Valid Mailto</a>', []),
        ('<a href="tel:+1234567890">Valid Tel</a>', []),
        # Valid mailto links (should pass)
        ('<a href="mailto:test@example.com">Valid Email</a>', []),
        (
            '<a href="mailto:test.name+alias@example.co.uk">Valid Complex Email</a>',
            [],
        ),
        # Invalid mailto links (should fail)
        (
            '<a href="mailto:test@">Invalid Email (Missing domain)</a>',
            ["Syntactically invalid email: mailto:test@"],
        ),
        (
            '<a href="mailto:@example.com">Invalid Email (Missing local part)</a>',
            ["Syntactically invalid email: mailto:@example.com"],
        ),
        (
            '<a href="mailto:test@@example.com">Invalid Email (Double @)</a>',
            ["Syntactically invalid email: mailto:test@@example.com"],
        ),
        (
            '<a href="mailto:test space@example.com">Invalid Email (Space)</a>',
            ["Syntactically invalid email: mailto:test space@example.com"],
        ),
        (
            '<a href="mailto:test@exa mple.com">Invalid Email (Space in domain)</a>',
            ["Syntactically invalid email: mailto:test@exa mple.com"],
        ),
        (
            '<a href="mailto:test">Invalid Email (No @)</a>',
            ["Syntactically invalid email: mailto:test"],
        ),
        (
            '<a href="mailto:">Invalid Email (Empty)</a>',
            ["Syntactically invalid email: mailto:"],
        ),
        # External link that looks like mailto but isn't (should use URL validation if external)
        (
            '<a class="external" href="http://mailto:fake@example.com">External Looks Like Mailto</a>',
            [],
        ),  # Valid URL
        (
            '<a class="external" href="mailto-server.com/path">External Starts With mailto</a>',
            ["Syntactically invalid href: mailto-server.com/path"],
        ),  # Invalid URL syntax
        # Non-external link that looks like mailto (should be skipped)
        (
            '<a href="http://mailto:fake@example.com">Internal Looks Like Mailto</a>',
            [],
        ),
        (
            '<a href="mailto-server.com/path">Internal Starts With mailto</a>',
            [],
        ),
        # Protocol relative IS considered external for validation purposes if class="external"
        (
            '<a class="external" href="//protocol.relative.com">Valid Protocol Relative</a>',
            [],
        ),
        # --- Invalid Cases (Caught by validators.url, only if class="external") ---
        (
            '<a class="external" href="http://">Missing Domain</a>',
            ["Syntactically invalid href: http://"],
        ),
        (
            '<a class="external" href="https://">Missing Domain HTTPS</a>',
            ["Syntactically invalid href: https://"],
        ),
        (
            '<a class="external" href="http://invalid-tld">Invalid TLD</a>',
            ["Syntactically invalid href: http://invalid-tld"],
        ),
        (
            '<a class="external" href="notaurl">Not a URL</a>',
            ["Syntactically invalid href: notaurl"],
        ),
        # Space in URL (skipped)
        (
            '<a class="external" href="https://example.com/path with space">Space in Path</a>',
            [],
        ),
        # Previously identified malformed URLs (only flagged if external)
        (
            '<a class="external" href="https://ht%3Cem%3Etp://lesswr%3C/em%3Eong.com/lw/jd9/building_phenomenological_bridges/%E2%80%8E">Malformed 1</a>',
            [
                "Syntactically invalid href: https://ht%3Cem%3Etp://lesswr%3C/em%3Eong.com/lw/jd9/building_phenomenological_bridges/%E2%80%8E"
            ],
        ),
        (
            '<a class="external" href="https://%E2%80%8B!%5B%5D(https://assets.turntrout.com/static/images/posts/x3myqQ1.avif">Malformed 2</a>',
            [
                "Syntactically invalid href: https://%E2%80%8B!%5B%5D(https://assets.turntrout.com/static/images/posts/x3myqQ1.avif"
            ],
        ),
        (
            '<a class="external" href="https://shard%20theory">Malformed 3 (Space)</a>',
            ["Syntactically invalid href: https://shard%20theory"],
        ),
        # --- Cases that should NOT be flagged (missing class="external") ---
        (
            '<a href="http://">Missing Domain (Internal)</a>',
            [],
        ),  # No class="external"
        (
            '<a href="notaurl">Not a URL (Internal)</a>',
            [],
        ),  # No class="external"
        (
            '<a href="https://example.com/path with space">Space (Internal)</a>',
            [],
        ),  # No class="external"
        (
            '<a href="https://ht%3Cem%3Etp://...">Malformed 1 (Internal)</a>',
            [],
        ),  # No class="external"
        # --- Edge Cases ---
        (
            '<a class="external" href="">Empty Href</a>',
            [],
        ),  # Empty string is not invalid syntax per se, might be caught elsewhere
        ("<a>Missing Href</a>", []),  # Ignored by selector
        (
            '<a class="external">Missing Href External</a>',
            [],
        ),  # Ignored by selector
        # --- Mixed valid and invalid external links ---
        (
            """
         <a class="external" href="https://valid.com">Valid Ext</a>
         <a class="external" href="invalid-syntax">Invalid Ext</a>
         <a href="/relative">Relative (Ignored)</a>
         <a class="external" href="http://">No Domain Ext</a>
         <a href="invalid-internal">Invalid Int (Ignored)</a>
        """,
            [
                "Syntactically invalid href: invalid-syntax",
                "Syntactically invalid href: http://",
            ],
        ),
    ],
)
def test_check_malformed_hrefs(html_content: str, expected_issues: list[str]):
    """Test the check_malformed_hrefs function correctly filters for external links."""
    soup = BeautifulSoup(html_content, "html.parser")
    # Assuming built_site_checks contains the corrected check_malformed_hrefs
    result = built_site_checks.check_malformed_hrefs(soup)
    assert sorted(result) == sorted(expected_issues)
