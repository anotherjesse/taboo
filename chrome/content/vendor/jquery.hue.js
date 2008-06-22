jQuery.fn.hue = function(options) {

  var body = jQuery(document.body);

  var outerbox = $("<div class='hue-outer'><div class='hue'></div></div>");
  body.append(outerbox);
  var box = $('.hue', outerbox);

  var hide = function() {
    clearTimeout(timeout);
    body.trigger('hue.hide');
  };

  var timeout = null;

  var OVER_ITEM;
//    set to true onmouseover
//    set to false onmouseout, except when we are SHOWING

  var SHOWING;

  var special_hide = function() {
    hide();
    timeout = setTimeout(function() {
                           if (OVER_ITEM) {
                             SHOWING = true;
                             outerbox.show();
                           }
                         }, 500);
  };

  var mouseX, mouseY;

  body
    .mousemove(function(event) {
                 // Firefox 2 reports a mousemove when a new div
                 // gets added underneath the mouse

                 if (event.clientX == mouseX &&
                     event.clientY == mouseY) {
                   return;
                 }

                 mouseX = event.clientX;
                 mouseY = event.clientY;

                 special_hide();
               })
    .click(hide)
    .keypress(hide)
    .bind('hue.over',
          function(event, node, callback) {
            OVER_ITEM = true;
            box.empty();
            outerbox[0].onclick = null;
            box.append(node);
            outerbox[0].onclick = callback;
          })
    .bind('hue.out',
          function() {
            // deal with if we are showing or not
            OVER_ITEM = SHOWING || false;
          })
    .bind('hue.hide',
          function() {
            SHOWING = false;
            outerbox.hide();
          });

  hide();
};
