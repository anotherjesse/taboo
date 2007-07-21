const CC = Components.classes;
const CI = Components.interfaces;
const SVC = CC['@oy/taboo;1'].getService(CI.oyITaboo);

function Grid(container) {
  var ul = document.createElement('ul');
  container.appendChild(ul);
  
  this.start = function() {
    ul.innerHTML = '';
  }
  
  this.finish = function() {}
  
  this.add = function(tab) {
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
  }
}

function Controller() {
  var inst = this;
  
  var content = $('content');
  var view = null
    
  this.load = function(ViewClass) {
    content.innerHTML = '';
    view = new ViewClass(content);
    this.display();
  }

  this.filter = function(str) {
    if (this._filterStr && this._filterStr == str) {
      return;
    }

    this.display(str);
    this._filterStr = str;
  }

  this.display = function(searchTxt) {
    view.start();

    var enum = SVC.get(searchTxt, false);
    while (enum.hasMoreElements()) {
      var tab = enum.getNext();
      tab.QueryInterface(CI.oyITabooInfo);

      view.add(tab);
    }

    view.finish();
  }
}

var controller = new Controller();
controller.load(Grid);
