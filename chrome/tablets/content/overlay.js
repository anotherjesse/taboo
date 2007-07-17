function Tablets() {
  const CC = Components.classes;
  const CI = Components.interfaces;
  const SVC = CC['@oy/tablets;1'].getService(CI.oyITablets);

  this.onclick = function(event) {
    if (event.shiftKey) {
      this.show();
    }
    else {
      SVC.save(null);
    }
  }
  this.show = function() {
    openUILinkIn('chrome://tablets/content/start.xul', 'tab');
  }
}

var tablets;

function tablets_init() {
  tablets = new Tablets();
}

window.addEventListener("load", tablets_init, true);

