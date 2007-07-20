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
}

var taboo;

function taboo_init() {
  taboo = new Taboo();
}

window.addEventListener("load", taboo_init, true);

