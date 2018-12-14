'use strict';


/* dependencies */
const { Schema, SchemaTypes } = require('@lykmapipo/mongoose-common');
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
    expect(tags).to.be.instanceof(SchemaTypes.Array);
    expect(tags.options).to.exist;
    expect(tags.options.searchable).to.be.true;
    expect(tags.options.index).to.be.true;
  });

  it('should add tags path on schema with options', () => {
    const schema = new Schema({ name: String });
    schema.plugin(taggable, { path: 'keywords', index: 'text' });
    const User = model(schema);

    const keywords = User.path('keywords');
    expect(keywords).to.exist;
    expect(keywords).to.be.instanceof(SchemaTypes.Array);
    expect(keywords.options).to.exist;
    expect(keywords.options.searchable).to.be.true;
    expect(keywords.options.index).to.be.equal('text');
  });

  it('should collect taggable paths', () => {
    const schema = new Schema({ name: { type: String, taggable: true } });
    schema.plugin(taggable);
    const User = model(schema);

    expect(User.TAGGABLE_FIELDS).to.exist;
    expect(User.TAGGABLE_FIELDS.name).to.exist;
  });

  it('should not collect non taggable paths', () => {
    const schema = new Schema({ name: String });
    schema.plugin(taggable);
    const User = model(schema);

    expect(User.TAGGABLE_FIELDS).to.exist;
    expect(User.TAGGABLE_FIELDS.name).to.not.exist;
  });

  it('should be able to tag', () => {
    const schema = new Schema({ name: String });
    schema.plugin(taggable);
    const User = model(schema);

    const user = new User();
    user.tag('js', 'nodejs');
    expect(user.tags).to.include('js');
    expect(user.tags).to.include('nodejs');
  });

  it('should be able to tag', () => {
    const schema = new Schema({ name: String });
    schema.plugin(taggable);
    const User = model(schema);

    const user = new User();
    user.tag('js ninja', 'nodejs');
    expect(user.tags).to.include('js');
    expect(user.tags).to.include('ninja');
    expect(user.tags).to.include('nodejs');
  });

  it('should be able to tag and remove stopwords', () => {
    const schema = new Schema({ name: String });
    schema.plugin(taggable);
    const User = model(schema);

    const user = new User();
    user.tag('js and ninja', 'nodejs with express');
    expect(user.tags).to.include('js');
    expect(user.tags).to.not.include('and');
    expect(user.tags).to.include('ninja');
    expect(user.tags).to.include('nodejs');
    expect(user.tags).to.not.include('with');
    expect(user.tags).to.include('express');
  });

  it('should be able to tag and remove stopwords', () => {
    const schema = new Schema({ name: String });
    schema.plugin(taggable);
    const User = model(schema);

    const user = new User();
    user.tag('js na ninja', 'nodejs na express');
    expect(user.tags).to.include('js');
    expect(user.tags).to.not.include('na');
    expect(user.tags).to.include('ninja');
    expect(user.tags).to.include('nodejs');
    expect(user.tags).to.include('express');
  });

  it('should be able to tag', () => {
    const schema = new Schema({ name: String });
    schema.plugin(taggable);
    const User = model(schema);

    const user = new User();
    user.tag('JS', 'NODEJS');
    expect(user.tags).to.include('js');
    expect(user.tags).to.not.include('JS');
    expect(user.tags).to.include('nodejs');
    expect(user.tags).to.not.include('NODEJS');
  });

  it('should be able to untag', () => {
    const schema = new Schema({ name: String });
    schema.plugin(taggable);
    const User = model(schema);

    const user = new User();
    user.tag('js', 'nodejs');
    user.untag('js');
    expect(user.tags).to.include('nodejs');
    expect(user.tags).to.not.include('js');
  });

  it('should collect tags from taggable paths', () => {
    const schema = new Schema({ name: { type: String, taggable: true } });
    schema.plugin(taggable);
    const User = model(schema);

    const user = new User({ name: 'John Boe' });
    user.tag();
    expect(user.tags).to.include('john');
    expect(user.tags).to.include('boe');
  });

  it('should collect tags from taggable array paths', () => {
    const schema = new Schema({ interests: { type: [String], taggable: true } });
    schema.plugin(taggable);
    const User = model(schema);

    const user = new User({ interests: ['Cooking', 'Talking'] });
    user.tag();
    expect(user.tags).to.include('cooking');
    expect(user.tags).to.include('talking');
  });

  it('should collect tags from taggable map paths', () => {
    const schema = new Schema({
      properties: {
        type: Map,
        of: String,
        taggable: true
      }
    });
    schema.plugin(taggable);
    const User = model(schema);

    const user = new User({ properties: { 'given': 'John', 'surname': 'Boe' } });
    user.tag();
    expect(user.tags).to.include('john');
    expect(user.tags).to.include('boe');
  });

  it('should collect tags from taggable sub paths', () => {
    const schema = new Schema({
      name: {
        given: { type: String, taggable: true },
        surname: { type: String, taggable: true }
      }
    });
    schema.plugin(taggable);
    const User = model(schema);

    const user = new User({ name: { given: 'John', surname: 'Boe' } });
    user.tag();
    expect(user.tags).to.include('john');
    expect(user.tags).to.include('boe');
  });

  it('should collect tags from taggable subdoc paths', () => {
    const schema = new Schema({
      name: new Schema({
        given: { type: String, taggable: true },
        surname: { type: String, taggable: true }
      })
    });
    schema.plugin(taggable);
    const User = model(schema);

    const user = new User({ name: { given: 'John', surname: 'Boe' } });
    user.tag();
    expect(user.tags).to.include('john');
    expect(user.tags).to.include('boe');
  });

  it('should collect tags from taggable ref', () => {
    const UserSchema = new Schema({ name: { type: String, taggable: true } });
    UserSchema.plugin(taggable);
    const User = model(UserSchema);

    const PostSchema = new Schema({
      title: { type: String, taggable: true },
      author: {
        type: SchemaTypes.ObjectId,
        ref: User.modelName,
        taggable: true
      }
    });
    PostSchema.plugin(taggable);
    const Post = model(PostSchema);

    const author = new User({ name: 'John Boe' });
    const post = new Post({ title: 'JS Talks', author: author });
    post.tag();
    expect(post.tags).to.include('john');
    expect(post.tags).to.include('boe');
    expect(post.tags).to.include('js');
    expect(post.tags).to.include('talks');
  });

  it('should collect tags from taggable ref', () => {
    const UserSchema = new Schema({ name: { type: String, taggable: true } });
    UserSchema.plugin(taggable);
    const User = model(UserSchema);

    const PostSchema = new Schema({
      title: { type: String, taggable: true },
      author: {
        type: SchemaTypes.ObjectId,
        ref: User.modelName,
        taggable: true
      }
    });
    PostSchema.plugin(taggable);
    const Post = model(PostSchema);

    const author = new User({ name: 'John Boe' });
    const post = new Post({ title: 'JS Talks', author: author._id });
    post.tag();
    expect(post.tags).to.not.include('john');
    expect(post.tags).to.not.include('boe');
    expect(post.tags).to.include('js');
    expect(post.tags).to.include('talks');
  });

});