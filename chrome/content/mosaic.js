function Mosaic(container) {
  document.body.className = 'mosaic';
  const SVG = "http://www.w3.org/2000/svg";
  const XLINK = "http://www.w3.org/1999/xlink";
  const hotspot = "rgba(0,200,200,0.3)";

  var currentTransform = null;

  var svg = document.createElementNS(SVG, "svg");
  svg.addEventListener("mousemove", onMouseMove, false);
  svg.addEventListener("mouseup", onMouseUp, false);
  container.appendChild(svg);
  
  // take the transforms saved on the element and turn them into
  // svg transform syntax
  function setupTransform(s) {
    var g = document.getElementById(s);
    var g2 = document.getElementById(s + "-overlay");

    g.setAttribute("transform", "translate(" + g.vTranslate[0] + "," + g.vTranslate[1] + ") " +
                   "scale(" + g.vScale + "," + g.vScale + ") " +
                   "rotate(" + g.vRotate + ") ");
  }
  
  function addCachedImg(url) {
    var img = new Image();

    // do some hackyness here to get the correct variables
    // to the function
    img.onload = function() {
      var g = addImage(url, 1.0);
      g.style.opacity = 1.0;
      g.vTranslate = [100 + Math.random() * 800,
                      100 + Math.random() * 800];
      var c = 0.25 + (Math.random() * .25);
      g.vScale = c; // 0.25; // 0.001;
      g.vRotate = (Math.random() * 40) - 20;

      setupTransform(g.id);
    }
    img.src = url;
  }

  // convenience function to set X, Y, width, and height attributes
  function svgSetXYWH(el, x, y, w, h) {
    el.setAttribute("x", x);
    el.setAttribute("y", y);
    el.setAttribute("width", w);
    el.setAttribute("height", h);
  }

  // create a new clickable rect [x,y,w,h] with the givenfill/stroke
  // with the given handler on mouse down
  function newClickableRect(id, x, y, w, h, fill, stroke, handler) {
    var p = document.createElementNS(SVG, "rect");
    p.setAttribute("id", id);
    svgSetXYWH(p, x, y, w, h);
    p.setAttribute("rx", 30);
    p.setAttribute("ry", 30);
    p.setAttribute("fill", fill);
    //p.setAttribute("stroke", stroke);
    //p.setAttribute("stroke-width", 10);
    p.addEventListener("mousedown", handler, false);
    return p;
  }

  // create all the elements for the given image URL.
  // this includes the toplevel group, the image itself,
  // and the clickable hotspots used for rotating the image.
  var nextImageId = 0;
  function addImage(url, initOpacity) {
      var imgw = 300;
      var imgh = 300;

      var id = nextImageId++;
      // if (id > 10) return;
      var s = "image" + id;
      var g = document.createElementNS(SVG, "g");
      g.setAttribute("id", s);
      g.addEventListener("mouseover", onEnterImage, false);
      g.addEventListener("mouseout", onExitImage, false);
      g.addEventListener("mousedown", function(evt) { startTransform(evt, "c", "move"); }, false);

      if (initOpacity != null)
          g.style.opacity = initOpacity;

      var image = document.createElementNS(SVG, "image");
      image.setAttribute("id", s+"-img");
      svgSetXYWH(image, -imgw/2, -imgh/2, imgw, imgh);
      image.setAttribute("preserveAspectRatio", "xMinYMin slice");
      image.setAttributeNS(XLINK, "href", url);
      g.appendChild(image);

      var rect = document.createElementNS(SVG, "rect");
      rect.setAttribute("id", s+"-border");
      svgSetXYWH(rect, -imgw/2, -imgh/2, imgw, imgh);
      rect.setAttribute("stroke", "black");
      rect.setAttribute("rx", "10");
      rect.setAttribute("ry", "10");
      rect.setAttribute("stroke-width", "4");
      rect.setAttribute("fill", "none");

      g.appendChild(rect);

      var g2 = document.createElementNS(SVG, "g");
      g2.setAttribute("id", s+"-overlay");
      g2.setAttribute("class", "image-overlay");
      g2.setAttribute("style", "visibility: hidden");

      var rsz = 50;

      g2.appendChild(newClickableRect(s+"-tl", -4-imgw/2, -4-imgh/2, rsz, rsz,
                                      hotspot, "rgba(100,100,100,0.5)",
                                      function (evt) { return startTransform(evt, 'tl', 'rotate'); }));
      g2.appendChild(newClickableRect(s+"-tr", 4+imgw/2-rsz, -4-imgh/2, rsz, rsz,
                                      hotspot, "rgba(100,100,100,0.5)",
                                      function (evt) { return startTransform(evt, 'tr', 'rotate'); }));
      g2.appendChild(newClickableRect(s+"-br", 4+imgw/2-rsz, 4+imgh/2-rsz, rsz, rsz,
                                      hotspot, "rgba(100,100,100,0.5)",
                                      function (evt) { return startTransform(evt, 'br', 'rotate'); }));
      g2.appendChild(newClickableRect(s+"-bl", -4-imgw/2, 4+imgh/2-rsz, rsz, rsz,
                                      hotspot, "rgba(100,100,100,0.5)",
                                      function (evt) { return startTransform(evt, 'bl', 'rotate'); }));

      g.appendChild(g2);

      svg.appendChild(g);

      return g;
  }

  function bringToFront(s) {
    var el = document.getElementById(s);

    el.parentNode.removeChild(el);
    svg.appendChild(el);
  }

  function baseName(ev) {
      var id = ev.target.getAttribute("id");
      return id.substr(0, id.indexOf("-"));
  }

  function onEnterImage(ev) {
      var e = baseName(ev);
      if (!e)
          return;
      document.getElementById(e + '-overlay').style.visibility = "visible";
  }

  function onExitImage(ev) {
      var e = baseName(ev);
      if (!e)
          return;
      document.getElementById(e + '-overlay').style.visibility = "hidden";
  }

  function startTransform(ev, corner, what) {
      // ignore if something else is already going on
      if (currentTransform != null)
          return;

      var e = baseName(ev);
      if (!e)
          return;

      bringToFront(e);
      var g = document.getElementById(e);

      currentTransform = { what: what, el: e, corner: corner, g: g,
                           s: g.vScale, r: g.vRotate, t: g.vTranslate,
                           x: ev.clientX, y: ev.clientY };
  }

  function onMouseUp(ev) {
      currentTransform = null;
  }

  function onMouseMove(ev) {
      if (currentTransform == null)
          return;

      var ex = ev.clientX;
      var ey = ev.clientY;
      var pos = currentTransform.g.vTranslate;

      if (currentTransform.what == "rotate") {
          var r2d = 360.0 / (2.0 * Math.PI);

          var lastAngle = Math.atan2(currentTransform.y - pos[1],
                                     currentTransform.x - pos[0]) * r2d;
          var curAngle = Math.atan2(ey - pos[1],
                                    ex - pos[0]) * r2d;

          currentTransform.g.vRotate += (curAngle - lastAngle);

          var lastLen = Math.sqrt(Math.pow(currentTransform.y - pos[1], 2) +
                                  Math.pow(currentTransform.x - pos[0], 2));
          var curLen = Math.sqrt(Math.pow(ey - pos[1], 2) +
                                 Math.pow(ex - pos[0], 2));

          currentTransform.g.vScale = currentTransform.g.vScale * (curLen / lastLen);

      } else if (currentTransform.what == "move") {
          var xd = ev.clientX - currentTransform.x;
          var yd = ev.clientY - currentTransform.y;

          currentTransform.g.vTranslate = [ pos[0] + xd, pos[1] + yd ];
      }

      currentTransform.x = ex;
      currentTransform.y = ey;

      setupTransform(currentTransform.el);
  }


  this.start = function() {
    while (svg.hasChildNodes()) {
      svg.removeChild(svg.childNodes[0]);
    }
    nextImageId = 0;
  };
  this.add = function(tab) {
    if (nextImageId > 25) return;
    addCachedImg(tab.thumbURL);
  };
  this.finish = function() {};
}
