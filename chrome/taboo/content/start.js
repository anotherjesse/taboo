const CC = Components.classes;
const CI = Components.interfaces;
const SVC = CC['@oy/taboo;1'].getService(CI.oyITaboo);

var ul = document.createElement('ul');

var enum = SVC.get(null);
while (enum.hasMoreElements()) {
  var tab = enum.getNext();
  tab.QueryInterface(CI.oyITabooInfo);

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
        SVC.open(tab.url, whereToOpenLink(event));
      }
    }

    ul.appendChild(box);
  })(tab);
}

document.body.appendChild(ul);
