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

function Calendar(container) {
  var self=this;
  container.className = 'calendar';

  var table = document.createElement('table');
  container.appendChild(table);

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
    }

    this.clear = function() { 
      _db = {};
    }

    this.getTabs = function(Y,M,D) {
      try {
        return _db[Y][M][D];
      }
      catch (e) {}
    }
  }
  
  var db = new calDB();

  function addTabsToTD(year, month, date, td) {
    var tabs = db.getTabs(year, month, date);
    if (tabs && tabs.length > 0) {
      var img = document.createElement('img');
      img.setAttribute('src', tabs[0].thumbURL);
      td.appendChild(img);
      td.onclick = function() {
        var div = document.createElement('div');
        div.setAttribute('class', 'tabs');
        tabs.forEach(function(tab) { 
          var img = document.createElement('img');
          img.setAttribute('src', tab.thumbURL);
          img.setAttribute('title', tab.title); 
          img.onclick = function(event) { 
            SVC.open(tab.url, whereToOpenLink(event));
          }
          div.appendChild(img);
        });
        container.appendChild(div);
        var remover = function(event) {
          if (event.target != div) {
            container.removeChild(div);
            document.removeEventListener('click', remover, true);
          }
        }
        document.addEventListener('click', remover, true);
      }
    }
    else {
      td.setAttribute('class', 'empty')
      td.appendChild(document.createTextNode(date));        
    }
  }

  this.start = function() {
    db.clear();
  }

  this.finish = function(year, month) {
    container.removeChild(table);
    table = document.createElement('table');
    container.appendChild(table);
    var year = year || new Date().getFullYear();   // default to current year
    var month = month || new Date().getMonth();     // default to current month
    var days = daysOf(year, month);

    table.innerHTML = "<tr><th colspan='7' id='date_nav'><span id='nav_left'>&larr;</span>" + (month+1) + ' / ' + year + '<span id="nav_right">&rarr;</span></th></tr>' +   
                      "<tr><th>SUN</th><th>MON</th><th>TUE</th><th>WED</th><th>THUR</th><th>FRI</th><th>SAT</th></tr>";

    var left = document.getElementById('nav_left');
    left.onclick = function() {
      var new_month = month - 1;
      var new_year = year;
      if (new_month < 0) {
        new_month = 11;
        new_year = year - 1;
      }
      self.finish(new_year, new_month);
    }

    var right = document.getElementById('nav_right');
    right.onclick = function() {
      var new_month = month + 1;
      var new_year = year;
      if (new_month > 11) {
        new_month = 0;
        new_year = year + 1;
      }
      self.finish(new_year, new_month);
    }

    var tr = null;

    for (var date=1; date<=days; date++) {
      var curDate = new Date(year, month, date);
      
      if (!tr) {
        tr = document.createElement('tr');
        for (var i=0; i<curDate.getDay(); i++) {
          var td = document.createElement('td');
          td.setAttribute('class', 'blank')
          tr.appendChild(td);
        }
        table.appendChild(tr);
      }
        
      var td = document.createElement('td');

      addTabsToTD(year, month, date, td);

      tr.appendChild(td);
      if (curDate.getDay() == 6) {
        tr = null;
      }
    }
  }

  this.add = function(tab) {
    db.add(tab);
  }
}
