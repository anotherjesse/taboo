const CC = Components.classes;
const CI = Components.interfaces;
const SVC = CC['@oy/tablets;1'].getService(CI.oyITablets);

var dList = document.getElementById('list');

var enum = SVC.getTablets();
while (enum.hasMoreElements()) {
  var tab = enum.getNext();
  tab.QueryInterface(CI.oyITabletInfo);

  // this should be a custom xbl:
  (function (tab){ 
    var box = document.createElement('vbox');
    var label = document.createElement('label');
    label.setAttribute('value', tab.title);
    box.appendChild(label);
    var label = document.createElement('label');
    label.setAttribute('value', tab.url);
    box.appendChild(label);
    var img = document.createElement('image');
    img.setAttribute('src', tab.imageURL);
    box.appendChild(img);

    box.onclick = function(event) {
      window.location.href = tab.url;
    }

    dList.appendChild(box);
  })(tab);
  
}

