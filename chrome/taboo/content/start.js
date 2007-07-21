const CC = Components.classes;
const CI = Components.interfaces;
const SVC = CC['@oy/taboo;1'].getService(CI.oyITaboo);

var ul = document.createElement('ul');
var searchText = null;

function loadTaboos(display) {
  display.container.setAttribute('id', 'taboos');

  var enum = SVC.get(searchText);
  while (enum.hasMoreElements()) {
    var tab = enum.getNext();
    tab.QueryInterface(CI.oyITabooInfo);

    displayFunc(tab);
  }
	
  document.body.appendChild(display.container);
}


var normalStartPage = {
	container: document.createElement('ul'),
	display: function(tab) {
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
		this.container.appendChild(box);
	}
}
