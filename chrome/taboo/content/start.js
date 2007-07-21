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

function Controller() {
  var content = $('content');
  var view = null;
    
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
      tab.QueryInterface(Components.interfaces.oyITabooInfo);
      view.add(tab);
    }

    view.finish();
  }
}

var controller = new Controller();
controller.load(Grid);
