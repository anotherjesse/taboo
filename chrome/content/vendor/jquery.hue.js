jQuery.fn.hue = function(options) {

  var body = jQuery(document.body);

  var box = $("<div class='hue'>hello world</div>");
  body.append(box);

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
			     box.show();
			   }
			 }, 800);
  };

  body
    .mousemove(special_hide)
    .click(hide)
    .keypress(hide)
    .bind('hue.over',
	  function(event, val) {
	    OVER_ITEM = true;
	    box.html(val);
	  })
    .bind('hue.out',
	  function() {
	    // deal with if we are showing or not
	    OVER_ITEM = SHOWING || false;
	  })
    .bind('hue.hide',
	  function() {
	    SHOWING = false;
	    box.hide();
	  });
};