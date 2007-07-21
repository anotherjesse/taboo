const CC = Components.classes;
const CI = Components.interfaces;
const SVC = CC['@oy/taboo;1'].getService(CI.oyITaboo);

var grid = {
  container: null,
  getContainer: function(node) {
    if (!this.container) {
      this.container = document.createElement('ul');
      node.appendChild(this.container);
    }
    return this.container;
  },
  start: function(node) {
    this.getContainer(node);
    this.container.innerHTML = '';
  },
  finish: function() {
  },
  add: function(tab) {
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
    this.getContainer().appendChild(box);
  }
};

var controller = {
  view: grid,
  load: function(view) {
    $('content').innerHTML = '';
    this.view = view;
    this.display();
  },
  filter: function(str) {
    if (this._filterStr && this._filterStr == str) {
      return;
    }

    this.display(str);
    this._filterStr = str;
  },
  display: function(searchText) {
    this.view.start($('content'));

    var enum = SVC.get(searchText, false);
    while (enum.hasMoreElements()) {
      var tab = enum.getNext();
      tab.QueryInterface(CI.oyITabooInfo);

      this.view.add(tab);
    }

    this.view.finish();
  }
};
