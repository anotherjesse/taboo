/*
 * Copyright 2007 Jesse Andrews, and CommerceNet
 *
 * This file may be used under the terms of of the
 * GNU General Public License Version 2 or later (the "GPL"),
 * http://www.gnu.org/licenses/gpl.html
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 */


/*
 * DB: a better mozstorage wrapper (for some definition of better)
 *
 *
 * Initializing the Database:
 *
 *   Creating an in-memory database:
 *
 *     var db = new DB();
 *
 *   Loading/Creating a file-based database:
 *
 *     var file = Cc['@mozilla.org/file/directory_service;1']
 *                  .getService(Ci.nsIProperties).get('ProfD', Ci.nsILocalFile);
 *     file.append('mydb.sqlite');
 *
 *     var db = new DB(file);
 *
 * Creating/Using a table:
 *
 *   Creating a table:
 *
 *     Pass in the name of the table, and the schema as a object.
 *     Make sure to include the primary key explicitly.
 *
 *     db.Table('urls', {url: 'TEXT PRIMARY KEY',
 *                       name: 'TEXT'});
 *
 *     You need to include the schema even if the table already exists.
 *     It will not overwrite the existing schema, but is needed to construct
 *     the javascript object versions of the table data.
 *
 *   Using a table:
 *
 *     Creating a new row:
 *
 *       var bookmark = db.urls.new();
 *       bookmark.url = 'http://commerce.net';
 *       bookmark.name = 'CommerceNet';
 *
 *       bookmark.save()
 *
 *     Finding an existing row:
 *
 *       db.urls.find('http://commerce.net');
 *        // select * from urls where url = 'http://commerce.net'
 *
 *       db.urls.find('http://commerce.net').name
 *        => 'CommerceNet'
 *
 *       db.urls.find({url: 'http://commerce.net'});
 *        // select * from urls where url = 'http://commerce.net'
 *
 *       db.urls.find({url: 'http://commerce.net', name: 'CommerceNet'})
 *        // select * from urls where url = 'http://commerce.net' and
 *        // name = 'CommerceNet'
 *
 *     Updating a record:
 *
 *       var bookmark = db.urls.find('http://commerce.net');
 *       bookmark.name = 'Commerce.Net';
 *       bookmark.save();
 *
 *     Deleting a record:
 *
 *       var bookmark = db.urls.find('http://commerce.net')
 *       bookmark.destroy();
 *
 */

function DB(dbFile) {
  var self = this;

  const Cc = Components.classes;
  const Ci = Components.interfaces;

  // Create the sqlite database

  var storageService = Cc['@mozilla.org/storage/service;1']
    .getService(Ci.mozIStorageService);

  var conn = storageService.openDatabase(dbFile);

  // convert sql into a convenience wrapper

  var statements = [];
  function wrap_sql(query) {
    try {
      var stmt = conn.createStatement(query);

      var wrapper = Cc["@mozilla.org/storage/statement-wrapper;1"]
        .createInstance(Ci.mozIStorageStatementWrapper);

      wrapper.initialize(stmt);
      statements.push(stmt);
      return wrapper;    
    } catch (ex) {
      throw (conn.lastErrorString); 
      return null;
    }
  }

  this.close = function() {
    statements.forEach(function(stmt) { stmt.finalize(); });
    conn.close();
  }

  this.Table = function(table_name, schema) {
    var _PK;
    var _COLS = [k for (k in schema)];

    for (var k in schema) {
      if (schema[k].match(/PRIMARY KEY/i)) { _PK = k; }
    }

    try {
     conn.createTable(table_name, _COLS.map(
       function(col) {return col + ' ' + schema[col]}).join(', ')
     );
    } catch(e) {
      // table already exists - hopefully
    }

    var sql_insert = wrap_sql(
      'INSERT INTO ' + table_name + ' (' + _COLS.join(', ') + ')' +
      ' VALUES (' + _COLS.map(function(x) { return ':' + x }).join(', ') + ')'
    );

    var sql_update = wrap_sql(
      'UPDATE ' + table_name +
      ' SET ' + _COLS.map(function(x) { return x + ' = :' + x }).join(', ') +
      ' WHERE ' + _PK + ' = :' + _PK
    );

    var sql_destroy = wrap_sql(
      'DELETE FROM ' + table_name + ' WHERE ' + _PK + ' = :' + _PK
    );

    function Record(row) {
      var inst = this;
      var new_record = true;

      if (row) {
        new_record = false;
        for (var k in schema) {
          this[k] = row[k];
        }
      }

      this.toString = function() {
        return inst[_PK] + ' (' + table_name + ')';
      }

      this.destroy = function() {
        sql_destroy.params[_PK] = inst[_PK];
        try {
          if (sql_destroy.step()) {
            sql_destroy.reset();
            return true
          }
        } catch(e) { };
        sql_destroy.reset();
        return false;
      }

      this.save = function() {
        var query = new_record ? sql_insert : sql_update;
        _COLS.forEach(function(k) {
          if (inst[k]) {
            query.params[k] = inst[k];
          }
        }, inst);
        try {
          query.step();
          new_record = false;
          query.reset()
          return true;
        } catch (e) {
          query.reset()
          return false;
        }
      }
    }

    self[table_name] = {
      new: function() {
        return new Record();
      },
      find: function(conditions, order) {

        // todo - cache the following
        var sql = 'SELECT * from ' + table_name;
        var params = {};
        var return_one = false;

        if (typeof(conditions) == 'string' || typeof(conditions) == 'number') {
          sql += ' WHERE ' + _PK + ' = :' + _PK;
          params[_PK] = conditions;
          return_one = true;
        }

        if (conditions instanceof Array) {
          // SECURITY HOLE: this is the incorrect way to do this...
          // the params need escaped

          var query = conditions[0];
          for (var i=1; i<conditions.length; i++) {
            query = query.replace(new RegExp('\\?'+i, 'g'), '"'+conditions[i]+'"')
          }
          sql += ' WHERE ' + query;
        }
        else if (typeof(conditions) == 'object') {
          sql += ' WHERE ' +
             [col + ' = :' + col for (col in conditions)].join(' and ');
          for (var k in conditions) {
            params[k] = conditions[k];
          }
        }

        if (order)
          sql += ' ORDER BY ' + order;

        var select = wrap_sql(sql);

        for (var k in params) {
          select.params[k] = params[k];
        }

        var records = [];

        while (select.step()) {
          records.push(new Record(select.row));
        }

        select.reset();

        if (return_one) {
          return records[0];
        }
        return records;
      },
      toString: function() {
        return 'Table: ' + table_name;
      }
    }
  }
}
