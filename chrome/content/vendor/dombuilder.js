/*
Copyright (c) 2006 Dan Webb

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
documentation files (the "Software"), to deal in the Software without restriction, including without limitation
the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software,
and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial
portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF
CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
IN THE SOFTWARE.
*/
DomBuilder = {
  apply : function(o, els) {
    o = o || {};
    els = (els || "p|div|span|strong|em|img|table|tr|td|th|thead|tbody|tfoot|pre|code|" +
             "h1|h2|h3|h4|h5|h6|ul|ol|li|form|input|textarea|legend|fieldset|" +
             "select|option|blockquote|cite|br|hr|dd|dl|dt|address|a|button|abbr|acronym|" +
             "script|link|style|bdo|ins|del|object|param|col|colgroup|optgroup|caption|" +
             "label|dfn|kbd|samp|var").split("|");
    var el, i=0;
    while (el = els[i++]) o[el.toUpperCase()] = DomBuilder.tagFunc(el);
    return o;
  },
  tagFunc : function(tag) {
    return function() {
      var a = arguments, at, ch; a.slice = [].slice; if (a.length>0) {
      if (a[0].nodeName || typeof a[0] == "string") ch = a;
      else { at = a[0]; ch = a.slice(1); } }
      return DomBuilder.elem(tag, at, ch);
    };
  },
  elem : function(e, a, c) {
    a = a || {}; c = c || [];
    var el = document.createElement(e);
    for (var i in a) {
      if (typeof a[i] != 'function') {
        el.setAttribute(i, a[i]);
      }
      else {
        el[i] = a[i];
      }
    }
    for (var i=0; i<c.length; i++) {
      if (typeof c[i] == 'string') c[i] = document.createTextNode(c[i]);
      el.appendChild(c[i]);
    }
    return el;
  }
};
