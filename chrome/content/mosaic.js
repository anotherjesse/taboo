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

function Mosaic(container) {
  document.body.className = 'mosaic';

  var main = document.createElement('div');
  main.setAttribute('id', 'main');
  container.appendChild(main);

  var detail_img = document.createElement('img');
  detail_img.setAttribute('class', 'full')
  main.appendChild(detail_img);

  var detail_url = document.createElement('div')
  detail_url.setAttribute('class', 'url');
  main.appendChild(detail_url);

  var detail_title = document.createElement('div')
  detail_title.setAttribute('class', 'title');
  main.appendChild(detail_title);

  $(detail_title).editInPlace({
    callback: function(original_element, html){
      return(html);
    }
  });

  var detail_description = document.createElement('div');
  detail_description.setAttribute('class', 'description');
  main.appendChild(detail_description);

  $(detail_description).editInPlace({
    field_type: "textarea",
    textarea_rows: "15",
    textarea_cols: "35",
    bg_out: '#fff',
    callback: function(original_element, html){
      return(html);
    }
  });

  detail_url.onclick = function(event) {
    SVC.open(detail_img.getAttribute('url'), whereToOpenLink(event));
  }
  detail_img.onclick = function(event) {
    SVC.open(detail_img.getAttribute('url'), whereToOpenLink(event));
  }

  var list = document.createElement('div');
  list.setAttribute('id', 'list');
  container.appendChild(list)

  this.start = function() {
    list.innerHTML = '';
  }

  this.finish = function() {}

  var loadedFirst = false;

  this.add = function(tab) {
    var img = document.createElement('img');
    img.setAttribute('src', tab.thumbURL);
    img.setAttribute('full', tab.imageURL);
    img.setAttribute('title', tab.title);
    list.appendChild(img);

    img.onclick = function(event) {
      detail_img.setAttribute('src', tab.imageURL);
      detail_img.setAttribute('url', tab.url);
      detail_url.innerHTML = tab.url;
      detail_title.innerHTML = tab.title;
      detail_description.innerHTML = tab.description;
    }

    if (!loadedFirst) {
      img.onclick();
      loadedFirst = true;
    }
  }
}
