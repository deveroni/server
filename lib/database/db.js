'use strict';

var creds = require('./secret').dbUser;

// Set info for database
var knex = require('knex')({
    client: 'pg',
    connection: {
      host : '127.0.0.1',
      user : creds.dbUser,
      password : creds.dbPassword,
      database : 'meloan'
    }
});
const bookshelf = require('bookshelf')(knex);

// Load bookshelf plugins
bookshelf.plugin('bookshelf-json-coloms');
bookshelf.plugin('bookshelf-update');
bookshelf.plugin('bookshelf-spotparse');
bookshelf.plugin('registry');

// Export
module.exports.knex = knex;
module.exports.shelf = bookshelf;