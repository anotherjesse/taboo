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
    box.innerHTML = '<div title="'+tab.title+'"><span class="delete" title="delete taboo"></span><span class="title"><nobr>' +
      tab.title + '</nobr></span><span class="url" title="'+ tab.url +'">' +
      tab.url + '</span><img class="preview" src="' + tab.imageURL + '" /></div>';

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
