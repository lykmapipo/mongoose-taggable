'use strict';


/* dependencies */
const { Schema, Types } = require('@lykmapipo/mongoose-common');
const { model } = require('@lykmapipo/mongoose-test-helpers');
const { include } = require('@lykmapipo/include');
const { expect } = require('chai');
const taggable = include(__dirname, '..');


describe('taggable', () => {

  it('should add tags path on schema', () => {
    const schema = new Schema({ name: String });
    schema.plugin(taggable);
    const User = model(schema);

    const tags = User.path('tags');
    expect(tags).to.exist;
    expect(tags).to.be.instanceof(Types.Array);
    expect(tags.options).to.exist;
    expect(tags.options.searchable).to.be.true;
    expect(tags.options.index).to.be.true;
  });

  it('should add tags path on schema', () => {
    const schema = new Schema({ name: String });
    schema.plugin(taggable, { path: 'keywords', index: 'text' });
    const User = model(schema);

    const keywords = User.path('keywords');
    expect(keywords).to.exist;
    expect(keywords).to.be.instanceof(Types.Array);
    expect(keywords.options).to.exist;
    expect(keywords.options.searchable).to.be.true;
    expect(keywords.options.index).to.be.equal('text');
  });

});