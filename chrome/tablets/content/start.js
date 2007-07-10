const CC = Components.classes;
const CI = Components.interfaces;
const SVC = CC['@oy/tablets;1'].getService(CI.oyITablets);

var ul = document.createElement('ul');

var enum = SVC.getTablets();
while (enum.hasMoreElements()) {
  var tab = enum.getNext();
  tab.QueryInterface(CI.oyITabletInfo);

  // this should be a custom xbl:
  (function (tab){ 
    var box = document.createElement('li');
    box.innerHTML = '<span class="delete"></span><span class="title">' +
      tab.title + '</span><span class="url">' +
      tab.url + '</span><img class="preview" src="' + tab.imageURL + '" />';

    box.onclick = function(event) {
      if (event.originalTarget.className == 'delete') {
        SVC.delete(tab.url);
        box.parentNode.removeChild(box);
      }
      else {
        openUILinkIn(tab.url, whereToOpenLink(event));
      }
    }

    ul.appendChild(box);
  })(tab);
}

document.body.appendChild(ul);
