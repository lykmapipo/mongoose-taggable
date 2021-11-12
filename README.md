# mongoose-taggable

[![Build Status](https://app.travis-ci.com/lykmapipo/mongoose-taggable.svg?branch=master)](https://app.travis-ci.com/lykmapipo/mongoose-taggable)
[![Dependencies Status](https://david-dm.org/lykmapipo/mongoose-taggable.svg)](https://david-dm.org/lykmapipo/mongoose-taggable)
[![Coverage Status](https://coveralls.io/repos/github/lykmapipo/mongoose-taggable/badge.svg?branch=master)](https://coveralls.io/github/lykmapipo/mongoose-taggable?branch=master)
[![GitHub License](https://img.shields.io/github/license/lykmapipo/mongoose-taggable)](https://github.com/lykmapipo/mongoose-taggable/blob/develop/LICENSE)

[![Commitizen Friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![Code Style](https://badgen.net/badge/code%20style/airbnb/ff5a5f?icon=airbnb)](https://github.com/airbnb/javascript)
[![npm version](https://img.shields.io/npm/v/@lykmapipo/mongoose-taggable)](https://www.npmjs.com/package/@lykmapipo/mongoose-taggable)

mongoose plugin to add tags and taggable behaviour. 

## Requirements

- [NodeJS v13+](https://nodejs.org)
- [Npm v6.12+](https://www.npmjs.com/)
- [MongoDB v4+](https://www.mongodb.com/)
- [Mongoose v6+](https://github.com/Automattic/mongoose)

## Install
```sh
$ npm install --save mongoose @lykmapipo/mongoose-taggable
```

## Usage

```javascript
import mongoose from 'mongoose';
import taggable from '@lykmapipo/mongoose-taggable';

const RepoSchema = new Schema({ name: { type: String, taggable: true } });
RepoSchema.plugin(taggable);
const Repo = mongoose.model('Repo', RepoSchema);

const repo = new Repo({ name: 'any-js'});
repo.tag();
repo.tag('js', 'nodejs', 'express', 'mongoose');
repo.untag('angular');
```

## API

### `taggable(schema: Schema, [options: Object])`
A taggable schema plugin. Once applied to a schema will allow to compute tags from `taggable` schema field and and `tag` and `untag` instance methods

#### `options: Object`
- `blacklist: String | String[]` - List of word(s) not allowed to be used for tagging.
- `fresh: Boolean` - Whether to recompute fresh tags. Default to `false`.
- `hook: String` - When to run tagging hook. Default to pre `validate`.

Example
```js
const RepoSchema = new Schema({ name: { type: String, taggable: true } });
RepoSchema.plugin(taggable);
const Repo = mongoose.model('Repo', RepoSchema);

const RepoSchema = new Schema({ name: { type: String, taggable: true } });
RepoSchema.plugin(taggable, { blacklist: ['unknown'] });
const Repo = mongoose.model('Repo', RepoSchema);
```


### `tag(...tag: String)`
Tag a model instance with provided tags

Example:
```js
user.tag('js', 'dev', 'conf');
```

### `untag(...tag: String)`
Untag a model instance to not include provided tags

Example:
```js
user.untag('conf');
```

## Testing
* Clone this repository

* Install all development dependencies
```sh
$ npm install
```
* Then run test
```sh
$ npm test
```

## Contribute
It will be nice, if you open an issue first so that we can know what is going on, then, fork this repo and push in your ideas. Do not forget to add a bit of test(s) of what value you adding.

## Licence
The MIT License (MIT)

Copyright (c) lykmapipo & Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE. 
