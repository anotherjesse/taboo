function Tablets() {
  const CC = Components.classes;
  const CI = Components.interfaces;

  const svc = CC['@oy/tablets;1'].getService(CI.oyITablets);

  this.onclick = function() {
    alert(svc);
  }
}

var tablets;

function tablets_init() {
  tablets = new Tablets();
}

window.addEventListener("load", tablets_init, true);

