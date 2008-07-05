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

  // FIXME: use better variables names for dom nodes
  var img = IMG({id: 'detail_img'});
  var url = DIV({id: 'detail_url'});
  var title = DIV({id: 'detail_title'});
  var description = PRE({id: 'detail_description'});

  container.appendChild(DIV({id: 'main'}, img, url, title, description));

  $(title).editInPlace();

  $(title).bind('callback', function(e, value) {
		  SVC.update(currentUrl, value, null);
		});

  $(description).editInPlace({
			       field_type: "textarea",
			       textarea_rows: "5",
			       textarea_cols: "35",
			       bg_out: '#fff'
			     });

  $(description).bind('callback', function(e, value) {
			SVC.update(currentUrl, null, value);
		      });

  function openCurrent(event) {
    SVC.open(currentUrl, whereToOpenLink(event));
  }

  url.onclick = openCurrent;
  img.onclick = openCurrent;

  var list = document.createElement('div');
  list.setAttribute('id', 'list');
  container.appendChild(list);

  this.start = function() {
    currentUrl = null;
    list.innerHTML = '';
  };

  this.finish = function() {};

  var currentUrl = null;

  this.add = function(tab) {

    var box = LI(
      DIV({'class': 'thumb'},
        IMG({src: tab.thumbURL})
      ),
      DIV({'class': 'preview'},
        IMG({src: tab.imageURL}),
        SPAN(tab.title || '')
      )
    );

    box.onclick = function(event) {
      currentUrl = tab.url;
      var updatedTab = SVC.getForURL(tab.url);
      img.setAttribute('src', updatedTab.imageURL);
      $(title).trigger('update', [updatedTab.title]);
      $(description).trigger('update', [updatedTab.description]);
      setText(url, updatedTab.url);
    };

    box.onmouseover = function(event) {
      $('.preview', this).css('top', (box.clientHeight/2-$('.preview', this)[0].clientHeight/2)+'px');
    };

    list.appendChild(box);

    if (!currentUrl) {
      box.onclick();
    }
  };
}
