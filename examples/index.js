import { Schema, model } from '@lykmapipo/mongoose-common';
import taggable from '../src';

const RepoSchema = new Schema({ name: { type: String, taggable: true } });
RepoSchema.plugin(taggable);
const Repo = model('Repo', RepoSchema);

const repo = new Repo({ name: 'any-js' });
repo.tag();
repo.tag('js', 'nodejs', 'express', 'mongodb');
repo.untag('angular');
