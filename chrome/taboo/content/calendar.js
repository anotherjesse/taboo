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

function Calendar(container) {
  container.className = 'calendar';

  var table = document.createElement('table');
  container.appendChild(table);
  
  var db;
  
  function dbDate(time) {
    var date = new Date(time);
    var Y = date.getFullYear()
    var M = date.getMonth()
    var D = date.getDate()

    var rval = db;
    if (!rval[Y])       { rval[Y] = {}; }
    if (!rval[Y][M])    { rval[Y][M] = {}; }
    if (!rval[Y][M][D]) { rval[Y][M][D] = []; }
    
    return rval[Y][M][D];
  }

  this.start = function() {
    db = {};
    table.innerHTML = '';
  }

  this.finish = function() {
    var year = 2007;
    var month = 6;
    var monthDB = db[year][month]; // FIX ME
    
    var curDate = new Date(2007, 7, 1);
    table.innerHTML = "<tr><th>SUN</th><th>MON</th><th>TUE</th><th>WED</th><th>THUR</th><th>FRI</th><th>SAT</th></tr>"
    var tr = null;
    while (curDate.getMonth() == 7) {
      
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
      if (monthDB[curDate.getDate()]) {
        var img = document.createElement('img');
        img.setAttribute('src', monthDB[curDate.getDate()][0].imageURL);
        td.appendChild(img);
      }
      else {
        td.setAttribute('class', 'empty')
        td.appendChild(document.createTextNode(curDate.getDate()));        
      }
      tr.appendChild(td);
      if (curDate.getDay() == 6) {
        tr = null;
      }

      curDate = new Date(curDate.setDate(curDate.getDate() + 1)); // add one day
    }
  }

  this.add = function(tab) {
    var foo = dbDate(tab.created - 5000000);
    foo.push(tab)
  }
}

