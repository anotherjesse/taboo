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

function setText(node, txt) {
  node.innerHTML = '';
  node.appendChild(document.createTextNode(txt));
}

function Mosaic(container) {
  document.body.className = 'mosaic';

  var img = IMG({id: 'detail_img'});
  var url = DIV({id: 'detail_url'});
  var title = DIV({id: 'detail_title'});
  var description = PRE({id: 'detail_description'});

  container.appendChild(DIV({id: 'main'}, img, url, title, description));

  $(title).editInPlace({
    callback: function(original_element, html) {
      SVC.update(currentUrl, html, null);
      return html.replace(/</g, '&lt;');
    }
  });

  $(description).editInPlace({
    field_type: "textarea",
    textarea_rows: "8",
    textarea_cols: "35",
    bg_out: '#fff',
    callback: function(original_element, html) {
      SVC.update(currentUrl, null, html);
      return html.replace(/</g, '&lt;');
    }
  });

  function openCurrent(event) {
    SVC.open(currentUrl, whereToOpenLink(event));
  }

  url.onclick = openCurrent;
  img.onclick = openCurrent;

  var list = document.createElement('div');
  list.setAttribute('id', 'list');
  container.appendChild(list)

  this.start = function() {
    currentUrl = null;
    list.innerHTML = '';
  }

  this.finish = function() {}

  var currentUrl = null;

  this.add = function(tab) {
    var tile = IMG({src: tab.thumbURL, full: tab.imageURL, title: tab.title});
    list.appendChild(tile)

    tile.onclick = function(event) {
      currentUrl = tab.url;
      img.setAttribute('src', tab.imageURL);
      setText(url, tab.url);
      setText(title, tab.title);
      setText(description, tab.description);
    }

    if (!currentUrl) {
      tile.onclick();
    }
  }
}
