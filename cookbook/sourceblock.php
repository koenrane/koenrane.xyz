<?php if (!defined('PmWiki')) exit();
/*
 * SourceBlock - Yet another source code syntax highlighter for PmWiki 2.x
 * Copyright 2005-2014 by D.Faure (dfaure@cpan.org)
 * Geshi module written by and (C) Nigel McNie (oracle.shinoda@gmail.com)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * See http://www.pmwiki.org/wiki/Cookbook/SourceBlock for info.
 */
$RecipeInfo['SourceBlock']['Version'] = '2019-07-16';

SDV($GESHI_PATH, dirname(__FILE__) . "/geshi");

SDV($SourceBlockAction, 'sourceblock');
if ($action == $SourceBlockAction) {
  $HandleActions[$SourceBlockAction] = 'SourceBlockGetCodeAction';
  $HandleAuth[$SourceBlockAction] = 'read';
}

Markup('sourceblock', '>markupend',
  "/\\(:source(\\s+.*?)?\\s*:\\)[^\\S\n]*\\[([=@])(.*?)\\2\\]/si",
  "SourceBlockMarkupA");

function SourceBlockMarkupA($m) {
  extract($GLOBALS['MarkupToHTML']);
  return SourceBlockMarkup($pagename, $m[1], $m[3]);
}

Markup('sourceblockend', '>sourceblock',
  "/\\(:source(\\s+.*?)?\\s*:\\)[^\\S\n]*\n(.*?)\\(:sourcee?nd:\\)/si",
  "SourceBlockMarkupB");

function SourceBlockMarkupB($m) {
  extract($GLOBALS['MarkupToHTML']);
  return SourceBlockMarkup($pagename, $m[1], $m[2]);
}

Markup('codeblock', '>markupend',
  "/\\(:code(\\s+.*?)?\\s*:\\)[^\\S\n]*\\[([=@])(.*?)\\2\\]/si",
  "SourceBlockMarkupC");

function SourceBlockMarkupC($m) {
  extract($GLOBALS['MarkupToHTML']);
  return CodeBlockMarkup($pagename, $m[1], $m[3]);
}

Markup('codeblockend', '>codeblock',
  "/\\(:code(\\s+.*?)?\\s*:\\)[^\\S\n]*\n(.*?)\\(:codee?nd:\\)/si",
  "SourceBlockMarkupD");

function SourceBlockMarkupD($m) {
  extract($GLOBALS['MarkupToHTML']);
  return CodeBlockMarkup($pagename, $m[1], $m[2]);
}

/*
if (function_exists('Markup_e')) {
  Markup_e('sourceblock', '>markupend',
    "/\\(:source(\\s+.*?)?\\s*:\\)[^\\S\n]*\\[([=@])(.*?)\\2\\]/si",
    "SourceBlockMarkup(\$pagename, \$m[1], \$m[3])");
  Markup_e('sourceblockend', '>sourceblock',
    "/\\(:source(\\s+.*?)?\\s*:\\)[^\\S\n]*\n(.*?)\\(:sourcee?nd:\\)/si",
    "SourceBlockMarkup(\$pagename, \$m[1], \$m[2])");

  Markup_e('codeblock', '>markupend',
    "/\\(:code(\\s+.*?)?\\s*:\\)[^\\S\n]*\\[([=@])(.*?)\\2\\]/si",
    "CodeBlockMarkup(\$pagename, \$m[1], \$m[3])");
  Markup_e('codeblockend', '>codeblock',
    "/\\(:code(\\s+.*?)?\\s*:\\)[^\\S\n]*\n(.*?)\\(:codee?nd:\\)/si",
    "CodeBlockMarkup(\$pagename, \$m[1], \$m[2])");
} else {
  Markup('sourceblock', '>markupend',
    "/\\(:source(\\s+.*?)?\\s*:\\)[^\\S\n]*\\[([=@])(.*?)\\2\\]/sei",
    "SourceBlockMarkup(\$pagename, PSS('$1'), PSS('$3'))");
  Markup('sourceblockend', '>sourceblock',
    "/\\(:source(\\s+.*?)?\\s*:\\)[^\\S\n]*\n(.*?)\\(:sourcee?nd:\\)/sei",
    "SourceBlockMarkup(\$pagename, PSS('$1'), PSS('$2'))");

  Markup('codeblock', '>markupend',
    "/\\(:code(\\s+.*?)?\\s*:\\)[^\\S\n]*\\[([=@])(.*?)\\2\\]/sei",
    "CodeBlockMarkup(\$pagename, PSS('$1'), PSS('$3'))");
  Markup('codeblockend', '>codeblock',
    "/\\(:code(\\s+.*?)?\\s*:\\)[^\\S\n]*\n(.*?)\\(:codee?nd:\\)/sei",
    "CodeBlockMarkup(\$pagename, PSS('$1'), PSS('$2'))");
}
*/

function SourceBlockGetCodeAction($pagename, $auth) {
  global $HandleBrowseFmt;
  $HandleBrowseFmt = '';
  HandleBrowse($pagename);
  return;
}

function SourceBlockGetCodeInit($pagename, &$opt) {
  global $SourceBlockDivNumber, $EnableSourceBlockGetCode;
  SDV($SourceBlockDivNumber, 0);
  ++$SourceBlockDivNumber;

  if(@in_array('getcode', (array)$opt['-'])) return 0;
  if(@in_array('getcode', (array)$opt['+'])) return 1;
  return IsEnabled($EnableSourceBlockGetCode, 1);
}

function SourceBlockGetCodeHandler($pagename, &$opt, &$block) {
  global $PCache, $action, $SourceBlockAction, $SourceBlockLinkUrl,
         $SourceBlockLinkText, $EnableIEForcedAttachment, $SourceBlockDivNumber;

  if ($action == $SourceBlockAction && $SourceBlockDivNumber == $_REQUEST['num']) {
    # undo PmWiki's htmlspecialchars conversion
    $block = str_replace(array('<:vspace>', '&lt;', '&gt;', '&amp;'),
                         array('', '<', '>', '&'), $block);
    $filename = IsEnabled($opt['filename'], "sourceblock_{$SourceBlockDivNumber}.txt");
    $type = 'text/plain';
    $disp = @in_array('inline', (array)$opt['-']) ? 'attachment' : 'inline';
    if(IsEnabled($EnableIEForcedAttachment, 1) &&
       strpos($_SERVER['HTTP_USER_AGENT'], 'MSIE') !== false) {
      $type = 'application/octet-stream';
      $disp = 'attachment';
    }
    header("Cache-Control: cache, must-revalidate");
    header("Expires: Tue, 01 Jan 2002 00:00:00 GMT");
    header("Content-type: $type");
    header("Content-disposition: $disp; filename=$filename");
    header('Content-Length: ' . strlen($block));
    echo $block;
    exit(0);
  }
  SDV($SourceBlockLinkUrl, "<a href='\$LinkUrl' type='text/plain'>\$LinkText</a>");
  SDV($SourceBlockLinkText, "[$[Get Code]]");
  return MakeLink($pagename,
                  "{$pagename}?action={$SourceBlockAction}&amp;num={$SourceBlockDivNumber}",
                  $SourceBlockLinkText, NULL, $SourceBlockLinkUrl);
}

function CodeBlockMarkup($pagename, $args, $block) {
  global $CodeBlockFmt, $HTMLStylesFmt, $SourceBlockDivNumber;
  $opt = ParseArgs($args);
  $getcode = SourceBlockGetCodeInit($pagename, $opt);
  SDV($CodeBlockFmt, "
<div class='codeblock \$class' id='\$id'>
  <div class='codeblocktext'><pre>\$txt</pre></div>
  <div class='codeblocklink'>\$url</div>
</div>
");
  SDV($HTMLStylesFmt['codeblock'], "
.codeblocklink {
  text-align: right;
  font-size: smaller;
}
.codeblocktext {
  text-align: left;
  padding: 0.5em;
  border: 1px solid #808080;
  color: #000000;
  background-color: #f1f0ed;
}
.codeblocktext pre {
  font-family: monospace;
  font-size: small;
  line-height: 1;
}
");
  # undo PmWiki's htmlspecialchars conversion
  $block = str_replace(array('<:vspace>', '&lt;', '&gt;', '&amp;'),
                       array('', '<', '>', '&'), $block);
  return Keep(str_replace(
    array('$class', '$id', '$url', '$txt'),
    array(@$opt['class'],
          IsEnabled($opt['id'], 'sourceblock'.$SourceBlockDivNumber),
          $getcode ? SourceBlockGetCodeHandler($pagename, $opt, $block) : '',
          htmlspecialchars(isset($opt['wrap']) ?
                           wordwrap($block, $opt['wrap']) : $block)),
    $CodeBlockFmt));
}

function SourceBlockMarkup($pagename, $args, $block) {
  global $SourceBlockParams, $SourceBlockTrimmedChars, $GESHI_PATH,
         $HTMLStylesFmt, $GeshiStyles, $GeshiConfig, $SourceBlockFmt,
         $SourceBlockDivNumber, $EnableSourceBlockKeywordLinks;
  SDVA($SourceBlockParams, array('header' => '', 'footer' => ''));
  $opt = array_merge((array)$SourceBlockParams, ParseArgs($args));
  $getcode = SourceBlockGetCodeInit($pagename, $opt);
  if(!@in_array('trim', (array)$opt['-'])) {
    SDV($SourceBlockTrimmedChars, "\n\r");
    $block = trim($block, $SourceBlockTrimmedChars);
  }
  if(@$opt['lang']) {
    include_once($GESHI_PATH . "/geshi.php");
    # undo PmWiki's htmlspecialchars conversion
    $block = str_replace(array('<:vspace>', '&lt;', '&gt;', '&amp;'),
                          array('', '<', '>', '&'), $block);
    $geshi = new GeSHi($block, $opt['lang'], GESHI_LANG_ROOT);
    $geshi->enable_classes();
    SDVA($GeshiStyles, array(
    'code'  => 'font-family: monospace; font-weight: normal;',
    'line1' => 'font-family: monospace; color: black; font-weight: normal;',
    'line2' => 'font-weight: bold;',
    ));
    $geshi->set_code_style($GeshiStyles['code']);
    $geshi->set_line_style($GeshiStyles['line1'], $GeshiStyles['line2']);
	$geshi->set_header_type(@in_array('headw', (array)$opt['-']) ? GESHI_HEADER_NONE : GESHI_HEADER_DIV);
    if(@$opt['tabwidth']) $geshi->set_tab_width($opt['tabwidth']);
    if(@in_array('strict', (array)$opt['']))
      $geshi->enable_strict_mode();
    if(@in_array('linenum', (array)$opt['']))
      $geshi->enable_line_numbers(GESHI_FANCY_LINE_NUMBERS);
    if(@$opt['linenum'])
      $geshi->enable_line_numbers(GESHI_FANCY_LINE_NUMBERS, $opt['linenum']);
    if(@$opt['linestart'])
      $geshi->start_line_numbers_at($opt['linestart']);
    if(@$opt['highlight']) {
      $geshi->enable_line_numbers(GESHI_FANCY_LINE_NUMBERS);
      $geshi->highlight_lines_extra(preg_split("/[\\s,;]+/", $opt['highlight']));
    }
    if(@$opt['encoding']) $geshi->set_encoding($opt['encoding']);
    $geshi->set_header_content($opt['header']);
    $geshi->set_footer_content($opt['footer']);
    $links = IsEnabled($EnableSourceBlockKeywordLinks, false);
    if(    @in_array('link', (array)$opt['-'])) $links = false;
    elseif(@in_array('link', (array)$opt['+'])) $links = true;
    $geshi->enable_keyword_links($links);
    if($GeshiConfig) $GeshiConfig($pagename, $geshi, $args);
    @$HTMLStylesFmt['geshi_' . $opt['lang']] = $geshi->get_stylesheet(false);
    $txt = $geshi->parse_code();
    if($geshi->error()) $txt = $geshi->error();
  } else {
    $lines = explode("\n", $block);
    $count = count($lines);
    $linenum = "";
    if(@in_array('linenum', (array)$opt[''])) $linenum = "<ol>";
    elseif(@$opt['linenum']) $linenum = "<ol start=" . $opt['linenum'] . ">";
    $txt = "";
    for($i = 0; $i < $count; $i++)
      $txt .= ($linenum ? "<li>" : "") . $lines[$i] . ($linenum ? "</li>" : "<br/>");
    $txt = "<div>{$linenum}{$txt}" . ($linenum ? "</ol>" : "") . "</div>";
  }
  SDV($SourceBlockFmt, "
<div class='sourceblock \$class' id='\$id'>
  <div class='sourceblocktext'>\$txt</div>
  <div class='sourceblocklink'>\$url</div>
</div>
");
  SDV($HTMLStylesFmt['sourceblock'], "
.sourceblocklink {
  text-align: right;
  font-size: smaller;
}
.sourceblocktext {
  padding: 0.5em;
  border: 1px solid #808080;
  color: #000000;
  background-color: #f1f0ed;
}
.sourceblocktext div {
  font-family: monospace;
  font-size: small;
  line-height: 1;
  height: 1%;
}
.sourceblocktext div.head,
.sourceblocktext div.foot {
  font: italic medium serif;
  padding: 0.5em;
}
");
  return Keep(str_replace(
    array('$class', '$id', '$url', '$txt'),
    array(@$opt['class'],
          IsEnabled($opt['id'], 'sourceblock'.$SourceBlockDivNumber),
          $getcode ? SourceBlockGetCodeHandler($pagename, $opt, $block) : '',
          $txt),
    $SourceBlockFmt));
}

/*
if (function_exists('Markup_e')) {
  Markup_e('sourceblockinfo', '<sourceblock',
    "/\\(:source\\s+(info|langs)\\s*:\\)/i",
    "SourceBlockGeshiInfos(\$pagename)");
} else {
  Markup('sourceblockinfo', '<sourceblock',
    "/\\(:source\\s+(info|langs)\\s*:\\)/ie",
    "SourceBlockGeshiInfos(\$pagename)");
}
*/

Markup('sourceblockinfo', '<sourceblock',
    "/\\(:source\\s+(info|langs)\\s*:\\)/i",
    "SourceBlockGeshiInfos");

function SourceBlockGeshiInfos($m) {
  global $GESHI_PATH, $SourceBlockLangNames;
  include_once($GESHI_PATH . "/geshi.php");
  $out = "Geshi Version: " . GESHI_VERSION . "\n";
  if(IsEnabled($SourceBlockLangNames, 1))
    $out .= "\n||border=1\n||! lang ||! full name ||\n";
  if($dh = opendir(GESHI_LANG_ROOT)) {
    while(($file = readdir($dh)) !== false) {
      if(preg_match("/\\.php$/", $file)) {
        $lang = basename($file, ".php");
        if(IsEnabled($SourceBlockLangNames, 1)) {
          $language_data = array();
          require GESHI_LANG_ROOT . $file;
          $infos[$lang] = "|| @@" . $lang . "@@ ||" . $language_data['LANG_NAME'] . " ||";
        } else
          $infos[$lang] = "* @@" . $lang . "@@";
      }
    }
    closedir($dh);
    ksort($infos);
  }
  if(@isset($infos))
    $out .= implode("\n", $infos) . "\n";
  return $out;
}

if(!$RecipeInfo['LinkedResourceExtras']['Version']) return;

/*
if (function_exists('Markup_e')) {
  Markup_e('codeblockfile', '<codeblock',
    "/\\(:code\\s+([\\(\\)\\w]+:\\S+)(.*?):\\)/i",
    "SourceBlockFileMarkup('CodeBlockMarkup', \$pagename, \$m[1], \$m[2])");

  Markup_e('sourceblockfile', '<sourceblock',
    "/\\(:source\\s+([\\(\\)\\w]+:\\S+)(.*?):\\)/i",
    "SourceBlockFileMarkup('SourceBlockMarkup', \$pagename, \$m[1], \$m[2])");
} else {
  Markup('codeblockfile', '<codeblock',
    "/\\(:code\\s+([\\(\\)\\w]+:\\S+)(.*?):\\)/ie",
    "SourceBlockFileMarkup('CodeBlockMarkup', \$pagename, '$1', PSS('$2'))");

  Markup('sourceblockfile', '<sourceblock',
    "/\\(:source\\s+([\\(\\)\\w]+:\\S+)(.*?):\\)/ie",
    "SourceBlockFileMarkup('SourceBlockMarkup', \$pagename, '$1', PSS('$2'))");
}
*/

Markup('codeblockfile', '<codeblock',
  "/\\(:code\\s+([\\(\\)\\w]+:\\S+)(.*?):\\)/i",
  "SourceBlockFileMarkupA");

function SourceBlockFileMarkupA($m) {
  extract($GLOBALS['MarkupToHTML']);
  return SourceBlockFileMarkup('CodeBlockMarkup', $pagename, $m[1], $m[2]);
}

Markup('sourceblockfile', '<sourceblock',
  "/\\(:source\\s+([\\(\\)\\w]+:\\S+)(.*?):\\)/i",
  "SourceBlockFileMarkupB");

function SourceBlockFileMarkupB($m) {
  extract($GLOBALS['MarkupToHTML']);
  return SourceBlockFileMarkup('SourceBlockMarkup', $pagename, $m[1], $m[2]);
}

function SourceBlockFileMarkup($func, $pagename, $tgt, $args) {
  if(!ResolveLinkResource($pagename, $tgt, $url, $txt, $upname, $filepath, $size, $mime))
    return Keep(isset($filepath) ? $url : '');
  SDV($filepath, $url);
  $block = array();
  $fp = fopen($filepath, "r");
  if($fp) {
    while($l = fgets($fp, 4096))
      $block[] = $l;
    fclose($fp);
  }
  $block = implode('', $block);
#  $block = file_get_contents($filepath, false);
  return $func($pagename, $args, $block);
}
