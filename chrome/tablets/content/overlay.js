function Tablets() {
  const CC = Components.classes;
  const CI = Components.interfaces;
  const SVC = CC['@oy/tablets;1'].getService(CI.oyITablets);

  this.onclick = function(event) {
    SVC.save(getBrowser().mCurrentTab, null);
  }
}

var tablets;

function tablets_init() {
  tablets = new Tablets();
}

window.addEventListener("load", tablets_init, true);

