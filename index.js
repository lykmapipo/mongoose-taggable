'use strict';


/* dependencies */
const _ = require('lodash');
const traverse = require('traverse');
const stopwords = require('stopwords-iso');
const { eachPath, isObjectId, isMap } = require('@lykmapipo/mongoose-common');


/**
 * @function words
 * @name words
 * @description extract words from a phrase
 * @param {String} phrase a phrase to extract words from
 * @return {String[]} array of words from a phrase
 * @author lally elias <lallyelias87@mail.com>
 * @license MIT
 * @since 0.1.0
 * @version 0.1.0
 * @private
 * @example
 * const _words = words('Hello World') // ['Hello', 'World'];
 */
function words(phrase) {
  const _words = phrase ? String(phrase).match(/\w+/g) : [];
  return _words;
}


/**
 * @function removeStopwords
 * @name removeStopwords
 * @description remove stop words from phrases using all languages stopwords
 * @param {...String} phrases phrases to remove stopwords from
 * @return {String[]} set of words from a phrases without stopwords
 * @author lally elias <lallyelias87@mail.com>
 * @license MIT
 * @since 0.1.0
 * @version 0.1.0
 * @private
 * @example
 * const keywords = removeStopwords('Mongo and Node') // ['Mongo', 'Node']
 */
function removeStopwords(...phrases) {
  const _phrases = [...phrases].join(' ');
  const _words = words(_phrases);
  const _stopwords = _.flattenDeep(_.values(stopwords));
  const _keywords = _.difference(_words, _stopwords);
  return _keywords;
}


/**
 * @function normalizeTags
 * @name normalizeTags
 * @description clear, compact and lowercase tags
 * @param {...String} tags set of tags
 * @return {String[]} set of normalized tags
 * @author lally elias <lallyelias87@mail.com>
 * @license MIT
 * @since 0.1.0
 * @version 0.1.0
 * @private
 * @example
 * const tags = normalizeTags('Node and Mongo') // ['node', 'mongo']
 */
function normalizeTags(...tags) {
  // collect tags
  let _tags = [...tags];
  // remove falsey tags 
  _tags = _.compact(_tags);
  // convert tags to lowercase
  _tags = _.map(_tags, _.toLower);
  // convert tags to discrete words
  _tags = _.flattenDeep(_.map(_tags, words));
  // remove stopwords
  _tags = removeStopwords(..._tags);
  // ensure unique tags
  _tags = _.uniq(_tags);
  // return normalized tags
  return _tags;
}


/**
 * @function tagFromMapField
 * @name tagFromMapField
 * @description derive tags from map schematype
 * @param {MongooseMap} mapVal valid instance of MongooseMap
 * @return {String[]} set of tags
 * @author lally elias <lallyelias87@mail.com>
 * @license MIT
 * @since 0.1.0
 * @version 0.1.0
 * @private
 */
function tagFromMapField(mapVal) {
  let _tags = [];
  if (mapVal && isMap(mapVal)) {
    const _mapVal = _.merge({}, mapVal.toJSON());
    traverse(_mapVal).forEach(function tagMapVal(value) {
      if (_.isString(value)) {
        _tags = [..._tags].concat(value);
      }
    });
  }
  return _tags;
}


/**
 * @function tagFromFields
 * @name tagFromFields
 * @description derive tags from instance fields
 * @param {MongooseMap} mapVal valid instance of MongooseMap
 * @return {String[]} set of tags
 * @author lally elias <lallyelias87@mail.com>
 * @license MIT
 * @since 0.1.0
 * @version 0.1.0
 * @private
 * @example
 * const tags = tagFromFields(user, taggables, 'tags'); // ['js', 'node']
 */
function tagFromFields(instance, taggables /*, tagsPath*/ ) {
  //cache
  let _tags = [];
  // collect tags from taggable fields
  _.forEach(taggables, function tagFromField(extract, pathName) {
    // obtain tag from field
    let tag = _.get(instance, pathName);
    _tags = [..._tags].concat(tagFromMapField(tag));
    if (!isObjectId(tag)) {
      // TODO handle simple array and array of sub doc
      // extract tags from ref
      if (tag && _.isFunction(tag.tag)) {
        tag.tag();
        tag = tag.tags;
      }
      // extract tags per field tag extractor
      tag = _.isFunction(extract) ? extract(tag) : tag;
      // add extracted tags
      _tags = [].concat(_tags).concat(tag);
    }
  });
  return _tags;
}


/**
 * @function collectTaggables
 * @name collectTaggables
 * @description collect schema taggable fields
 * @param {String} pathName path name
 * @param {SchemaType} schemaType SchemaType of a path
 * @return {Object} hash of all schema taggable paths
 * @author lally elias <lallyelias87@mail.com>
 * @license MIT
 * @since 0.1.0
 * @version 0.1.0
 * @private
 * const taggables = collectTaggables(schema, 'tags');
 */
function collectTaggables(schema, tagsPath) {
  // cache
  const taggables = {};
  eachPath(schema, function collectTaggablePath(pathName, schemaType) {
    // check if path is taggable
    const isTaggable = (schemaType.options && schemaType.options.taggable);
    if (isTaggable && pathName !== tagsPath) {
      // obtain taggable options
      const optns = _.get(schemaType.options, 'taggable');
      // collect taggable schema path
      taggables[pathName] = _.isFunction(optns) ? optns : words;
    }
  });
  // return collect taggable schema paths
  return taggables;
}


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
 * @since 0.1.0
 * @version 0.1.0
 * @public
 * @example
 * const taggable = require('@lykmapipo/mongoose-taggable');
 * const UserSchema = new Schema({ name: { type: String, taggable:true } });
 * UserSchema.plugin(taggable);
 */
function taggable(schema, optns) {

  // ensure options
  const defaults = ({ path: 'tags', searchable: true, index: true });
  const options = _.merge({}, defaults, optns);

  // add tag schema paths
  const { path, index, searchable } = options;
  schema.add({
    [path]: { type: [String], index, searchable, default: undefined }
  });

  // collect taggable schema paths
  const taggables = collectTaggables(schema, path);
  schema.statics.TAGGABLE_FIELDS = taggables;


  /**
   * @function tag
   * @name tag
   * @descriptions add tags to a model instance
   * @param {...String} [tags] set of tags to add to model instance
   * @author lally elias <lallyelias87@mail.com>
   * @license MIT
   * @since 0.1.0
   * @version 0.1.0
   * @instance
   * @example
   * const user = new User();
   * user.tag('js ninja', 'nodejs', 'expressjs');
   */
  schema.methods.tag = function tag(...tags) {
    // reference
    const instance = this;
    // obtain existing tags
    let _tags = this[path] ? [...this[path]] : [];
    // merge provided tags
    _tags = [..._tags, ...tags];
    // collect tags from taggable fields
    _tags = [..._tags, ...tagFromFields(instance, taggables)];
    // normalize tags
    _tags = normalizeTags(..._tags);
    // set and update tags
    this[path] = _tags;
  };


  /**
   * @function untag
   * @name untag
   * @descriptions remove tags from a model instance
   * @param {...String} tags set of tags to remove from model instance
   * @author lally elias <lallyelias87@mail.com>
   * @license MIT
   * @since 0.1.0
   * @version 0.1.0
   * @instance
   * @example
   * const user = new User();
   * user.untag('js', 'angular');
   */
  schema.methods.untag = function untag(...tags) {
    // normalize provided tags
    let _tags = normalizeTags(...tags);
    // remove from tags
    _tags = _.difference(this[path], _tags);
    // set and update tags
    this[path] = _tags;
  };


  /**
   * @function preValidate
   * @name preValidate
   * @descriptions generate tags from taggable paths and set into tags path
   * @author lally elias <lallyelias87@mail.com>
   * @license MIT
   * @since 0.1.0
   * @version 0.1.0
   * @private
   */
  schema.pre('validate', function preValidate() { this.tag(); });

}


/* exports taggable plugin */
module.exports = exports = taggable;