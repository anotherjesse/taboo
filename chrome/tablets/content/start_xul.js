const CC = Components.classes;
const CI = Components.interfaces;
const SVC = CC['@oy/tablets;1'].getService(CI.oyITablets);

var groupbox = document.getElementById('tablets');

var enum = SVC.getTablets();
while (enum.hasMoreElements()) {
  var tab = enum.getNext();
  tab.QueryInterface(CI.oyITabletInfo);

  // this should be a custom xbl:
  (function (tab){
    
    var box = document.createElement('vbox');
    box.setAttribute('class', 'tablet')
    
    var node = document.createElement('image');
    node.setAttribute('class', 'delete')
    box.appendChild(node);
    
    var node = document.createElement('label');
    node.setAttribute('class', 'title')
    node.setAttribute('tooltiptext', tab.title);
    node.setAttribute('value', tab.title);
    node.setAttribute('minwidth', '125')
    node.setAttribute('maxwidth', '125')
    node.setAttribute('crop', 'end');
    
    var node = document.createElement('label');
    node.setAttribute('class', 'title')
    node.setAttribute('tooltiptext', tab.title);
    node.setAttribute('value', tab.title);
    node.setAttribute('minwidth', '125')
    node.setAttribute('maxwidth', '125')
    node.setAttribute('crop', 'end');

    box.appendChild(node);
    
    var node = document.createElement('label');
    node.setAttribute('class', 'url')
    node.setAttribute('value', tab.url);
    node.setAttribute('tooltiptext', tab.url);
    node.setAttribute('minwidth', '125')
    node.setAttribute('maxwidth', '125')
    node.setAttribute('crop', 'end');
    
    box.appendChild(node);
    
    var node = document.createElement('image');
    node.setAttribute('src', tab.imageURL);
    node.setAttribute('class', 'preview')
    
    box.appendChild(node);
    
    box.onclick = function(event) {
      if (event.originalTarget.className == 'delete') {
        SVC.delete(tab.url);
        box.parentNode.removeChild(box);
      }
      else {
        SVC.open(tab.url, whereToOpenLink(event));
      }
    }
    
    groupbox.appendChild(box);
    
  })(tab);
}
