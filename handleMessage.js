'use strict';

const padManager = require('ep_etherpad-lite/node/db/PadManager');
const padMessageHandler = require('ep_etherpad-lite/node/handler/PadMessageHandler');
const db = require('ep_etherpad-lite/node/db/DB').db;
const settingsStr = require('ep_etherpad-lite/node/utils/Settings');
const exportTxt = require('ep_etherpad-lite/node/utils/ExportTxt');
const settings = settingsStr.ep_git_commit_saved_revision;
if (!settings) return console.error('No ep_git_commit_saved_revision settings, see the README.md');

// Doing initialization
doInit();

/*
* Handle incoming messages from clients
*/
exports.handleMessage = (hook_name, context, callback) => {
  // Firstly ignore any request that aren't about chat
  let isgitcommitMessage = false;
  if (context) {
    if (context.message && context.message) {
      if (context.message.type === 'COLLABROOM') {
        if (context.message.data) {
          if (context.message.data.type) {
            if (context.message.data.type === 'gitcommit') {
              isgitcommitMessage = true;
            }
          }
        }
      }
    }
  }

  if (!isgitcommitMessage) {
    callback(false);
  }

  if (isgitcommitMessage) {
    const message = context.message.data;
    if (message.action === 'sendgitcommitMessage') {
      saveRoomgitcommit(message.padId, message.message);
    }
    callback([null]);
  }
};

const saveRoomgitcommit = (padId, message) => {
  // do the git logic here
  // saving to database just for posterity..
  db.set(`gitcommit:${padId}`, message);

  // handle the actual event
  doEvent(padId, message);
};

const doInit = () => {
  const path = settings.path; // Path IE "/home/etherpad/var/git"
  const initCommandStr = settings.initCommand; // IE "git init \"${REPO_PATH}\"
  const initCommand = eval(`\`${initCommandStr}\``); /* eslint-disable-line no-eval */

  console.debug('initCommand', initCommand);

  // make path if it doesn't exists
  const fs = require('fs');
  const dir = path;

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }

  // execute a command in that folder
  const {exec} = require('child_process');

  exec(initCommand, {cwd: path}, (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
  });
};

const doEvent = (padId, message) => {
  // IE "git -C \"${REPO_PATH} add <PADNAME.txt> &&
  // git -C \"${REPO_PATH}\" commit -m \"${COMMIT_MESSAGE}\""
  let saveCommand = settings.saveCommand;
  const path = settings.path; // Path IE "/home/etherpad/var/git"
  const saveCommandStr = settings.saveCommand; // IE "git init \"${REPO_PATH}\"
  saveCommand = eval(`\`${saveCommandStr}\``); /* eslint-disable-line no-eval */

  // make path if it doesn't exists
  const fs = require('fs');
  const dir = path;

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }

  // Write a text file to the path
  exports.getAndWrite = async () => {
    const pad = await padManager.getPad(padId);
    const padText = exportTxt.getTXTFromAtext(pad, pad.atext);

    fs.writeFile(`${path}/${padId}.txt`, padText, (err) => {
      if (err) return console.log(err);
    });
    // execute a command in that folder
    const {exec} = require('child_process');

    exec(saveCommand, {cwd: path}, (error, stdout, stderr) => {
      if (!error) tellRoom(padId, true);
      if (error) {
        tellRoom(padId, false);
        console.log(`error: ${error.message}`);
        return;
      }
      if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
      }
    });
  };
  exports.getAndWrite();
};

const tellRoom = (padId, value) => {
  // Tells people present on the pad that a git commit was made for this docucment.
  const msg = {
    type: 'COLLABROOM',
    data: {
      type: 'CUSTOM',
      payload: {
        action: 'recievegitcommitMessage',
        padId,
        message: value,
      },
    },
  };
  padMessageHandler.handleCustomObjectMessage(msg, false, () => {
    // TODO: Something?
  });
};
