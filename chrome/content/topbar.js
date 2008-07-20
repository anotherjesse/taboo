
const SVC = Components.classes['@oy/taboo;1'].getService(Components.interfaces.oyITaboo);

var tabooTopbar = {

  add: function(tab) {
    var slidey = document.createElement("slideyitem");
    var image = document.createElement("taboo");
    image.setAttribute("image", tab.imageURL);
    image.setAttribute("thumb", tab.thumbURL);
    image.setAttribute("title", tab.title);
    slidey.appendChild(image);
    slidey.onclick = function(event) {
      SVC.open(tab.url, whereToOpenLink(event));
    };
    this._slideybox.appendChild(slidey);
  },

  clear: function() {
    while (this._slideybox.lastChild) {
      this._slideybox.removeChild(this._slideybox.lastChild);
    }
  },

  refresh: function() {
    this.clear();
    var searchTerm = this._search.value;
    var taboos = SVC.get(searchTerm, false);
    if (taboos.hasMoreElements()) {
      this._deck.selectedIndex = 0;
    } else {
      this._deck.selectedIndex = 1;
      this._emptyMsg.message = "You don't have any taboo. Click the + icon to save a web page.";
      this._emptyMsg.show();
    }
    while (taboos.hasMoreElements()) {
      var tab = taboos.getNext();
      tab.QueryInterface(Components.interfaces.oyITabooInfo);
      this.add(tab);
    }
  },

  load: function() {
    this._slideybox = document.getElementById("taboo-slideybox");
    this._deck = document.getElementById("taboo-deck");
    this._emptyMsg = document.getElementById("taboo-bannermessage");
    this._search = document.getElementById("search-box");
    this.refresh();

    var inst = this;
    this.tabooObserver = {
      onSave: function (aURL, aIsNew) {
        inst.refresh();
      },

      onDelete: function (aURL) {
        inst.refresh();
      },

      onUndelete: function(aURL) {
        inst.refresh();
      },

      onReallyDelete: function(aURL) {
        inst.refresh();
      }
    };

    SVC.addObserver(this.tabooObserver);
  },

  unload: function() {
    SVC.removeObserver(this.tabooObserver);
  }

}
