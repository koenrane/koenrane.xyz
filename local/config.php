<?php if (!defined('PmWiki')) exit();
##  This is a sample config.php file.  To use this file, copy it to
##  local/config.php, then edit it for whatever customizations you want.
##  Also, be sure to take a look at https://www.pmwiki.org/wiki/Cookbook
##  for more details on the customizations that can be added to PmWiki.

##  $WikiTitle is the name that appears in the browser's title bar.
$WikiTitle = 'Koen Rane';

##  $ScriptUrl is the URL for accessing wiki pages with a browser.
##  $PubDirUrl is the URL for the pub directory.
$ScriptUrl = 'https://koenrane.xyz/';
$PubDirUrl = 'https://koenrane.xyz/pub';

##  If you want to use URLs of the form .../pmwiki.php/Group/PageName
##  instead of .../pmwiki.php?p=Group.PageName, try setting
##  $EnablePathInfo below.  Note that this doesn't work in all environments,
##  it depends on your webserver and PHP configuration.  You might also
##  want to check https://www.pmwiki.org/wiki/Cookbook/CleanUrls more
##  details about this setting and other ways to create nicer-looking urls.
# $EnablePathInfo = 1;

##  $PageLogoUrl is the URL for a logo image -- you can change this
##  to your own logo if you wish.
$PageLogoUrl = "$PubDirUrl/skins/pmwiki/KoenRane.png";
#$PageLogoUrl = "/logo.png";
#$PageLogoUrlWidth = "50px";  // Adjust width as needed
#$PageLogoUrlHeight = "auto";  // Keeps aspect ratio



##  If you want to have a custom skin, then set $Skin to the name
##  of the directory (in pub/skins/) that contains your skin files.
##  See PmWiki.Skins and Cookbook.Skins.
$Skin = 'pmwiki-responsive';

##  You'll probably want to set an administrative password that you
##  can use to get into password-protected pages.  Also, by default
##  the "attr" passwords for the PmWiki and Main groups are locked, so
##  an admin password is a good way to unlock those.  See PmWiki.Passwords
##  and PmWiki.PasswordsAdmin.
$DefaultPasswords['admin'] = pmcrypt('3Razerosx1!');
$DefaultPasswords['edit'] = '@admin';
$DefaultPasswords['upload'] = '@admin';

##  Unicode (UTF-8) allows the display of all languages and all alphabets.
##  Highly recommended for new wikis.
include_once("scripts/xlpage-utf-8.php");

##  When installing a new wiki, if you expect to have a large number of
##  pages, per-group storage may be appropriate. For migrating existing 
##  wikis, see Cookbook:PerGroupSubDirectories
# $WikiDir = new PageStore('wiki.d/{$Group}/{$FullName}');

##  You can enable a number of functions improving your experience
##  editing and reviewing pages. This includes LocalTimes, PmSyntax, 
##  GUIButtons, TableOfContents and more, search the documentation 
##  for this variable:
# $EnableCommonEnhancements = 1;

##  PmWiki comes with graphical user interface buttons for editing;
##  to enable these buttons, set $EnableGUIButtons to 1.
##  (included in $EnableCommonEnhancements)
$EnableGUIButtons = 1;

##  You can enable syntax highlighting for the documentation and/or
##  for the edit form. 
##  (included in $EnableCommonEnhancements, or set to 0 to disable)
# $EnablePmSyntax = 1; # or 2, see documentation

##  For a basic table of contents, see page PmWiki/TableOfContents
##  (included in $EnableCommonEnhancements, or set to 0 to disable)
# $PmTOC['Enable'] = 1;

##  To enable markup syntax from the Creole common wiki markup language
##  (http://www.wikicreole.org/), include it here:
# $EnableCreole = 1;

##  Some sites may want leading spaces on markup lines to indicate
##  "preformatted text blocks", set $EnableWSPre=1 if you want to do
##  this.  Setting it to a higher number increases the number of
##  space characters required on a line to count as "preformatted text".
# $EnableWSPre = 1;   # lines beginning with space are preformatted (default)
# $EnableWSPre = 4;   # lines with 4 or more spaces are preformatted
# $EnableWSPre = 0;   # disabled

##  If you want uploads enabled on your system, set $EnableUpload=1.
##  You'll also need to set a default upload password, or else set
##  passwords on individual groups and pages.  For more information
##  see PmWiki.UploadsAdmin.
$EnableUpload = 1;
# $DefaultPasswords['upload'] = pmcrypt('secret');
$UploadPermAdd = 0; # Recommended for most new installations

##  Setting $EnableDiag turns on the ?action=diag and ?action=phpinfo
##  actions, which often helps others to remotely troubleshoot
##  various configuration and execution problems.
# $EnableDiag = 1;                         # enable remote diagnostics

##  By default, PmWiki doesn't allow browsers to cache pages.  Setting
##  $EnableIMSCaching=1; will re-enable browser caches in a somewhat
##  smart manner.  Note that you may want to have caching disabled while
##  adjusting configuration files or layout templates.
# $EnableIMSCaching = 1;                   # allow browser caching

##  Set $SpaceWikiWords if you want WikiWords to automatically
##  have spaces before each sequence of capital letters.
# $SpaceWikiWords = 1;                     # turn on WikiWord spacing

##  Set $EnableWikiWords if you want to allow WikiWord links.
##  For more options with WikiWords, see scripts/wikiwords.php .
# $EnableWikiWords = 1;                    # enable WikiWord links

##  By default, viewers are prevented from seeing the existence
##  of read-protected pages in search results and page listings,
##  but this can be slow as PmWiki has to check the permissions
##  of each page.  Setting $EnablePageListProtect to zero may
##  speed things up considerably, but it will also mean that
##  viewers may learn of the existence of read-protected pages.
##  (It does not enable them to access the contents of the pages.)
# $EnablePageListProtect = 0;

##  The refcount.php script enables ?action=refcount, which helps to
##  find missing and orphaned pages.  See PmWiki.RefCount.
# $EnableRefCount = 1;

##  You can enable ?action=rss, ?action=atom, ?action=rdf, and ?action=dc,
##  for generation of syndication feeds for Recent Changes pages.
# $EnableFeeds['rss'] = 1; # RSS 2.0

##  If you're running a publicly available site and allow anyone to
##  edit without requiring a password, you probably want to put some
##  blocklists in place to avoid wikispam.  See PmWiki.Blocklist.
# $EnableBlocklist = 1;                    # enable manual blocklists
# $EnableBlocklist = 10;                   # enable automatic blocklists

##  PmWiki allows a great deal of flexibility for creating custom markup.
##  To add support for '*bold*' and '~italic~' markup (the single quotes
##  are part of the markup), uncomment the following lines.
##  (See PmWiki.CustomMarkup and the Cookbook for details and examples.)
# Markup("'~", "<'''''", "/'~(.*?)~'/", "<i>$1</i>");        # '~italic~'
# Markup("'*", "<'''''", "/'\\*(.*?)\\*'/", "<b>$1</b>");    # '*bold*'

##  If you want to have to approve links to external sites before they
##  are turned into links, uncomment the line below.  See PmWiki.UrlApprovals.
##  Also, setting $UnapprovedLinkCountMax limits the number of unapproved
##  links that are allowed in a page (useful to control wikispam).
# $EnableUrlApprove = 1;
# $UnapprovedLinkCountMax = 10;

##  The following lines make additional editing buttons appear in the
##  edit page for subheadings, lists, tables, etc.
# $GUIButtons['h2'] = array(400, '\\n!! ', '\\n', '$[Heading]',
#                     '$GUIButtonDirUrlFmt/h2.gif"$[Heading]"');
# $GUIButtons['h3'] = array(402, '\\n!!! ', '\\n', '$[Subheading]',
#                     '$GUIButtonDirUrlFmt/h3.gif"$[Subheading]"');
# $GUIButtons['indent'] = array(500, '\\n->', '\\n', '$[Indented text]',
#                     '$GUIButtonDirUrlFmt/indent.gif"$[Indented text]"');
# $GUIButtons['outdent'] = array(510, '\\n-<', '\\n', '$[Hanging indent]',
#                     '$GUIButtonDirUrlFmt/outdent.gif"$[Hanging indent]"');
# $GUIButtons['ol'] = array(520, '\\n# ', '\\n', '$[Ordered list]',
#                     '$GUIButtonDirUrlFmt/ol.gif"$[Ordered (numbered) list]"');
# $GUIButtons['ul'] = array(530, '\\n* ', '\\n', '$[Unordered list]',
#                     '$GUIButtonDirUrlFmt/ul.gif"$[Unordered (bullet) list]"');
# $GUIButtons['hr'] = array(540, '\\n----\\n', '', '',
#                     '$GUIButtonDirUrlFmt/hr.gif"$[Horizontal rule]"');
# $GUIButtons['table'] = array(600,
#                       '||border=1 width=80%\\n||!Hdr ||!Hdr ||!Hdr ||\\n||     ||     ||     ||\\n||     ||     ||     ||\\n', '', '',
#                     '$GUIButtonDirUrlFmt/table.gif"$[Table]"');
