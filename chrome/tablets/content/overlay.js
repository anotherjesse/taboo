function Tablets() {
  const CC = Components.classes;
  const CI = Components.interfaces;
  const SVC = CC['@oy/tablets;1'].getService(CI.oyITablets);

  this.onclick = function() {
    var enum = SVC.getTablets();
    while (enum.hasMoreElements()) {
      var tab = enum.getNext();
      tab.QueryInterface(Ci.oyITabletInfo);
      alert(tab.title);
    }
  }
}

var tablets;

function tablets_init() {
  tablets = new Tablets();
}

window.addEventListener("load", tablets_init, true);

