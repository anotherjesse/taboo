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
 * DB: a better sqlite wrapper (for some definition of better)
 *
 * params - dbFile should be a nsIFile or null
 *          if you pass null, it will create an in-memory 
 *          database, otherwise it sqlite will use the 
 *          file you pass in.
 */

function DB(dbFile) {
  var self = this;

  const Cc = Components.classes;
  const Ci = Components.interfaces; 

  /* Create the sqlite database */

  var storageService = Cc['@mozilla.org/storage/service;1']
    .getService(Ci.mozIStorageService);

  var conn = storageService.openDatabase(dbFile);

  /* convert sql into a convenience wrapper */

  function wrap_sql(query) {
    var stmt = conn.createStatement(query);

    var wrapper = Cc["@mozilla.org/storage/statement-wrapper;1"]
      .createInstance(Ci.mozIStorageStatementWrapper);

    wrapper.initialize(stmt);
    return wrapper;
  }

  /* Table - create a table for a given schema, returning an object 
   *         you can use to find, or create rows.
   *
   * Creating a table:
   *
   * db.Table('urls', {url: 'PRIMARY KEY TEXT', 
   *                   name: 'TEXT'});
   *
   * Using a table:
   *
   *   Creating a new row:
   *
   *     var bookmark = db.urls.new();        
   *     bookmark.url = 'http://commerce.net';
   *     bookmark.name = 'CommerceNet';       
   *                                        
   *     bookmark.save()                      
   *
   *   Finding an existing row:
   *
   *     db.urls.find('http://commerce.net');
   *      // select * from urls where url = 'http://commerce.net'
   *
   *     db.urls.find('http://commerce.net').name
   *      => 'CommerceNet'
   *
   *     db.urls.find({url: 'http://commerce.net'}); 
   *      // select * from urls where url = 'http://commerce.net'
   *
   *     db.urls.find({url: 'http://commerce.net', name: 'CommerceNet'})
   *      // select * from urls where url = 'http://commerce.net' and
   *      // name = 'CommerceNet'
   *
   *   Updating a record:
   *
   *     var bookmark = db.urls.find('http://commerce.net');
   *     bookmark.name = 'Commerce.Net';
   *     bookmark.save();
   *
   *   Deleting a record:
   *
   *     var bookmark = db.urls.find('http://commerce.net')
   *     bookmark.destroy();
   *
   */

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
      /* table already exists - hopefully */ 
    }

    var sql_insert = wrap_sql(
      'INSERT INTO ' + table_name + ' (' + _COLS.join(', ') + ')'
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
      find: function(query) {

        /* todo - cache the following */
        var sql = 'SELECT * from ' + table_name;
        var params = {};

        if (typeof(query) == 'string') {
          sql += ' WHERE ' + _PK + ' = :' + _PK;
          params[_PK] = query;
        }

        if (typeof(query) == 'object') {
          sql += ' WHERE ' +
             [col + ' = :' + col for (col in query)].join(' and ');
          for (var k in query) {
            params[k] = query[k];
          }
        }

        var select = wrap_sql(sql);

        for (var k in params) {
          select.params[k] = params[k];
        }

        var records = [];

        while (select.step()) {
          records.push(new Record(select.row));
        }

        select.reset();
        return records;
      }
    }
  }
}
