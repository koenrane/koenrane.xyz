<?php if (!defined('PmWiki')) exit();
/*  Copyright 2004-2024 Patrick R. Michaud (pmichaud@pobox.com)
    This file is part of PmWiki; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published
    by the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.  See pmwiki.php for full details.

    This script defines routines for displaying page revisions.  It
    is included by default from the stdconfig.php script.
    
    Script maintained by Petko YOTOV www.pmwiki.org/petko
*/

function LinkSuppress($pagename,$imap,$path,$title,$txt,$fmt=NULL) 
  { return $txt; }

SDV($DiffShow['minor'],(@$_REQUEST['minor']!='n')?'y':'n');
SDV($DiffShow['source'],(@$_REQUEST['source']!='n')?'y':'n');
SDV($DiffMinorFmt, ($DiffShow['minor']=='y') ?
  "<a href='{\$PageUrl}?action=diff&amp;source=".$DiffShow['source']."&amp;minor=n'>$[Hide minor edits]</a>" :
  "<a href='{\$PageUrl}?action=diff&amp;source=".$DiffShow['source']."&amp;minor=y'>$[Show minor edits]</a>" );
SDV($DiffSourceFmt, ($DiffShow['source']=='y') ?
  "<a href='{\$PageUrl}?action=diff&amp;source=n&amp;minor=".$DiffShow['minor']."'>$[Show changes to output]</a>" :
  "<a href='{\$PageUrl}?action=diff&amp;source=y&amp;minor=".$DiffShow['minor']."'>$[Show changes to markup]</a>");
SDV($PageDiffFmt,"<h2 class='wikiaction'>$[{\$FullName} History]</h2>
  <p>$DiffMinorFmt - $DiffSourceFmt</p>
  ");
SDV($DiffStartFmt,"
      <div class='diffbox \$DiffClass' data-delay='\$DiffDataDelay'><div class='difftime'><a name='diff\$DiffGMT' id='diff\$DiffGMT' href='#diff\$DiffGMT'>\$DiffTime</a>
        \$[by] <span class='diffauthor' title='\$DiffHost'>\$DiffAuthor</span> - \$DiffChangeSum</div>");
SDV($DiffDelFmt['a'],"
        <div class='difftype'>\$[Deleted line \$DiffLines:]</div>
        <div class='diffdel'>");
SDV($DiffDelFmt['c'],"
        <div class='difftype'>\$[Changed line \$DiffLines from:]</div>
        <div class='diffdel'>");
SDV($DiffAddFmt['d'],"
        <div class='difftype'>\$[Added line \$DiffLines:]</div>
        <div class='diffadd'>");
SDV($DiffAddFmt['c'],"</div>
        <div class='difftype'>$[to:]</div>
        <div class='diffadd'>");
SDV($DiffEndDelAddFmt,"</div>");
SDV($DiffEndFmt,"</div>");
SDV($DiffRestoreFmt,"
      <div class='diffrestore'><a href='{\$PageUrl}?action=edit&amp;restore=\$DiffId&amp;preview=y'>$[Restore]</a></div>");

SDV($HandleActions['diff'], 'HandleDiff');
SDV($HandleAuth['diff'], 'read');
SDV($ActionTitleFmt['diff'], '| $[History]');

function PrintDiff($pagename, $since=0) {
  global $Now, $DiffHTMLFunction,$DiffShow,$DiffStartFmt,$TimeFmt,
    $DiffEndFmt,$DiffRestoreFmt,$FmtV, $EnableDiffHidden, $LinkFunctions;
  $page = ReadPage($pagename, $since);
  if (!$page) return;
  krsort($page); reset($page);
  $lf = $LinkFunctions;
  $LinkFunctions['http:'] = 'LinkSuppress';
  $LinkFunctions['https:'] = 'LinkSuppress';
  SDV($DiffHTMLFunction, 'DiffHTML');
  $prevstamp = $Now;
  foreach($page as $k=>$v) {
    if (!preg_match("/^diff:(\d+):(\d+):?([^:]*)/",$k,$match)) continue;
    $diffclass = $match[3];
    if ($diffclass=='hidden' && !@$EnableDiffHidden) continue;
    if ($diffclass=='minor' && $DiffShow['minor']!='y') continue;
    $diffgmt = $FmtV['$DiffGMT'] = intval($match[1]);
    $delaydays = ($prevstamp - $diffgmt) / 86400;
    $compact = DiffTimeCompact($diffgmt, $prevstamp, 1);
    $prevstamp = $diffgmt;
    if ($delaydays < 1) $cname = '';
    elseif ($delaydays < 7) $cname = 'diffday';
    elseif ($delaydays < 31) $cname = 'diffweek';
    elseif ($delaydays < 365) $cname = 'diffmonth';
    else $cname = 'diffyear';
    $FmtV['$DiffClass'] = trim("$cname $diffclass");
    $FmtV['$DiffDataDelay'] = $compact;
    $FmtV['$DiffTime'] = PSFT($TimeFmt,$diffgmt);
    $diffauthor = @$page["author:$diffgmt"]; 
    if (!$diffauthor) @$diffauthor=$page["host:$diffgmt"];
    if (!$diffauthor) $diffauthor="unknown";
    $FmtV['$DiffChangeSum'] = PHSC(@$page["csum:$diffgmt"]);
    $FmtV['$DiffHost'] = @$page["host:$diffgmt"];
    $FmtV['$DiffUserAgent'] = PHSC(@$page["agent:$diffgmt"], ENT_QUOTES);
    $FmtV['$DiffAuthor'] = $diffauthor;
    $FmtV['$DiffId'] = $k;
    $html = $DiffHTMLFunction($pagename, $v);
    if ($html===false) continue;
    echo FmtPageName($DiffStartFmt,$pagename);
    echo $html;
    echo FmtPageName($DiffEndFmt,$pagename);
    echo FmtPageName($DiffRestoreFmt,$pagename);
  }
  $LinkFunctions = $lf;
}

# This function converts a single diff entry from the wikipage file
# into HTML, ready for display.
function DiffHTML($pagename, $diff) {
  if (@$_REQUEST['nodiff']>'') return '';
  global $FmtV, $DiffShow, $DiffAddFmt, $DiffDelFmt, $DiffEndDelAddFmt,
  $DiffRenderSourceFunction;
  SDV($DiffRenderSourceFunction, 'DiffRenderSource');
  $difflines = explode("\n",$diff."\n");
  $in=array(); $out=array(); $dtype=''; $html = '';
  foreach($difflines as $d) {
    if ($d>'') {
      if ($d[0]=='-' || $d[0]=='\\') continue;
      if ($d[0]=='<') { $out[]=substr($d,2); continue; }
      if ($d[0]=='>') { $in[]=substr($d,2); continue; }
    }
    if (preg_match("/^(\\d+)(,(\\d+))?([adc])(\\d+)(,(\\d+))?/",
        $dtype,$match)) {
      if (@$match[7]>'') {
        $lines='lines';
        $count=$match[1].'-'.($match[1]+$match[7]-$match[5]);
      } elseif ($match[3]>'') {
        $lines='lines'; $count=$match[1].'-'.$match[3];
      } else { $lines='line'; $count=$match[1]; }
      if ($match[4]=='a' || $match[4]=='c') {
        $txt = str_replace('line',$lines,$DiffDelFmt[$match[4]]);
        $FmtV['$DiffLines'] = $count;
        $html .= FmtPageName($txt,$pagename);
        if ($DiffShow['source']=='y') 
          $html .= "<div class='diffmarkup'>"
            .$DiffRenderSourceFunction($in, $out, 0)
            ."</div>";
        else $html .= MarkupToHTML($pagename,
          preg_replace_callback('/\\(:.*?:\\)/',"cb_diffhtml", join("\n",$in)));
      }
      if ($match[4]=='d' || $match[4]=='c') {
        $txt = str_replace('line',$lines,$DiffAddFmt[$match[4]]);
        $FmtV['$DiffLines'] = $count;
        $html .= FmtPageName($txt,$pagename);
        if ($DiffShow['source']=='y') 
          $html .= "<div class='diffmarkup'>"
            .$DiffRenderSourceFunction($in, $out, 1)
            ."</div>";
        else $html .= MarkupToHTML($pagename,
          preg_replace_callback('/\\(:.*?:\\)/',"cb_diffhtml",join("\n",$out)));
      }
      $html .= FmtPageName($DiffEndDelAddFmt,$pagename);
    }
    $in=array(); $out=array(); $dtype=$d;
  }
  return $html;
}
function cb_diffhtml($m) { return Keep(PHSC($m[0])); }

function HandleDiff($pagename, $auth='read') {
  if (@$_GET['fmt'] == 'rclist') return HandleDiffList($pagename, $auth);
  global $HandleDiffFmt, $PageStartFmt, $PageDiffFmt, $PageEndFmt;
  $page = RetrieveAuthPage($pagename, $auth, true, READPAGE_CURRENT);
  if (!$page) { Abort("?cannot diff $pagename"); }
  PCache($pagename, $page);
  SDV($HandleDiffFmt,array(&$PageStartFmt,
    &$PageDiffFmt,"<div id='wikidiff'>", 'function:PrintDiff', '</div>',
    &$PageEndFmt));
  PrintFmt($pagename,$HandleDiffFmt);
}

function HandleDiffList($pagename, $auth='read') {
  global $EnableDiffHidden, $Now, $Charset, $EnableLocalTimes, $EnableRCListLastEdit;
  $days = floor($EnableLocalTimes/10);
  if(!$days) $days = 3;
  $since = $Now - $days*24*3600;
  header("Content-Type: text/plain; charset=$Charset");
  $page = RetrieveAuthPage($pagename, $auth, false);
  if (!$page) {
    print("$Now:[No permissions to diff page]");
    exit;
  }
  krsort($page); reset($page);
  $out = "";
  $hide = IsEnabled($EnableDiffHidden, 0)? '' : '(?!hidden)';
  $list = preg_grep("/^diff:(\\d+):\\d+:$hide\\w*$/", array_keys($page));
  foreach($list as $v) {
    list($key, $stamp) = explode(':', $v);
    if ($stamp == $page['time'] && !IsEnabled($EnableRCListLastEdit, 0)) continue;
    $author = @$page["author:$stamp"] ? $page["author:$stamp"] : '?';
    $csum = strval(@$page["csum:$stamp"]);
    $out .= "$stamp:".PHSC("$author: $csum")."\n";
    if ($stamp<$since) break; # at least one after the 72 hours
  }
  print(trim($out));
  exit;
}

## Functions for simple word-diff (written by Petko Yotov)
function DiffRenderSource($in, $out, $which) {
  global $WordDiffFunction, $EnableDiffInline, $DiffPrepareInlineFunction;
  SDV($DiffPrepareInlineFunction, 'DiffPrepareInline');
  if (!IsEnabled($EnableDiffInline, 1)) {
    $a = $which? $out : $in;
    return str_replace("\n","<br />",PHSC(join("\n",$a)));  
  }
  $countdifflines = abs(count($in)-count($out));
  $lines = $cnt = $x2 = $y2 = array();
  foreach($in as $line) {
    $tmp = $DiffPrepareInlineFunction($line);
    if (!$which) $cnt[] = array(count($x2), count($tmp));
    $x2 = array_merge($x2, $tmp);
  }
  foreach($out as $line) {
    $tmp = $DiffPrepareInlineFunction($line);
    if ($which) $cnt[] = array(count($y2), count($tmp));
    $y2 = array_merge($y2, $tmp);
  }
  $z = $WordDiffFunction(implode("\n", $x2), implode("\n", $y2));
  
  array_unshift($x2, '');
  array_unshift($y2, '');
  $z2 = array_map('PHSC', ($which? $y2 : $x2));
  foreach (explode("\n", $z) as $zz) {
    if (preg_match('/^(\\d+)(,(\\d+))?([adc])(\\d+)(,(\\d+))?/',$zz,$m)) {
      $a1 = $a2 = $m[1];
      if (@$m[3]) $a2=$m[3];
      $b1 = $b2 = $m[5];
      if (@$m[7]) $b2=$m[7];

      if (!$which && ($m[4]=='c'||$m[4]=='d')) {
        $z2[$a1] = '<del>'. $z2[$a1];
        $z2[$a2] .= '</del>';
      }
      if ($which && ($m[4]=='c'||$m[4]=='a')) {
        $z2[$b1] = '<ins>'.$z2[$b1];
        $z2[$b2] .= '</ins>';
      }
      if ($m[4]=='c') {
        $xx = PHSC(strval(@$x2[$a1]));
        $yy = PHSC(strval(@$y2[$b1]));
        $tmp = "<del>$xx<ins>$yy";
        if (preg_match("/^<del>([\x09\x20-\x7e]+).*<ins>\\1/", $tmp, $m)) {
          if(!$which && @$z2[$a1]) $z2[$a1] = $m[1] . "<del>" . substr($z2[$a1], strlen($m[1])+5);
          if($which && @$z2[$b1]) $z2[$b1] = $m[1] . "<ins>" . substr($z2[$b1], strlen($m[1])+5);
        }
      }
    }
  }
  $line = array_shift($z2);
  $z2[0] = $line.@$z2[0];
  foreach ($cnt as $a) $lines[] = implode('', array_slice($z2, $a[0], $a[1]));
  $ret = implode("\n", $lines);
  $ret = str_replace(array('</del> <del>', '</ins> <ins>'), ' ', $ret);
  $ret = preg_replace('/(<(ins|del)>|^) /', '$1&nbsp;', $ret);
  $ret = preg_replace_callback('!<(ins|del)>(.*?)(</\\1>|$)!s', 'cb_diffsplit', $ret);
  $ret = str_replace(array("  ", "\n ", "\n"),array("&nbsp; ", "<br />&nbsp;", "<br />"),$ret);
  return $ret;
}

## Keep closing tags on the same line they are opened
function cb_diffsplit($m) {
  $tag = $m[1];
  if ($m[2] === '') return '';
  if (strpos($m[2], "\n")===false) return "<$tag>{$m[2]}</$tag>";
  $lines = explode("\n", $m[2]);
  foreach ($lines as &$line) {
    if ($line === '') continue;
    $line = "<$tag>$line</$tag>";
  }
  return implode("\n", $lines);
}

## Split a line into pieces before passing it through `diff`
function DiffPrepareInline($x) {
  global $DiffSplitInlineDelims;
  SDV($DiffSplitInlineDelims, "-@!?#$%^&*()=+[]{}.'\"\\:|,<>_/;~");
  $quoted = preg_quote($DiffSplitInlineDelims, '/');
  preg_match_all("/^\\s+|[$quoted]|[^$quoted\\s]+\\s*|\\s+/", $x, $m);
  return $m[0];
}

SDV($WordDiffFunction, 'PHPDiff'); # faster than sysdiff for many calls
if (IsEnabled($EnableDiffInline, 1) && $DiffShow['source'] == 'y' 
  && $WordDiffFunction == 'PHPDiff' && !function_exists('PHPDiff'))
  include_once("$FarmD/scripts/phpdiff.php");

## Show diff before the preview Cookbook:PreviewChanges
function PreviewDiff($pagename,&$page,&$new) {
  global $FmtV, $DiffFunction, $DiffHTMLFunction, $EnableDiffInline, $DiffShow;
  if (!@$_REQUEST['preview'] || !isset($page['text'])) return;
  if ($page['text'] == $new['text']) {
    $diff = '<div class="diffadd">' . XL('No changes') . '</div>';
  }
  else {
    $d = IsEnabled($DiffShow['source'], 'y');
    $e = IsEnabled($EnableDiffInline, 1);
    $DiffShow['source'] = 'y';
    $EnableDiffInline = 1;
    SDV($DiffHTMLFunction, 'DiffHTML');
    $diff = $DiffFunction($new['text'], $page['text']);# reverse the diff
    $diff = $DiffHTMLFunction($pagename, $diff);
    $DiffShow['source'] = $d;
    $EnableDiffInline = $e;
  }
  $FmtV['$PreviewText'] = $diff .'<hr/>' . @$FmtV['$PreviewText'];
}
if (IsEnabled($EnablePreviewChanges, 0) && @$_REQUEST['preview']>'') {
  $EditFunctions[] = 'PreviewDiff';
}
