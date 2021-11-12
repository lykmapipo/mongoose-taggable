'use strict';

const _ = require('lodash');
const traverse = require('traverse');
const moment = require('moment');
const stopwords = require('stopwords-iso');
const env = require('@lykmapipo/env');
const mongooseCommon = require('@lykmapipo/mongoose-common');

/* constants */
const defaultTaggableOptions = {
  path: 'tags',
  blacklist: [],
  index: true,
  duplicate: false,
  searchable: true,
  exportable: false,
  hide: true,
  fresh: false,
  hook: 'validate',
};

/**
 * @function words
 * @name words
 * @description extract words from a phrase
 * @param {string} phrase a phrase to extract words from
 * @returns {string[]} array of words from a phrase
 * @author lally elias <lallyelias87@mail.com>
 * @license MIT
 * @since 0.1.0
 * @version 0.1.0
 * @private
 * @example
 * words('Hello World')
 * //=> ['Hello', 'World'];
 */
function words(phrase) {
  const $words = phrase ? String(phrase).match(/\w+/g) : [];
  return $words;
}

/**
 * @function removeStopwords
 * @name removeStopwords
 * @description remove stop words from phrases using all languages stopwords
 * @param {...string} phrases phrases to remove stopwords from
 * @returns {string[]} set of words from a phrases without stopwords
 * @author lally elias <lallyelias87@mail.com>
 * @license MIT
 * @since 0.1.0
 * @version 0.1.0
 * @private
 * @example
 * removeStopwords('Mongo and Node')
 * //=> ['Mongo', 'Node']
 */
function removeStopwords(...phrases) {
  const $phrases = [...phrases].join(' ');
  const $words = words($phrases);
  const $stopwords = _.flattenDeep(_.values(stopwords));
  const $keywords = _.difference($words, $stopwords);
  return $keywords;
}

/**
 * @function normalizeTags
 * @name normalizeTags
 * @description clear, compact and lowercase tags
 * @param {...string} tags set of tags
 * @returns {string[]} set of normalized tags
 * @author lally elias <lallyelias87@mail.com>
 * @license MIT
 * @since 0.1.0
 * @version 0.1.0
 * @private
 * @example
 * normalizeTags('Node and Mongo')
 * //=> ['node', 'mongo']
 */
function normalizeTags(...tags) {
  // collect tags
  let $tags = [...tags];
  // remove falsey tags
  $tags = _.compact($tags);
  // convert tags to lowercase
  $tags = _.map($tags, _.toLower);
  // convert tags to discrete words
  $tags = _.flattenDeep(_.map($tags, words));
  // ensure unique tags
  $tags = _.uniq($tags);
  // return normalized tags
  return $tags;
}

/**
 * @function removeBlacklist
 * @name removeBlacklist
 * @description remove blacklist words from a phrase
 * @param {string | string[]} phrase valid phrase
 * @param {...string} blacklist words to remove from a phrase
 * @returns {string[]} set of words from a phrase without blacklist words
 * @author lally elias <lallyelias87@mail.com>
 * @license MIT
 * @since 0.2.0
 * @version 0.1.0
 * @private
 * @example
 * removeBlacklist('Mongo and Node', 'Node')
 * //=> ['Mongo']
 */
function removeBlacklist(phrase, ...blacklist) {
  const $blacklist = normalizeTags(...blacklist);
  const $phrase = normalizeTags(phrase);
  const $whitelist = _.difference($phrase, $blacklist);
  return $whitelist;
}

/**
 * @function tagFromAnyField
 * @name tagFromAnyField
 * @description derive tags from other schematype
 * @param {string | number | Array} value valid value
 * @param {Function} [extract] field tag extractor
 * @returns {string[]} set of tags
 * @author lally elias <lallyelias87@mail.com>
 * @license MIT
 * @since 0.1.0
 * @version 0.2.0
 * @private
 * @example
 * tagFromAnyField(<val>);
 * //=> ['js', 'node']
 *
 * tagFromAnyField(<val>, <extractor>);
 * //=> ['js', 'node']
 */
function tagFromAnyField(value, extract) {
  let $tags = [];
  const isValidField =
    value && (_.isString(value) || _.isNumber(value) || _.isArray(value));
  if (isValidField) {
    let $value = _.clone(value);
    $value = _.isFunction(extract) ? extract($value) : $value;
    $tags = [...$tags].concat($value);
  }
  return $tags;
}

/**
 * @function tagFromDateField
 * @name tagFromDateField
 * @description derive tags from date schematype
 * @param {string | number} value valid date value
 * @param {Function} [extract] field tag extractor
 * @returns {string[]} set of tags
 * @author lally elias <lallyelias87@mail.com>
 * @license MIT
 * @since 0.3.0
 * @version 0.1.0
 * @private
 * @example
 * tagFromDateField('2019-01-01');
 * //=> ['2019', 'January', 'Tuesday']
 *
 * tagFromDateField('2019-01-01', <extractor>);
 * //=> ['2019', 'January', 'Tuesday']
 */
function tagFromDateField(value, extract) {
  let $tags = [];
  const DATE_FORMAT = env.getString('TAGGABLE_DATE_FORMAT', 'dddd MMMM YYYY');
  const isValidField = value && _.isDate(value);
  if (isValidField) {
    let $value = moment(value).clone().format(DATE_FORMAT);
    $value = _.isFunction(extract) ? extract($value) : $value;
    $tags = [...$tags].concat($value);
  }
  return $tags;
}

/**
 * @function tagFromMapField
 * @name tagFromMapField
 * @description derive tags from map schematype
 * @param {object} mapVal valid instance of MongooseMap
 * @param {Function} [extract] field tag extractor
 * @returns {string[]} set of tags
 * @author lally elias <lallyelias87@mail.com>
 * @license MIT
 * @since 0.1.0
 * @version 0.1.0
 * @private
 * @example
 * tagFromMapField(<val>);
 * //=> ['js', 'node']
 *
 * tagFromMapField(<val>, <extractor>);
 * //=> ['js', 'node']
 */
function tagFromMapField(mapVal, extract) {
  let $tags = [];
  if (mapVal && mongooseCommon.isMap(mapVal)) {
    const $mapVal = _.merge({}, mapVal.toJSON());
    traverse($mapVal).forEach(function tagMapVal(value) {
      if (_.isString(value)) {
        let $value = _.clone(value);
        $value = _.isFunction(extract) ? extract($value) : $value;
        $tags = [...$tags].concat($value);
      }
    });
  }
  return $tags;
}

/**
 * @function tagFromInstanceField
 * @name tagFromInstanceField
 * @description derive tags from ref which are model instance with taggable
 * behaviour
 * @param {object} [instance] valid instance of mongoose model which is taggable
 * @param {Function} [extract] field tag extractor
 * @returns {string[]} set of tags
 * @author lally elias <lallyelias87@mail.com>
 * @license MIT
 * @since 0.1.0
 * @version 0.1.0
 * @private
 * @example
 * tagFromInstanceField(<instance>);
 * //=> ['js']
 *
 * tagFromInstanceField(<instance>, <extractor>);
 * //=> ['js']
 */
function tagFromInstanceField(instance, extract) {
  let $tags = [];
  if (instance && mongooseCommon.isInstance(instance) && _.isFunction(instance.tag)) {
    instance.tag();
    let $value = [].concat(instance.tags);
    $value = _.isFunction(extract) ? extract($value) : $value;
    $tags = [...$tags].concat($value);
  }
  return $tags;
}

/**
 * @function tagFromFields
 * @name tagFromFields
 * @description derive tags from instance fields
 * @param {object} instance valid instance of mongoose model which is taggable
 * @param {object[]} taggables valid taggable paths
 * @returns {string[]} set of tags
 * @author lally elias <lallyelias87@mail.com>
 * @license MIT
 * @since 0.1.0
 * @version 0.2.0
 * @private
 * @example
 * tagFromFields(user, taggables, 'tags');
 * //=> ['js', 'node']
 */
function tagFromFields(instance, taggables) {
  // tag set
  let $tags = [];
  // collect tags from taggable fields
  _.forEach(taggables, function tagFromField(extract, pathName) {
    // obtain field value
    const value = _.get(instance, pathName);
    // ignore objectid's
    if (mongooseCommon.isObjectId(value)) {
      return;
    }
    // tag from map field
    $tags = [...$tags, ...tagFromMapField(value, extract)];
    // tag from model instance
    $tags = [...$tags, ...tagFromInstanceField(value, extract)];
    // tag from date field
    $tags = [...$tags, ...tagFromDateField(value, extract)];
    // tag from primitive field
    $tags = [...$tags, ...tagFromAnyField(value, extract)];
    // TODO handle array of subdoc
  });
  // return tags
  return $tags;
}

/**
 * @function collectTaggables
 * @name collectTaggables
 * @description Recursively collect taggagle path
 * @param {object} schema valid mongose schema instance
 * @param {string} tagsPath valid tags path, default to `tags`
 * @returns {object} hash of all schema taggable paths
 * @author lally elias <lallyelias87@mail.com>
 * @license MIT
 * @since 0.1.0
 * @version 0.1.0
 * @private
 * @example
 * collectTaggables(schema, 'tags');
 * //=> { ... }
 */
function collectTaggables(schema, tagsPath) {
  // taggable map
  const taggables = {};
  // collect taggable schema paths
  mongooseCommon.eachPath(schema, function collectTaggablePath(pathName, schemaType) {
    // check if path is taggable
    const isTaggable = schemaType.options && schemaType.options.taggable;
    // if taggable collect
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
 * @param {object} schema valid mongoose schema
 * @param {object} [optns] plugin options
 * @param {string} [optns.path=tags] schema path where tags will be stored.
 * @param {string} [optns.blacklist=[]] list of words to remove from tags.
 * @param {string} [optns.fresh=false] whether to recompute fresh tags.
 * @param {string} [optns.hook=validate] when to run tagging hook.
 * @param {boolean | string} [optns.index=true] whether to index tags.
 * @param {boolean} [optns.searchable=true] whether to allow search on tags.
 * @param {boolean} [optns.hide=true] whether to hide tags on toJSON.
 * @author lally elias <lallyelias87@mail.com>
 * @license MIT
 * @since 0.1.0
 * @version 0.2.0
 * @public
 * @example
 *
 * import taggable from '@lykmapipo/mongoose-taggable';
 * const UserSchema = new Schema({ name: { type: String, taggable:true } });
 * UserSchema.plugin(taggable);
 */
function taggable(schema, optns) {
  // ensure options
  const BLACKLIST = env.getStrings('TAGGABLE_BLACKLIST', []);
  const options = _.merge({}, defaultTaggableOptions, optns);
  const blacklist = [...BLACKLIST, ...options.blacklist];

  // add tags schema paths
  const { path, index, duplicate, searchable, exportable, hide, fresh, hook } =
    options;
  const type = [String];
  // eslint-disable-next-line no-param-reassign
  schema.add({
    [path]: {
      type,
      index,
      duplicate,
      searchable,
      exportable,
      hide,
      default: undefined,
    },
  });

  // collect taggable schema paths
  const taggables = collectTaggables(schema, path);
  // eslint-disable-next-line no-param-reassign
  schema.statics.TAGGABLE_FIELDS = taggables;

  /**
   * @function tag
   * @name tag
   * @description add tags to a model instance
   * @param {...string} [tags] set of tags to add to model instance
   * @author lally elias <lallyelias87@mail.com>
   * @license MIT
   * @since 0.1.0
   * @version 0.1.0
   * @instance
   * @example
   * const user = new User();
   * user.tag('js ninja', 'nodejs', 'expressjs');
   */
  // eslint-disable-next-line no-param-reassign
  schema.methods.tag = function tag(...tags) {
    // reference
    const instance = this;
    // obtain existing tags
    const oldTags = this[path] ? [...this[path]] : [];
    let $tags = fresh ? [] : oldTags;
    // merge provided tags
    $tags = [...$tags, ...tags];
    // collect tags from taggable fields
    $tags = [...$tags, ...tagFromFields(instance, taggables)];
    // remove blacklist
    $tags = removeBlacklist($tags, ...blacklist);
    // remove stopwords
    $tags = removeStopwords(...$tags);
    // set and update tags
    this[path] = $tags;
  };

  /**
   * @function untag
   * @name untag
   * @description remove tags from a model instance
   * @param {...string} tags set of tags to remove from model instance
   * @author lally elias <lallyelias87@mail.com>
   * @license MIT
   * @since 0.1.0
   * @version 0.1.0
   * @instance
   * @example
   * const user = new User();
   * user.untag('js', 'angular');
   */
  // eslint-disable-next-line no-param-reassign
  schema.methods.untag = function untag(...tags) {
    // normalize provided tags
    let $tags = normalizeTags(...tags);
    // remove from tags
    $tags = _.difference(this[path], $tags);
    // set and update tags
    this[path] = $tags;
  };

  /**
   * @function preValidate
   * @name preValidate
   * @description generate tags from taggable paths and set into tags path
   * @author lally elias <lallyelias87@mail.com>
   * @license MIT
   * @since 0.1.0
   * @version 0.1.0
   * @private
   */
  // eslint-disable-next-line no-param-reassign
  schema.pre(hook, function preValidate() {
    this.tag();
  });
}

module.exports = taggable;
