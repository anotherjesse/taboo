var npDebug = true;
var log = null;
var $ = function(x) { return document.getElementById(x); }
var tboPrefs = null;

function Taboo() {
  const CC = Components.classes;
  const CI = Components.interfaces;
  const SVC = CC['@oy/taboo;1'].getService(CI.oyITaboo);

  this.onclick = function(event) {
    if (event.shiftKey) {
      this.show();
    }
    else {
      SVC.save(null);
    }
  }
  this.show = function() {
    openUILinkIn('chrome://taboo/content/start.xul', 'tab');
  }
  
  tboInstallInToolbar();
}

var taboo;

function taboo_init() {
  if (npDebug) {
    if (typeof(console)=="undefined") {
      var t = Components.classes['@mozilla.org/consoleservice;1'].getService(Components.interfaces.nsIConsoleService)
      log = function(x) { t.logStringMessage(x); }
    }
    else {
      log = console.log;
    }
  }
  else {
    log = function(x) {};
  }
  tboPrefs = Cc['@mozilla.org/preferences-service;1'].getService(Ci.nsIPrefBranch);
  taboo = new Taboo();
}

window.addEventListener("load", taboo_init, true);

// Check whether we installed the toolbar button already and install if not
function tboInstallInToolbar() {
	// Make sure not to run this twice
	if (!tboPrefs.getPrefType("extensions.taboo.setup")) {
		if (!document.getElementById("taboo-toolbarbutton")) {
			var insertBeforeBtn = "urlbar-container";
			var toolbar = document.getElementById("nav-bar");
			if (!toolbar) {
				insertBeforeBtn = "button-junk";
				toolbar = document.getElementById("mail-bar");
			}
			if (toolbar && "insertItem" in toolbar) {
				var insertBefore = $(insertBeforeBtn);
				log(insertBefore);
				if (insertBefore && insertBefore.parentNode != toolbar)
					insertBefore = null;
	
				toolbar.insertItem("taboo-toolbarbutton", insertBefore, null, false);
	
				toolbar.setAttribute("currentset", toolbar.currentSet);
				document.persist(toolbar.id, "currentset");
			}
		}
		tboPrefs.setBoolPref("extensions.taboo.setup", true);
	}
}
