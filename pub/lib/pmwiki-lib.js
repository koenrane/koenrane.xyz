/*
  PmLib: JavaScript utility library for PmWiki
  (c) 2009-2025 Petko Yotov www.pmwiki.org/petko
  Licensed GNU GPLv2 or any more recent version released by the FSF.
  
  These helper functions can be reused by recipes / extensions.
  
  Those that are needed can be imported in a wrapper function via:
  
  const { echo, err, Now, qs, qsa, dqs, dqsa, ue, PHSC, ga, sa, sp, dce, 
    css, setStyles, min, max, minmax, ceil, floor, rnd, pf, floatval, intval,
    zpad, getLS, setLS, delLS, jP, jS, getConf, aE, rE, dE, dCE, tap, 
    adjany, adjbb, adjbe, adjab, adjae, posy, isVisible, isHidden, 
    gcs, gbcr, preferdark, fe4j, fe4b, fe4t, fe4, fe4p, ready } = PmLib;
  
  For readability, import only those that you actually use.
*/

var PmLib = {};

PmLib.echo = console.log;
PmLib.err = console.error;
PmLib.Now = new Date();


// querySelector
PmLib.qs = function(par, str)  { return par.querySelector(str); };
PmLib.qsa = function(par, str)  { return par.querySelectorAll(str); };
PmLib.dqs = function(str)  { return PmLib.qs(document, str); };
PmLib.dqsa = function(str) { return PmLib.qsa(document, str); };

// url-encode, htmlspecialchars
PmLib.ue = function(x) { return encodeURIComponent(x); };
PmLib.PHSC = function(x) { // not quotes?
  return x.replace(/[&]/g, '&amp;').replace(/[<]/g, '&lt;').replace(/[>]/g, '&gt;'); 
};

// get/set attributes
PmLib.ga = function(el, attr) { return el.getAttribute(attr); };
PmLib.sa = function(el, attr) { 
  for(var i in attr) if(attr.hasOwnProperty(i)) el.setAttribute(i, attr[i]);
};

// set properties
PmLib.sp = function(el, prop) { 
  for(var i in prop) if(prop.hasOwnProperty(i)) el[i] = prop[i];
};
// document.createElement
PmLib.dce = function(tag, prop, attr)  { 
  var el = document.createElement(tag);
  if(prop) PmLib.sp(el, prop);
  if(attr) PmLib.sa(el, attr);
  return el;
};

// set CSS, obj looks like { color: "red" }
PmLib.css = PmLib.setStyles = function (el, obj) { PmLib.sp(el.style, obj); };

// Math
PmLib.min = Math.min;
PmLib.max = Math.max;
PmLib.minmax = function(n, min, max) {
  var m = n;
  if(min != null) m = Math.max(m, min);
  if(max != null) m = Math.min(m, max);
  return m;
};
PmLib.ceil = Math.ceil;
PmLib.floor = Math.floor;
PmLib.rnd = function(n, precision = 0) {
  var x = Math.pow(10, precision);
  return Math.round(n*x)/x;
};
PmLib.pf = parseFloat; // may return NaN
PmLib.floatval = function(x) {var y = parseFloat(x); return isNaN(y)? 0:y; };
PmLib.intval   = function(x) {var y = parseInt(x); return isNaN(y)? 0:y; };
PmLib.zpad     = function(num, len = 2) { // zero-pad (for date/time)
  return num.toString().padStart(len, '0');
};


// localStorage
PmLib.getLS = function(key, dflt, parse) {
  try {
    var x = window.localStorage.getItem(key);
    if (dflt && x===null) return dflt;
    return parse ? PmLib.jP(x, dflt) : x;
  }
  catch(e) {
    return null;
  }
};
PmLib.setLS = function(key, value) {
  if (typeof value == 'object') value = JSON.stringify(value);
  try {
    window.localStorage.setItem(key, value);
  }
  catch(e) {}
};
PmLib.delLS = function(key) {
  if(! window.localStorage) return;
  try {
    window.localStorage.removeItem(key);
  }
  catch(e) {}
};

// JSON helpers
PmLib.jP = function(x, dflt = null) { try{ var y = JSON.parse(x); return y; } catch(e){ return dflt;} };
PmLib.jS = function(obj, space = 0) { return JSON.stringify(obj, null, space); };
PmLib.getConf = function(el) {
  return PmLib.jP(el.dataset.config, {});
};


// Events
PmLib.aE = function(el, ev, fn) { // addEventListener
  if(typeof el == 'string') el = PmLib.dqsa(el);
  else if(el instanceof Element) el = [el];
  var evs = ev.split(/[,\s]+/g);
  for(var elem of el) {
    for(var e of evs) {
      elem.addEventListener(e, fn, false);
    }
  }
};
PmLib.rE = function (el, ev, fn) { // removeEventListener
  if(typeof el == 'string') el = PmLib.dqsa(el);
  else if(el instanceof Element) el = [el];
  var evs = ev.split(/[,\s]+/g);
  for(var elem of el) {
    for(var e of evs) {
      elem.removeEventListener(e, fn, false);
    }
  }
};
PmLib.dE = function(el, name, options) { // dispatchEvent
  var ev = options? new Event(name, options) : new Event(name);
  el.dispatchEvent(ev);
};
PmLib.dCE = function(el, name, detail) { // custom event
  var ev = detail? new Event(name, {detail:detail}) : new Event(name);
  el.dispatchEvent(ev);
};
// onclick
PmLib.tap = function(q, fn) { PmLib.aE(q, 'click', fn); };



// DOM helpers

PmLib.adjany = function(el, where, what) { // insert adjacent things
  if(typeof el == 'string') el = dqs(el);
  if(what instanceof Element) el.insertAdjacentElement(where, what);
  else el.insertAdjacentHTML(where, what);
};
PmLib.adjbb = function(el, what) { PmLib.adjany(el, 'beforebegin', what); };
PmLib.adjbe = function(el, what) { PmLib.adjany(el, 'beforeend',   what); };
PmLib.adjab = function(el, what) { PmLib.adjany(el, 'afterbegin',  what); };
PmLib.adjae = function(el, what) { PmLib.adjany(el, 'afterend',    what); };

PmLib.posy = function(el) {
  var top = 0;
  if (el.offsetParent) {
    do {
      top += el.offsetTop;
    } while (el = el.offsetParent);
  }
  return top;
};

PmLib.isVisible = function(el) {
  return !PmLib.isHidden(el);
};
PmLib.isHidden = function(el) {
  if(!el) return true;
  var cs = PmLib.gcs(el);
  if(cs.position == 'fixed') return (cs.display === "none"); // Firefox != Chrome
  return (el.offsetParent === null);
};

PmLib.gcs = function(el, prop) {
  var s = window.getComputedStyle(el);
  if(prop) return s.getPropertyValue(prop);
  return s;
};

PmLib.gbcr = function(el) { return el.getBoundingClientRect(); }

// browser prefers dark theme
PmLib.preferdark = function() {
  if(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
    return 1;
  return 0;
};


// Ajax / Fetch functions json, blob, text
PmLib.fe4j = function(url, opt, fn) {
  return PmLib.fe4('json', url, opt, fn);
};
PmLib.fe4b = function(url, opt, fn) {
  return PmLib.fe4('blob', url, opt, fn);
};
PmLib.fe4t = function(url, opt, fn) {
  return PmLib.fe4('text', url, opt, fn);
};
PmLib.fe4 = function(rtype, url, opt, fn) {
  if(!rtype || !url) return;
  if(typeof opt == "function") {
    fn = opt; opt = {};
  }
  else if (opt == 'post' || opt == 'head') {
    opt = { method: opt };
  }
  fetch(url, opt).then(function(r){
    if(! r.ok) return null;
    else if(rtype == 'text') return r.text();
    else if(rtype == 'json') return r.json();
    else if(rtype == 'blob') return r.blob();
  }).then(fn).catch(function(e){PmLib.err({fe4error:e});fn(null);});
};
// Post fetch helper
PmLib.fe4p = function(rtype, url, data, fn) {
  var form = new FormData;
  for(var i in data) if (data.hasOwnProperty(i)) form.append(i, data[i]);
  PmLib.fe4(rtype, url, {
    method: 'post',
    body: form
    }, fn);
};

// call a function after loading the DOM
PmLib.ready = function(fn) {
  if( document.readyState !== 'loading' ) fn();
  else window.addEventListener('DOMContentLoaded', fn);
};
