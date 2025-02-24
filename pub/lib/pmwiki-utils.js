/*
  JavaScript utilities for PmWiki
  (c) 2009-2024 Petko Yotov www.pmwiki.org/petko
  based on PmWiki addons DeObMail, AutoTOC and Ape
  licensed GNU GPLv2 or any more recent version released by the FSF.

  libsortable() "Sortable tables" adapted for PmWiki from
  a Public Domain event listener by github.com/tofsjonas
*/



(async function(__script__){
  
  const { Now, echo, err, aE, qsa, dqs, dqsa, dce, tap, floatval, 
    zpad, PHSC, getConf, posy, adjany, adjbb, adjbe, adjab, adjae,
    gcs, css, getLS, setLS, delLS, ready } = PmLib;
  var Config = getConf(__script__);
  
  if(Config.rediquiet) {
    var url = location.href.replace(/\?from=[^?&#]*[&]quiet=1/, '');
    if(url != location.href) 
      history.replaceState(null, null, url);
  }
  
  
  
  var wikitext;

  function PmXMail() {
    var els = document.querySelectorAll('span._pmXmail');
    var LinkFmt = '<a href="%u" class="mail">%t</a>';

    for(var i=0; i<els.length; i++) {
      var x = els[i].querySelector('span._t');
      var txt = cb_mail(x.innerHTML);
      var y = els[i].querySelector('span._m');
      var url = cb_mail(y.innerHTML.replace(/^ *-&gt; */, ''));

      if(!url) url = 'mailto:'+txt.replace(/^mailto:/, '');

      url = url.replace(/"/g, '%22').replace(/'/g, '%27');
      var html = LinkFmt.replace(/%u/g, url).replace(/%t/g, txt);
      els[i].innerHTML = html;
    }
  }
  function cb_mail(x){
    return x.replace( /<span class=(['"]?)_d\1>[^<]+<\/span>/ig, '.')
      .replace( /<span class=(['"]?)_a\1>[^<]+<\/span>/ig, '@');
  }

  function is_toc_heading(el) {
    if(el.offsetParent === null) {return false;}  // hidden
    if(el.closest('.notoc,.markup2')) {return false;} 
    return true;
  }
  
  function any_id(h) {
    if(h.id) {return h.id;} // %id=anchor%
    var a = h.querySelector('a[id]'); // inline [[#anchor]]
    if(a && a.id) {return a.id;}
    var prev = h.previousElementSibling;
    if(prev) { // [[#anchor]] before !!heading
      var a = prev.querySelectorAll('a[id]');
      if(a.length) {
        last = a[a.length-1];
        if(last.id && ! last.nextElementSibling) {
          var atop = posy(last) + last.offsetHeight;
          var htop = posy(h);
          if( Math.abs(htop-atop)<20 ) {
            h.appendChild(last);
            return last.id;
          }
        }
      }
    }
    return false;
  }

  function autotoc() {
    if(dqs('.noPmTOC')) { return; } // (:notoc:) in page
    var dtoc = Config.pmtoc;
    if(! dtoc.Enable || !dtoc.MaxLevel) { return; } // disabled

    if(dtoc.NumberedHeadings)  {
      var specs = dtoc.NumberedHeadings.toString().split(/\./g);
      for(var i=0; i<specs.length; i++) {
        if(specs[i].match(/^[1AI]$/i)) numheadspec[i] = specs[i];
      }
    }

    var query = [];
    for(var i=1; i<=dtoc.MaxLevel; i++) {
      query.push('h'+i);
    }
    if(dtoc.EnableQMarkup) query.push('p.question');
    var pageheadings = wikitext.querySelectorAll(query.join(','));
    if(!pageheadings.length) { return; }

    var toc_headings = [ ];
    var minlevel = 1000, hcache = [ ];
    for(var i=0; i<pageheadings.length; i++) {
      var h = pageheadings[i];
      if(! is_toc_heading(h)) {continue;}
      toc_headings.push(h);
    }
    if(! toc_headings.length) return;

    var tocdiv = dqs('.PmTOCdiv');
    var shouldmaketoc = ( tocdiv || (toc_headings.length >= dtoc.MinNumber && dtoc.MinNumber != -1)) ? 1:0;
    if(!dtoc.NumberedHeadings && !shouldmaketoc) return;

    for(var i=0; i<toc_headings.length; i++) {
      var h = toc_headings[i];
      var level = floatval(h.tagName.substring(1));
      if(! level) level = 6;
      minlevel = Math.min(minlevel, level);
      var id = any_id(h);
      hcache.push([h, level, id]);
    }

    prevlevel = 0;
    var html = '';
    var toclinks = [];
    for(var i=0; i<hcache.length; i++) {
      var hc = hcache[i];
      var actual_level = hc[1] - minlevel;

      var currnb = numberheadings(actual_level);
      if(! hc[2]) {
        hc[2] = 'toc-'+currnb.replace(/\.+$/g, '');
        hc[0].id = hc[2];
      }
      if(dtoc.NumberedHeadings && currnb.length) adjab(hc[0], currnb+' ');

      if(! shouldmaketoc) { continue; }
      var txt = hc[0].textContent.trim().replace(/</g, '&lt;');
      var sectionedit = hc[0].querySelector('.sectionedit');
      if(sectionedit) {
        var selength = sectionedit.textContent.length;
        txt = txt.slice(0, -selength);
      }
      
      var a = dce('a', {
        className:'pmtoc-indent' + actual_level,
        href: '#' + hc[2],
        textContent: txt
      });
      toclinks.push(a);
      if(dtoc.EnableBacklinks) 
        adjbe(hc[0], '<a class="back-arrow" href="#_toc"></a>');
    }

    if(! shouldmaketoc) return;
 
    var details = dce('details', {
      id: '_toc',
      className: 'PmTOCdiv frame'
    });
    if(! getLS('closeTOC')) details.open = true;
 
    var sum = dce('summary', {textContent: dtoc.contents});
    details.appendChild(sum);
    
    var nav = dce('nav', { className:'PmTOCtable' });
    
    for(var a of toclinks) nav.appendChild(a);
    
    details.appendChild(nav);

    if(tocdiv) {
      adjbb(tocdiv, details);
      tocdiv.remove();
    }
    else {
      if(dtoc.ParentElement && dqs(dtoc.ParentElement)) {
        adjab(dqs(dtoc.ParentElement), details);
      }
      else {
        var x1 = hcache[0][0];
        var x0 = x1.previousElementSibling;
        if(x0 && x0.matches('.sectionedit.sectionhead')) x1 = x0;
        adjbb(x1, details);
      }
    }
    
    aE(details, 'toggle', function(e){
      setLS('closeTOC', this.open ? '' : 1);
    });

    var hh = location.hash;
    if(hh.length>1) {
      var cc = document.getElementById(hh.substring(1));
      if(cc) cc.scrollIntoView();
    }
  }

  var numhead = [0, 0, 0, 0, 0, 0, 0];
  var numheadspec = '1 1 1 1 1 1 1'.split(/ /g);
  function numhead_alpha(n, upper) {
    if(!n) return '_';
    var alpha = '', mod, start = upper=='A' ? 65 : 97;
    while (n>0) {
      mod = (n-1)%26;
      alpha = String.fromCharCode(start + mod) + '' + alpha;
      n = (n-mod)/26 | 0;
    }
    return alpha;
  }
  function numhead_roman(n, upper) {
    if(!n) return '_';
    // partially based on http://blog.stevenlevithan.com/?p=65#comment-16107
    var lst = [ [1000,'M'], [900,'CM'], [500,'D'], [400,'CD'], [100,'C'], [90,'XC'],
      [50,'L'], [40,'XL'], [10,'X'], [9,'IX'], [5,'V'], [4,'IV'], [1,'I'] ];
    var roman = '';
    for(var i=0; i<lst.length; i++) {
      while(n>=lst[i][0]) {
        roman += lst[i][1];
        n -= lst[i][0];
      }
    }
    return (upper == 'I') ? roman : roman.toLowerCase();
  }

  function numberheadings(n) {
    if(n<numhead[6]) for(var j=numhead[6]; j>n; j--) numhead[j]=0;
    numhead[6]=n;
    numhead[n]++;
    var qq = '';
    for (var j=0; j<=n; j++) {
      var curr = numhead[j];
      var currspec = numheadspec[j];
      if(currspec.match(/a/i)) { curr = numhead_alpha(curr, currspec); }
      else if(currspec.match(/i/i)) { curr = numhead_roman(curr, currspec); }

      qq+=curr+".";
    }
    return qq;
  }

  function makesortable() {
    if(! floatval(Config.sortable)) return;
    var tables = dqsa('table.sortable,table.sortable-footer');
    for(var i=0; i<tables.length; i++) {
      var rows = tables[i].querySelectorAll('tr');
      // non-pmwiki-core table, already ready
      if(! tables[i].querySelector('thead')) {
        var thead = dce('thead');
        tables[i].insertBefore(thead, tables[i].firstChild);
        thead.appendChild(rows[0]);
      }
      var tbody = tables[i].querySelector('tbody');
      if(! tbody) {
        tbody = dce('tbody');
        tables[i].appendChild(tbody);
        for(var r=1; r<rows.length; r++) tbody.appendChild(rows[r]);
      }
      if(tables[i].className.match(/sortable-footer/)) {
        tables[i].classList.add('sortable');
        var tfoot = dce('tfoot');
        tables[i].appendChild(tfoot);
        tfoot.appendChild(rows[rows.length-1]);
      }
      mkdatasort(rows);
    }
    libsortable();
  }
  function mkdatasort(rows) {
    var hcells = rows[0].querySelectorAll('th,td');
    var specialsort = [], span;
    for(var i=0; i<hcells.length; i++) {
      sortspan = hcells[i].querySelector('.sort-number,.sort-number-us,.sort-date,.sort-time');
      specialsort[i] = sortspan? sortspan.className : false;
    }
    if(! specialsort.length) return;
    for(var i=1; i<rows.length; i++) {
      var cells = rows[i].querySelectorAll('td,th');
      var k = 0;
      for(var j=0; j<cells.length && j<specialsort.length; j++) {
        if(! specialsort[j]) continue;
        var t = cells[j].innerText, ds = '';
        if(specialsort[j] == 'sort-number-us') {ds = t.replace(/[^-.\d]+/g, ''); }
        else if(specialsort[j] == 'sort-number') {ds = t.replace(/[^-,\d]+/g, '').replace(/,/g, '.'); }
        else if(specialsort[j] == 'sort-date') {ds = new Date(t).getTime(); }
        else if(specialsort[j] == 'sort-time') {
          var time = cells[j].querySelector('time[datetime]');
          if(time) ds = time.getAttribute('datetime');
        }
        if(ds) cells[j].dataset.sort = ds;
      }
    }
  }
  function libsortable(){
    // adapted from Public Domain code by github.com/tofsjonas
    // updated to keep any event handlers in the table
    function getValue(obj) {
      obj = obj.cells[column_index];
      return obj.getAttribute('data-sort') || obj.innerText;
    }
    function reclassify(element, cname) {
      element.classList.remove('dir-u', 'dir-d');
      if(cname) element.classList.add(cname);
    }
    var column_index;
    document.addEventListener('click', function(e) {
      if(e.target.closest('a')) return; // links
      var element = e.target.closest('th');
      if (! element) return;
      var table = element.offsetParent;
      if (!table.classList.contains('sortable')) return;
                              
      var cells = element.parentNode.cells;
      for (var i = 0; i < cells.length; i++) {
        if (cells[i] === element) {
          column_index = i;
        } else {
          reclassify(cells[i], '');
        }
      }
      var cname = 'dir-d', reverse = false;
      if (element.classList.contains(cname)) {
        cname = 'dir-u';
        reverse = true;
      }
      reclassify(element, cname);
      var tbody = table.tBodies[0];
      var rows = [];
      for(var r=0; r<tbody.rows.length; r++) rows.push(tbody.rows[r]);
      
      rows.sort(function(x, y) {
        var a = getValue(reverse? y:x),
            b = getValue(reverse? x:y);
        var c = a.localeCompare(b, undefined, {numeric: true, sensitivity: 'base'}),
            d = a - b;
        return isNaN(d) ? c : d;
      });
      for (i = 0; i < rows.length; i++) {
        tbody.appendChild(rows[i]);
      }
    });
  }

  function copy_pre() {
    if(!navigator.clipboard) return;
    var copytext = Config.copycode
    if(!copytext) return;
    var pres = dqsa('#wikitext pre');
    var btn = "<span class='pmcopycode frame rfloat' title='"+PHSC(copytext)+"'></span>"
    for(var i=0; i<pres.length; i++) {
      adjab(pres[i], btn);
    }
    tap('.pmcopycode', function(e){
      var cc = this;
      var pre = cc.parentNode;
      var tc = pre.textContent;
      navigator.clipboard.writeText(tc);
      cc.classList.add('copied');
      setTimeout(function(){cc.classList.remove('copied');}, 3000);
    });
  }

  function highlight_pre() {
    if(!Config.highlight) return;
    if (typeof hljs == 'undefined') return;
    
    var x = dqsa('.highlight,.hlt');
    
    for(var i=0; i<x.length; i++) {
      if(x[i].className.match(/(^| )(pm|pmwiki)( |$)/)) { continue;} // core highlighter
      var pre = Array.from(x[i].querySelectorAll('pre,code'));
      var n = x[i].nextElementSibling;
      if (n && n.tagName == 'PRE') pre.push(n);
      for(var j=0; j<pre.length; j++) {
        pre[j].className += ' ' + x[i].className;
        var varlinks = pre[j].querySelectorAll('a.varlink');
        var vararray = {};
        for(var v=0; v<varlinks.length; v++) {
          vararray[varlinks[v].textContent] = varlinks[v].href;
        }
        
        if(pre[j].children) pre[j].textContent = pre[j].textContent;

        hljs.highlightElement(pre[j]);
        var hlvars = pre[j].querySelectorAll('span.hljs-variable');
        for(var v=0; v<hlvars.length; v++) {
          var hlvar = hlvars[v].textContent;
          if(vararray.hasOwnProperty(hlvar)) {
            hlvars[v].innerHTML = '<a class="varlink" href="'+vararray[hlvar]+'">'+hlvar+'</a>';
          }
        }
      }
    }
    var varlinks = dqsa('a.varlink code.varlink');
    for(i=0; i<varlinks.length; i++) varlinks[i].classList.add('hljs-variable');
  }
  
  var ltmode, daymonth, pagename;
  function fmtLocalTime(stamp) { // TODO: future dates
    var d = new Date(stamp*1000);
    var tooltip = PHSC(d.toLocaleString());
    if(ltmode == 2)
      return [tooltip];
    if(Now-d < 24*3600000) 
      return [zpad(d.getHours()) + ':'+ zpad(d.getMinutes()), tooltip];
    var D = zpad(d.getDate()), M = zpad(d.getMonth()+1);
    var thedate = daymonth.replace(/%d/, D).replace(/%m/, M);
    if(Now-d < 334*24*3600000) return [thedate, tooltip];
 
    if(ltmode == 1)
      return [thedate + '/' + d.getFullYear(), tooltip];
    
    if(ltmode == 3)
      return [M + "'" + zpad(d.getFullYear()%100), tooltip];
  }
  
  function localTimes() {
    ltmode = floatval(Config.localtimes);
    if(! ltmode) return;
    if(ltmode>=11) {
      var days = Math.floor(ltmode/10);
      ltmode = ltmode%10;
    }
    else var days = 3;
 
    pagename = Config.fullname;
    var seenstamp = getLS('seenstamp', {}, true);
    var previous = seenstamp[pagename];
    
    var times = dqsa('time[datetime]');

    daymonth =  new Date(2021, 11, 26, 17)
      .toLocaleDateString().match(/26.*12/)? '%d/%m': '%m/%d';
    
    var h72 = Now.getTime()/1000-days*24*3600;
    
    for(var i=0; i<times.length; i++) {
      var itemdate = new Date(times[i].dateTime);      
      var stamp = Math.floor(itemdate.getTime()/1000);
      
      var li = times[i].closest('li');
      if (!li || !li.innerHTML.match(/<\/a>  \. \. \. /)) {
        var x = fmtLocalTime(stamp);
        times[i].innerHTML = x[0];
        times[i].title = x[1] ? x[1]: itemdate.textContent;
        continue;
      }
      var link = li.querySelector('a');
      if(link.className.match(/createlinktext|wikilink|selflink/)) {
        var diff = link.href + '?action=diff#diff' + stamp;
        if(stamp >= h72) {
          var h = link.href + '?action=diff&fmt=rclist';
          adjbe(li, ' <input type="button" class="inputbutton rcplus" data-url="'+h+'" value="+">');
        }
      }
      // recent uploads, other? we want to know when the link becomes "visited"
      else diff = link.href + '#diff' + stamp; 
      times[i].innerHTML = '<a href="'+diff+'">'+times[i].innerHTML+'</a>';
    }

    var difflinks = dqsa('a[href*="#diff"]'), diffcnt = 0;
    for(var i=0; i<difflinks.length; i++) {
      var link = difflinks[i];
      if(link.hostname != location.hostname) continue;
      var a = link.href.match(/[#]diff(\d+)$/);
      if(!a) continue;
      diffcnt++;
      stamp = parseInt(a[1]);
      var x = fmtLocalTime(stamp);
      
      link.innerHTML = x[0];
      link.setAttribute('title', x[1] ? x[1]: link.textContent);
      
      var par = link.closest('li');
      if(!par) continue;
      par.insertBefore(link, par.firstChild);
      adjae(link, "&nbsp;&nbsp;");
      if(previous && stamp>previous) par.classList.add('rcnew');
    }
    if(!diffcnt) return;
    var pagetitle = dqs('#wikititle h1, h1.pagetitle');
    if(pagetitle) {
      var time = zpad(Now.getHours()) + ':'+ zpad(Now.getMinutes());
      adjbe(pagetitle, ' <span class="rcreload" title="Click to reload">'+time+'</span>');
      tap('.rcreload', function(){location.reload();});
    }
    aE('.rcnew', 'mouseup', function(e){
      if(e.which == 2) this.classList.remove('rcnew');
    });
    tap('.rcplus', function(e){
      var plus = this;
      if(plus.value == '-') {
        var outdents = qsa(plus.closest('li'), 'p.outdent');
        for(var o of outdents) o.remove();
        plus.value = "+";
        return;
      }
      css(plus, {width:gcs(plus, 'width')});
      plus.value = "~";
      plus.disabled = true;
      var basehref = plus.dataset.url.replace(/&fmt=rclist/, '#diff')
        .replace(/[&]/g, '&amp;');
      var fmt = '<p class="outdent"><a href="'+basehref+'%d" title="%T">%t</a> %s</p>\n';
      fetch(plus.dataset.url)
      .then(function(resp){return resp.text();})
      .then(function(text){
        var lines = text.split(/\n/g);
        var out = '';
        for(var i=0; i<lines.length; i++) {
          a = lines[i].match(/^(\d+):(.*)$/);
          if(!a) continue;
          var time = fmtLocalTime(floatval(a[1]));
          out += fmt.replace(/%d/, a[1]).replace(/%T/, time[1])
            .replace(/%t/, time[0]).replace(/%s/, a[2]);
        }
        if(out) {
          adjae(plus, out);
          plus.value = "-";
          plus.disabled = false;
        }
      })
      .catch(err);
    });
    if(dqs('form[name="authform"]') || location.href.match(/action=/)) return;
    seenstamp[pagename] = Math.floor(Now.getTime()/1000);
    setLS('seenstamp', seenstamp);
  }
  
  function confirmForms() {
    var forms = dqsa('form[data-pmconfirm]');
    aE('form[data-pmconfirm]', 'submit', function(e){
      if(!confirm(this.dataset.pmconfirm)) {
        e.preventDefault();
        e.stopPropagation();
      }
    });
    
    tap('button[data-pmconfirm],input[data-pmconfirm]', function(e){
      if(this.tagName == 'INPUT' && !this.type.match(/^(submit|reset|button)$/i)) return;
      if(!confirm(this.dataset.pmconfirm)) {
        e.preventDefault();
        e.stopPropagation();
      }
    });
  }
  
  function labelForms() {
    var elems = dqsa('input[type="color"][data-labelvalue="1"],input[type="range"][data-labelvalue="1"]');
    if(!elems.length) return;
    for(var el of elems) {
      var v = dce('var', {className: 'labelvalue'});
      v.dataset.value = el.value;
      adjae(el, v);
      el._labelvalue = v;
    }
    aE(elems, 'input', function(e) {
      this._labelvalue.dataset.value = this.value;
    });
  }
  
  function inittoggle() {
    var tnext = Config.toggle;
    if(! tnext) { return; }
    var x = dqsa(tnext);
    if(! x.length) return;
    for(var i=0; i<x.length; i++) togglenext(x[i]);
    tap(tnext, togglenext);
    tap('.pmtoggleall', toggleall);
  }
  function togglenext(z) {
    var el = z.type == 'click' ? this : z;
    var attr = el.dataset.pmtoggle=='closed' ? 'open' : 'closed';
    el.dataset.pmtoggle = attr;
  }
  function toggleall(){
    var curr = this.dataset.pmtoggleall;
    if(!curr) curr = 'closed';
    var toggles = dqsa('*[data-pmtoggle="'+curr+'"]');
    var next = curr=='closed' ? 'open' : 'closed';
    for(var i=0; i<toggles.length; i++) {
      toggles[i].dataset.pmtoggle = next;
    }
    var all = dqsa('.pmtoggleall');
    for(var i=0; i<all.length; i++) {
      all[i].dataset.pmtoggleall = next;
    }
  }
  
  var Dropzone = false;
  var UploadQueue = [];
  function init_dropzone(){
    if(!Config.updrop) return;
    var form = dqs('form[action$="action=postupload"], form[action$="action=edit"]');
    if(!form) return;
    Dropzone = dce('div', {className: "frame pmdropzone"});
    
    var label = dce('span', {textContent: Config.updrop.label});
    adjbe(label, '&nbsp;');
    Dropzone.appendChild(label);
    if(Config.updrop.areq) {
      var areq = form.querySelector('input[name="author"]')
      Dropzone.pmareq = areq;
    }
 
    adjab(form, Dropzone);
    aE(Dropzone, 'dragenter', dragenter);
    aE(Dropzone, 'dragover', dragenter);
    aE(Dropzone, 'dragleave', dragleave);
    aE(Dropzone, 'drop', dragdrop);
    tap(Dropzone, clickzone);
  }
  
  async function postUpload(file) {
    var url = Config.updrop.action;
    var f = new FormData;
    f.append('n', Config.fullname);
    f.append('action', 'postupload');
    f.append('uploadfile', file);
    f.append('pmdrop', 1);
    f.append(Config.updrop.token[0], Config.updrop.token[1]);
    if(Dropzone.pmareq) 
      f.append('author', Dropzone.pmareq.value);
    try {
      var response = await fetch(url, { method: 'POST', body: f });
      if (!response.ok) {
        var msg = `HTTP error! Status: ${response.status}`;
        throw new Error(msg);
        return { error: 1, msg: msg};
      }
      return await response.json();
    }
    catch(err) {
      throw new Error(err);
      return {error: 1, msg: 'Error posting form data: ' + err.message };
    }
  }
  
  async function processUploads() {
    while(true) {
      var a = dqs('.pmdropzone a.queued');
      if(!a) return;
      a.className = 'uploading';
      var result = await postUpload(a.pmfile);
      if(result.error) {
        a.className = 'error';
        a.title = result.msg;
      }
      else {
        a.className = 'success';
        a.href = result.href;
        a.textContent = result.uprname;
        a.title = result.msg;
        delete a.pmfile;
      }
    }
  }
  
  function clickzone(e){
    var a = e.target.closest('a');
    if(!a) return;
    e.preventDefault();
    e.stopPropagation();
    if(a.className.match(/uploading|queued|deleting/)) return;
    else if(a.className == 'success' && typeof insMarkup == 'function') {
      var pn = e.ctrlKey? Config.fullname + '/': '';
      var text = "Attach:"+pn+a.textContent;
      if(text.match(/\s/)) text = '[['+text+']]';
      insMarkup(function(x){
        if(x.length) return text;
        return {
          mtext: text,
          unselect: true
        };
      });
      return;
    }
    else if(a.className == 'error' || typeof insMarkup == 'undefined') {
      a.classList.add('deleting');
      setTimeout(function(){a.remove();}, 700);
      return;
    }
    // this shouldn't happen
  }
  
  function dragenter(e) {
    e.preventDefault();
    Dropzone.classList.add('over');
  }
  
  function dragleave(e) {
    e.preventDefault();    
    Dropzone.classList.remove('over');
  }
  
  async function dragdrop(e) {
    e.preventDefault();   
    Dropzone.classList.remove('over');
    if(Dropzone.pmareq) {
      var v = Dropzone.pmareq.value;
      if(!v.length) {
        appendUpload({size:-500,name:Config.updrop.areq});
        Dropzone.pmareq.focus();
        return;
      }
    }
    var files = event.dataTransfer.files;
    for (var i = 0; i < files.length; i++) appendUpload(files[i]);
    var pending = dqs('.pmdropzone a.uploading');
    if(!pending) await processUploads();
  }
  
  function appendUpload(file) {
    if(file.size==0) { return; }
    var sizes = Config.updrop.sizes;
    var ext = '';
    var m = file.name.match(/\.([^\.]+)$/);
    if(m) ext  = m[1].toLowerCase();

    var a = dce('a', {href: '#', textContent: file.name});
    
    if(file.size==-500) {
      a.className = 'error';
    }
    else if(typeof sizes[ext] == 'undefined') {
      a.className = 'error';
      a.title = Config.updrop.badtype.replace(/\#upext/, ext);
    }
    else if(file.size > sizes[ext]) {
      a.className = 'error';
      a.title = Config.updrop.toobig
        .replace(/\#upmax/, sizes[ext]).replace(/\#upext/, ext);
    }
    else {
      a.className = 'queued';
      a.pmfile = file;
    }
    Dropzone.appendChild(a);
  }
  
  function makeDraggable(par) {
    var children = par.children;
    if(children.length<2) return;
    for(var i=0; i<children.length; i++) {
      var child = children[i];
      child.draggable = true;
    }
    par.style.cursor = "move";
    aE(par, 'dragstart', function(e){ this.dragged_element = e.target; });
    aE(par, 'dragover', function(e){e.preventDefault();});
    aE(par, 'drop', function(e){
      var c = [...this.children], d = this.dragged_element, t = e.target;
      if(!d || d==t) return;
      var b = c.indexOf(t) < c.indexOf(d) ? t : t.nextSibling;
      this.insertBefore(d, b);
    });
  }
  function init_draggable() {
    var els = dqsa('.draggable');
    for(var el of els) makeDraggable(el);
  }
  
  ready(function(){
    wikitext = document.getElementById('wikitext');
    var fn = [autotoc, inittoggle, PmXMail, localTimes, 
      highlight_pre, copy_pre, 
      confirmForms, labelForms,
      init_dropzone, init_draggable];
    fn.forEach(function(a){a();});
    makesortable();    
  });

})(document.currentScript);

