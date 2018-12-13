'use strict';


/* dependencies */
const _ = require('lodash');
// const { eachPath } = require('@lykmapipo/mongoose-common');


/**
 * @function taggable
 * @name taggable
 * @description mongoose plugin to add tags and taggable behaviour
 * @param {Schema} schema valid mongoose schema
 * @param {Object} [optns] plugin options
 * @param {String} [optns.path=tags] schema path where tags will be stored.
 * @param {Boolean|String} [optns.index=true] whether to index tags.
 * @author lally elias <lallyelias87@mail.com>
 * @license MIT
 * @since  0.1.0
 * @version 0.1.0
 * @public
 */
function taggable(schema, optns) {

  // ensure options
  const defaults = ({ path: 'tags', searchable: true, index: true });
  const options = _.merge({}, defaults, optns);

  // add tag schema paths
  const { path, index, searchable } = options;
  schema.add({
    [path]: { type: [String], index, searchable }
  });

}


module.exports = exports = taggable;