import { Meteor } from 'meteor/meteor';
import { FilesCollection } from 'meteor/ostrio:files';
import { createFilesCollection } from 'meteor/unchained:core-files';

export const Avatars = createFilesCollection('avatars', {
  maxSize: 10485760,
  extensionRegex: /png|jpg|jpeg/i,
});

export const Users = Meteor.users;
