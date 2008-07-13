
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
    this.slideybox.appendChild(slidey);
  },

  onLoad: function() {
    this.slideybox = document.getElementById("taboo-slideybox");
    var taboos = SVC.get(null, false);

    while (taboos.hasMoreElements()) {
      var tab = taboos.getNext();
      tab.QueryInterface(Components.interfaces.oyITabooInfo);
      this.add(tab);
    }
  }

}
