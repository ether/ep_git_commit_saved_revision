/***
*
* Responsible for negotiating messages between two clients
*
****/

const authorManager = require("../../src/node/db/AuthorManager"),
         padManager = require("../../src/node/db/PadManager"),
  padMessageHandler = require("../../src/node/handler/PadMessageHandler"),
                 db = require('ep_etherpad-lite/node/db/DB').db,
              async = require('../../src/node_modules/async');
           settings = require('../../src/node/utils/Settings');
                 fs = require('fs');
          exportTxt = require("../../src/node/utils/ExportTxt");


settings = settings.ep_git_commit_saved_revision;
if(!settings) return console.error("No ep_git_commit_saved_revision settings, see the README.md");

// Doing initialization
doInit();


/*
* Handle incoming messages from clients
*/
exports.handleMessage = async function(hook_name, context, callback){
  // Firstly ignore any request that aren't about chat
  var isgitcommitMessage = false;
  if(context){
    if(context.message && context.message){
      if(context.message.type === 'COLLABROOM'){
        if(context.message.data){
          if(context.message.data.type){
            if(context.message.data.type === 'gitcommit'){
              isgitcommitMessage = true;
            }
          }
        }
      }
    }
  }

  if(!isgitcommitMessage){
    callback(false);
    return false;
  }
  var message = context.message.data;
  console.warn("message", message)
  /***
    What's available in a message?
     * action -- The action IE chatPosition
     * padId -- The padId of the pad both authors are on
     * targetAuthorId -- The Id of the author this user wants to talk to
     * message -- the actual message
     * myAuthorId -- The Id of the author who is trying to talk to the targetAuthorId
  ***/
  if(message.action === 'sendgitcommitMessage'){
    var authorName = await authorManager.getAuthorName(message.myAuthorId); // Get the authorname
    var msg = {
      type: "COLLABROOM",
      data: {
        type: "CUSTOM",
        payload: {
          action: "recievegitcommitMessage",
          authorId: message.myAuthorId,
          authorName: authorName,
          padId: message.padId,
          message: message.message
        }
      }
    };
    saveRoomgitcommit(message.padId, message.message);
  }

  if(isgitcommitMessage === true){
    callback([null]);
  }else{
    callback(true);
  }
}

function saveRoomgitcommit(padId, message){
  // do the git logic here
  // saving to database just for posterity..
  db.set("gitcommit:"+padId, message);

  // handle the actual event
  doEvent(padId, message)
}

function sendToRoom(message, msg){
  var bufferAllows = true; // Todo write some buffer handling for protection and to stop DDoS -- myAuthorId exists in message.
  if(bufferAllows){
    setTimeout(function(){ // This is bad..  We have to do it because ACE hasn't redrawn by the time the chat has arrived
      padMessageHandler.handleCustomObjectMessage(msg, false, function(){
        // TODO: Error handling.
      })
    }
    , 100);
  }
}

function doInit(){
  var path = settings.path; // Path IE "/home/etherpad/var/git"
  var initCommandStr = settings.initCommand; // IE "git init \"${REPO_PATH}\"
  var initCommand = eval('`'+initCommandStr+'`');

  console.debug("initCommand", initCommand)

  // make path if it doesn't exists
  var fs = require('fs');
  var dir = path;

  if (!fs.existsSync(dir)){
      fs.mkdirSync(dir);
  }

  // execute a command in that folder
  const { exec } = require("child_process");

  exec(initCommand, {cwd: path}, function(error, stdout, stderr){
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
}

function doEvent(padId, message){
  var saveCommand = settings.saveCommand; // IE "git -C \"${REPO_PATH} add <PADNAME.txt> && git -C \"${REPO_PATH}\" commit -m \"${COMMIT_MESSAGE}\""
  var path = settings.path; // Path IE "/home/etherpad/var/git"
  var saveCommandStr = settings.saveCommand; // IE "git init \"${REPO_PATH}\"
  var saveCommand = eval('`'+saveCommandStr+'`');

  // make path if it doesn't exists
  var fs = require('fs');
  var dir = path;

  if (!fs.existsSync(dir)){
      fs.mkdirSync(dir);
  }

  // Write a text file to the path
  exports.getAndWrite = async function(){
    var pad = await padManager.getPad("test");
    let padText = exportTxt.getTXTFromAtext(pad, pad.atext);

    fs.writeFile(path+"/"+padId+".txt", padText, function (err) {
      if (err) return console.log(err);
    });
    // execute a command in that folder
    const { exec } = require("child_process");

    exec(saveCommand, {cwd: path}, function(error, stdout, stderr){
      if(!error) tellRoom(padId, true);
      if (error) {
        tellRoom(padId, false)
        console.log(`error: ${error.message}`);
        return;
      }
      if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
      }
    });

  }
  exports.getAndWrite();

}

function tellRoom(padId, value){
  // Tells people present on the pad that a git commit was made for this docucment.
  var msg = {
    type: "COLLABROOM",
    data: {
      type: "CUSTOM",
      payload: {
        action: "recievegitcommitMessage",
        padId: padId,
        message: value
      }
    }
  }
  padMessageHandler.handleCustomObjectMessage(msg, false, function(){
    // TODO: Something?
  })
}
