/*  Copyright 2004-2025 Patrick R. Michaud (pmichaud@pobox.com)
    This file is part of PmWiki; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published
    by the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.  See pmwiki.php for full details.

    This file provides JavaScript functions to support WYSIWYG-style
    editing.  The concepts are borrowed from the editor used in Wikipedia,
    but the code has been rewritten from scratch to integrate better with
    PHP and PmWiki's codebase.

    Script partly written by and maintained by Petko Yotov pmwiki.org/petko
*/

function insButton(mopen, mclose, mtext, mlabel, mkey) {
  if (mkey > '') { mkey = 'accesskey="' + mkey + '" ' }
  document.write("<a tabindex='-1' " + mkey + "onclick=\"insMarkup('"
    + mopen + "','"
    + mclose + "','"
    + mtext + "');\">"
    + mlabel + "</a>");
}

function insMarkup() {
  var func = false, tid='text', mopen = '', mclose = '', mtext = '', unselect = false;
  if (arguments[0] == 'FixSelectedURL') {
    func = FixSelectedURL;
  }
  else if (typeof arguments[0] == 'function') {
    var func = arguments[0];
    if(arguments.length > 1) tid = arguments[1];
    x = func('');
    if(typeof x == 'object') {
      if(x.mopen) mopen = x.mopen;
      if(x.mclose) mclose = x.mclose;
      if(x.mtext) mtext = x.mtext;
      if(x.unselect) unselect = x.unselect;
    }
    else {
      mtext = x;
    }
  }
  else if (arguments.length >= 3) {
    var mopen = arguments[0], mclose = arguments[1], mtext = arguments[2];
    if(arguments.length > 3) tid = arguments[3];
  }
  
  if(tid instanceof Element) var tarea = tid;
  else tarea = document.getElementById(tid);
  if (tarea.setSelectionRange > '') { // recent browsers
    var p0 = tarea.selectionStart;
    var p1 = tarea.selectionEnd;
    var top = tarea.scrollTop;
    var str = mtext;
    while (p1 > p0 && tarea.value.substring(p1-1, p1).match(/\s/)) {
      tarea.selectionEnd = --p1;
    }
    if (p1 > p0) {
      str = tarea.value.substring(p0, p1);
      if(func) str = func(str);
    }
    var cur0 = p0 + mopen.length;
    var cur1 = cur0 + str.length;
    
    if(document.execCommand) {
      tarea.focus();
      document.execCommand('insertText', false, mopen + str + mclose);
    }
    else {
      tarea.value = tarea.value.substring(0,p0)
        + mopen + str + mclose
        + tarea.value.substring(p1);
      tarea.focus();
    }
    tarea.selectionStart = unselect? cur1 : cur0;
    tarea.selectionEnd = cur1;
    tarea.scrollTop = top;
  } else if (document.selection) {
    var str = document.selection.createRange().text;
    tarea.focus();
    range = document.selection.createRange();
    if (str == '') {
      range.text = mopen + mtext + mclose;
      range.moveStart('character', -mclose.length - mtext.length );
      range.moveEnd('character', -mclose.length );
    } else {
      if (str.charAt(str.length - 1) == " ") {
        mclose = mclose + " ";
        str = str.substr(0, str.length - 1);
        if(func) str = func(str);
      }
      range.text = mopen + str + mclose;
    }
    if (!unselect) range.select();
  } else { tarea.value += mopen + mtext + mclose; }
  var evt = new Event('input');
  tarea.dispatchEvent(evt);
  return;
}

function FixSelectedURL(str) {
  var rx = new RegExp("[ <>\"{}|\\\\^`()\\[\\]']", 'g');
  str = str.replace(rx, function(a){
    return '%'+a.charCodeAt(0).toString(16); });
  return str;
}

window.addEventListener('DOMContentLoaded', function(){
  const {dqs, qsa, jP, aE, sa} = PmLib;
  newButtons();
  
  var NsForm = false;

  var sTop = dqs("#textScrollTop");
  var tarea = dqs('#text');
  if(sTop && tarea) {
    if(sTop.value) tarea.scrollTop = sTop.value;
    aE(sTop.form, 'submit', function(){
      sTop.value = tarea.scrollTop;
    });
  }

  var ensw = dqs('#EnableNotSavedWarning');
  if(ensw) {
    var NsMessage = ensw.value;
    NsForm = ensw.form;
    if(NsForm) {
      aE(NsForm, 'submit', function(e){
        NsMessage="";
      });
      window.onbeforeunload = function(ev) {
        if(NsMessage=="") {return;}
        if (typeof ev == "undefined") {ev = window.event;}
        if (tarea && tarea.codemirror) {tarea.codemirror.save();}

        var tx = qsa(NsForm, 'textarea, input[type="text"]');
        for(var i=0; i<tx.length; i++) {
          var el = tx[i];
          if(ensw.className.match(/\bpreview\b/) || el.value != el.defaultValue) {
            if (ev) {ev.returnValue = NsMessage;}
            return NsMessage;
          }
        }
      }
    }
  }
  var text = dqs('textarea#text');
  if(text && dqs('#EnableEditAutoText')) text.classList.add('autotext');
  aE('textarea.autotext', 'keydown', EditAutoText)
});

/*
 *  New GUI edit buttons, without inline JavaScript
 *  (c) 2025 Petko Yotov www.pmwiki.org/petko
 */
function newButtons(){
  const {dqs, jP, adjbe, tap, dce} = PmLib;
  
  var el = dqs('.GUIButtons');
  if(! el) return;
  
  function unxp(a) {
    if(typeof a == 'number') return a;
    if(typeof a == 'string')
      return a.replace(/\\n/g, '\n')
        .replace(/\\\\/g, '\\').replace(/%25/g, '%');
    var b = [];
    for(var i=0; i<a.length; i++) {
      b[i] = unxp(a[i]);
    }
    return b;
  }
  var buttons = unxp(jP(el.dataset.json, []));
  
  for(var i=0; i<buttons.length; i++) {
    var b = buttons[i];
    if(!b || !b.length) continue;
    var mopen=b[1], mclose=b[2], mtext=b[3], tag=b[4], mkey=b[5];
    if(tag.charAt(0) == '<') { 
      adjbe(el, tag);
      continue;
    }
    var x = tag.match(/^(.*\.(gif|jpg|png|webp|svg))("([^"]+)")?$/);
    if(x) {
      var title = x[4]? 'alt="'+x[4]+'" title="'+x[4]+'"' : '';
      tag = "<img src='"+x[1]+"' "+title+" />";
    }
    
    var attrs = { 
      tabindex: -1, 
      'data-mopen': mopen,
      'data-mclose': mclose,
      'data-mtext': mtext
    };
    if(mkey) attrs.accesskey = mkey;
    var a = dce('a', {
      innerHTML: tag,
      className: 'newbutton'
    }, attrs);
    el.appendChild(a);
  }
  tap('.GUIButtons a.newbutton', function(e){
    insMarkup(this.dataset.mopen, this.dataset.mclose, this.dataset.mtext);
  });
}

/*
 *  Edit helper for PmWiki
 *  (c) 2016-2025 Petko Yotov www.pmwiki.org/petko
 */
var AutoBrackets = PmLib.jP(document.currentScript.dataset.autobrackets, {});
function EditAutoText(e){
  var caret = this.selectionStart, endcaret = this.selectionEnd;
  if(typeof caret != 'number') return true; // old MSIE, sorry
  
  var content = this.value;
  
  if(document.execCommand) {
    var C=e.ctrlKey, A=e.altKey, S=e.shiftKey, k=e.key.toLowerCase();
    
    if(AutoBrackets[k]){
      e.preventDefault();
      return insMarkup(k, AutoBrackets[k], '', this);
    }
    
    // Ctrl+L (lowercase), Ctrl+Shift+L (uppercase)
    if((C && k === 'l') && caret != endcaret) {
      e.preventDefault();
      var sel = content.substring(caret, endcaret);
      sel = S? sel.toUpperCase(): sel.toLowerCase();
      document.execCommand('insertText', false, sel);
      this.selectionStart = caret;
      return;
    }
    
    // Ctrl+K - link/unlink - add or remove double brackets
    if(C && k === 'k') {
      e.preventDefault();
      var sel = content.substring(caret, endcaret);
      if(sel.match(/\[\[|\]\]/)) {
        sel = sel.replace(/\[\[|\]\]/g, '');
        document.execCommand('insertText', false, sel);
        this.selectionStart = caret;
      }
      else insMarkup('[[', ']]', '', this);
      return;
    }
    
    // Ctrl+B - bold - wrap in ''' ... '''
    if(C && k === 'b') {
      e.preventDefault();
      return insMarkup("'''", "'''", '', this);
    }
    
    // Ctrl+I - italics - wrap in '' ... ''
    if(C && k === 'i') {
      e.preventDefault();
      return insMarkup("''", "''", '', this);
    }
    
    // (Ctrl+Shift|Alt)+(ArrowUp|ArrowDown): swap lines
    if(((C && S) || A) && k.match(/^(arrow(up|down))$/)) {
      e.preventDefault();
      
      var before = content.slice(0, caret), 
        after = content.slice(endcaret), 
        sel = content.slice(caret, endcaret);
      var a = before.match(/[^\n]+$/);
      if(a) {
        sel = a[0]+sel;
        before = before.slice(0, -a[0].length);
      }
      a = after.match(/^[^\n]*(\n|$)/);
      sel = sel+a[0];
      after = after.slice(a[0].length);
      
      if(k == 'arrowup') {
        a = before.match(/[^\n]*\n$/);
        if(!a) return;
        var lineA = sel, lineB = a[0];
        var deltacaret = -lineB.length;
      }
      else if(k == 'arrowdown') {
        a = after.match(/^([^\n]+$|[^\n]*\n)/);
        if(!a) return;
        var lineA = a[0], lineB = sel;
        var deltacaret = lineA.length;
      }
      if(!lineA.match(/\n$/)) { // last line
        lineB = "\n" + lineB.slice(0, -1);
        if(deltacaret>0) deltacaret+=1;
      }
      var insert = lineA + lineB;
      this.selectionStart = before.length + Math.min(deltacaret,0);
      this.selectionEnd = this.selectionStart + insert.length;
      document.execCommand('insertText', false, insert);
      this.selectionStart = caret + deltacaret;
      this.selectionEnd = endcaret + deltacaret;
      return;
    }
  }
  
  
  if (k != "enter") return;

  var before = content.substring(0, caret).split(/\n/g);
  var after  = content.substring(endcaret);
  var currline = before[before.length-1];
  var linestartpos = content.lastIndexOf('\n', Math.max(0,caret-1));

  if(currline.match(/\\$/)) return true; // line ending with a \ backslash
                    
  var insert;
  if(C && S) {
    insert = "~~~~";
  }
  else if(C) {
    insert = "[[<<]]";
  }
  else if(S) {
    insert = "\\\\\n";
  }
  else {
    var m = currline.match(/^((?: *\*+| *\#+|-+[<>]|:+|\|\|| ) *)/);
    if(!m) return true;
                    
    if(currline==m[1] && (after === '' || after.charAt(0) == '\n')) {
      insert = "\n";
      if(linestartpos<0) {
        linestartpos = 0;
        this.selectionEnd += 1;
      }
      this.selectionStart = linestartpos;
      caret = caret - currline.length - 1;
      before = before.slice(0,-1); // if no execCommand
    }
    else {
      insert = "\n"+m[1];
    }
  }
  e.preventDefault();

  if(document.execCommand) {
    document.execCommand('insertText', false, insert);
  }
  else {
    content = before.join("\n") + insert + after;
    this.value = content;
  }
  
  this.selectionStart = caret + insert.length;
  this.selectionEnd = caret + insert.length;
  
  PmLib.dE(this, 'input');
  return false;
}

