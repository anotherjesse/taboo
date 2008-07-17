/*
+-----------------------------------------------------------------------+
| Copyright (c) 2007 David Hauenstein                                    |
| All rights reserved.                                                  |
|                                                                       |
| Redistribution and use in source and binary forms, with or without    |
| modification, are permitted provided that the following conditions    |
| are met:                                                              |
|                                                                       |
| o Redistributions of source code must retain the above copyright      |
|   notice, this list of conditions and the following disclaimer.       |
| o Redistributions in binary form must reproduce the above copyright   |
|   notice, this list of conditions and the following disclaimer in the |
|   documentation and/or other materials provided with the distribution.|
|                                                                       |
| THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS   |
| "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT     |
| LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR |
| A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT  |
| OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, |
| SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT      |
| LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, |
| DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY |
| THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT   |
| (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE |
| OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.  |
|                                                                       |
+-----------------------------------------------------------------------+
*/

/* $Id: jquery.inplace.js,v 0.9.9.2 2007/12/04 09:39:00 hauenstein Exp $ */

/**
  * jQuery inplace editor plugin.
  *
  * Created by: David Hauenstein
  * http://www.davehauenstein.com/blog/
  *
  *
  * Nate Wiger (http://www.dangerrabbit.com) added callbacks, exposed
  * more settings, added required values and "selected" options,
  * and enabled compatibility with jQuery.noConflict() mode.
  * Thanks to Joe and Vaska for helping me get this working on jQuery 1.1
  * Thanks to Pranav (http://www.startupdunia.com/) for finding a scope bug (0.9.4 release)
  * Thanks to Simon for finding some extraneous code (0.9.5 release)
  *
  *
  * @name  editInPlace
  * @type  jQuery
  * @param Hash    options                        additional options
  * @param String  options[field_type]            can be: text, textarea, select; default: text
  * @param String  options[textarea_cols]        number of columns textarea will have, if field_type is textarea; default: 25
  * @param String  options[textarea_rows]        number of rows textarea will have, if field_type is textarea; default: 10
  * @param String  options[bg_over]                background color of editable elements on HOVER
  * @param String  options[bg_out]                background color of editable elements on RESTORE from hover
  * @param String  options[default_text]            text to be used when element has no value
  * @param String  options[value_required]        if set to true, the element will not be saved unless a value is entered
  * @param String  options[element_id]            name of parameter holding element_id; default: element_id
  * @param String  options[update_value]        name of parameter holding update_value; default: update_value
  * @param String  options[save_button]            image button tag to use as "Save" button
  * @param String  options[cancel_button]        image button tag to use as "Cancel" button
  * @param String  options[callback]            call function instead of submitting to url
  *
  */

jQuery.fn.editInPlace = function(options) {

  //#######################################################################
  //DEFINE THE DEFAULT SETTINGS, SWITCH THEM WITH THE OPTIONS USER PROVIDES
  var settings = {
    field_type: "text",
    textarea_cols:  "25",
    textarea_rows:  "10",
    bg_over: "#ffc",
    bg_out:  "transparent",
    default_text:  "(Click here to add text)",
    value_required: null,
    element_id:    "element_id",
    update_value:  "update_value",
    save_button:   '<input type="submit" class="inplace_save" value="Save"/>',
    cancel_button: '<input type="submit" class="inplace_cancel" value="Cancel"/>',
    callback: null,
    success: null,
    error: function(request){
      alert("Failed to save value: " + request.responseText || 'Unspecified Error');
    }
  };

  if (options) {
    jQuery.extend(settings, options);
  }

  function escape_html(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;");
  };

  //#######################################################################
  //CREATE THE INPLACE EDITOR
  return this.each(function(){

    var element = jQuery(this);
    var value;
    var editing = false;
    var click_count = 0;

    element.bind('update', function(event, val) {
		   if (val == null || val == "") {
		     element.text(settings.default_text);
		   }
		   else {
		     element.text(val);
		   }
		 });

    element.bind('cancel', function() {
		   editing = false;
		   click_count = 0;

		   //put the original background color in
		   element.css("background", settings.bg_out);

		   //put back the original text
		   element.trigger('update', [value]);
		 });

    element.bind('save', function() {
		   editing = false;
		   click_count = 0;

		   //put the original background color in
		   element.css("background", settings.bg_out);

		   value = element.children('form').children('.inplace_field').val();
		   element.trigger('callback', [value]);
		   element.trigger('update', [value]);
		 });

    element.mouseover(function(){
      element.css("background", settings.bg_over);
    }).mouseout(function(){
      element.css("background", settings.bg_out);
    }).click(function(){
      click_count++;

      if (!editing) {

        editing = true;
	value = element.text();
	var buttons_code  = settings.save_button + ' ' + settings.cancel_button;

	// if html is our default text, clear it out to prevent saving accidentally
	// FIXME: I think original_html should be set to '' as well
	if (value == settings.default_text) element.text('');

	if (settings.field_type == "textarea") {

	  var use_field_type = '<textarea class="inplace_field" rows="' +
	    settings.textarea_rows +
            '" cols="' + settings.textarea_cols + '">' +
            escape_html(element.text()) +
            '</textarea>';
        }
	else if (settings.field_type == "text") {
	  var use_field_type = '<input type="text" class="inplace_field" value="' +
            escape_html(element.text()) + '" />';
        }

	//insert the new in place form after the element they click, then empty out the original element
	element.html('<form class="inplace_form" style="display: inline; margin: 0; padding: 0;">' +
	  use_field_type + ' ' + buttons_code + '</form>');

      }

      if (click_count == 1) {
        //set the focus to the new input element
        element.children("form").children(".inplace_field").focus().select();


	//HIT ESC KEY
	// FIXME: this is kinda evil since each inplace editor creation adds another binding
	$(document).keyup(function(event){
	  if (editing && event.keyCode == 27) {
	    element.trigger('cancel');
          }
	});

	//CLICK CANCEL BUTTON functionality
	element.children("form").children(".inplace_cancel").click(function() {
									      element.trigger('cancel');
									      return false;
									    });

        //CLICK SAVE BUTTON functionality
        element.children("form").children(".inplace_save").click(function(){
									    element.trigger('save');
									    return false;
									  });
      }
    });
  });
};
