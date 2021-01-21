'use strict';

const eejs = require('ep_etherpad-lite/node/eejs/');

exports.eejsBlock_body = (hookName, args, cb) => {
  args.content = eejs.require('ep_git_commit_saved_revision/templates/modals.ejs',
      {settings: false}
  ) + args.content;
  cb();
};
