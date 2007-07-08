function Tablets() {
  const CC = Components.classes;
  const CI = Components.interfaces;

  this.onclick = function() {
    alert('todo');
  }
}

var tablets;

function tablets_init() {
  tablets = new Tablets();
}

window.addEventListener("load", tablets_init, true);

