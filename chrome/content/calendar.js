
/*
 * Copyright 2007 Jesse Andrews, Manish Singh, Ian Fischer
 *
 * This file may be used under the terms of of the
 * GNU General Public License Version 2 or later (the "GPL"),
 * http://www.gnu.org/licenses/gpl.html
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 */

function daysOf(year, month) {
  // determine number of days in month
  // by adding 1 month, then subtracting 1 second
  // and looking at the current date

  var date = new Date(year, month+1, 1);
  return new Date(date - 1).getDate();
}

function calDB() {
  var _db = {};

  this.add = function(tab) {
    var date = new Date(tab.updated);
    var Y = date.getFullYear();
    var M = date.getMonth();
    var D = date.getDate();
    if (!_db[Y])       { _db[Y]       = {}; }
    if (!_db[Y][M])    { _db[Y][M]    = {}; }
    if (!_db[Y][M][D]) { _db[Y][M][D] = []; }
    _db[Y][M][D].push(tab);
  };

  this.clear = function() {
    _db = {};
  };

  this.get = function(Y,M,D) {
    try {
      return _db[Y][M][D];
    }
    catch (e) {}
  };
}

function Calendar(container) {
  var self=this;
  document.body.className = 'calendar';
  self.year = new Date().getFullYear();   // default to current year
  self.month = new Date().getMonth();     // default to current month

  var table = TABLE();
  container.appendChild(table);

  var db = new calDB();

  function addTabsToTD(year, month, date, td) {
    td.appendChild(SPAN({'class': 'date'}, "" + date));
    var tabs = db.get(year, month, date);
    if (tabs && tabs.length > 0) {
      var img = IMG({src: tabs[0].thumbURL});
      td.appendChild(SPAN({'class': 'qty'}, 'tabs: ' + tabs.length));

      td.appendChild(img);

      td.onclick = function() {
        var div = DIV({'class': 'tabs'});
        tabs.forEach(function(tab) {
          var img = IMG({src: tab.thumbURL});
          img.onclick = function(event) {
            SVC.open(tab.url, whereToOpenLink(event));
          };


          img.onmouseover = function(event) {
            jQuery(document.body).trigger('hue.over', [
                                            DIV(
                                              SPAN({'class': 'title'}, (tab.title || 'untitled')),
                                              IMG({src: tab.imageURL}),
                                              SPAN({'class': 'description'}, (tab.description || ''))
                                            ),
                                            function(event) {
                                              SVC.open(tab.url, whereToOpenLink(event));
                                            }
                                          ]);
          };

          img.onmouseout = function(event) {
            jQuery(document.body).trigger('hue.out');
          };

          div.appendChild(img);
        });
        container.appendChild(div);
        var remover = function(event) {
          if (event.target != div) {
            container.removeChild(div);
            document.removeEventListener('click', remover, true);
          }
        };
        document.addEventListener('click', remover, true);
      };
    }
    else {
      td.setAttribute('class', 'empty');
    }
  }

  this.start = function() {
    db.clear();
  };

  this.finish = function() {
    container.removeChild(table);
    table = TABLE();
    container.appendChild(table);
    var days = daysOf(self.year, self.month);

    var previous = SPAN({'class': 'nav'}, '<');
    var next = SPAN({'class': 'nav'}, '>');

    var header = TR(TH({colspan: 7},
      previous,
      (self.month+1) + ' / ' + self.year,
      next
    ));

    table.appendChild(header);

    table.appendChild(TR(
      TH('SUN'), TH('MON'), TH('TUES'), TH('WED'), TH('THUR'), TH('FRI'), TH('SAT')));

    previous.onclick = function() {
      self.month--;
      if (self.month < 0) {
        self.month = 11;
        self.year--;
      }
      self.finish();
    };

    next.onclick = function() {
      self.month++;
      if (self.month > 11) {
        self.month = 0;
        self.year++;
      }
      self.finish();
    };

    var tr = null;

    for (var date=1; date<=days; date++) {
      var curDate = new Date(self.year, self.month, date);

      if (!tr) {
        tr = TR();
        for (var i=0; i<curDate.getDay(); i++) {
          tr.appendChild(TD({'class': 'blank'}));
        }
        table.appendChild(tr);
      }

      var td = TD();

      addTabsToTD(self.year, self.month, date, td);

      tr.appendChild(td);
      if (curDate.getDay() == 6) {
        tr = null;
      }
    }
  };

  this.add = function(tab) {
    db.add(tab);
  };
}
