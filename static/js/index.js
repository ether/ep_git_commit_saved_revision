exports.handleClientMessage_CUSTOM = function(hook, context, cb){
  if(context.payload.action == "recievegitcommitMessage"){
    var message = context.payload.message;
    if(message === true){
      $.gritter.add({
        title: "Saved Revision Status",
        text: "Saved",
        sticky: false
      })
    }else{
      $.gritter.add({
        title: "Saved Revision Status",
        text: "Failed!!!"
      })
    }
  }
}

exports.documentReady = function(){
  $('body').on('click', '.buttonicon-savedRevision', function(){
    $('#gitcommitModal').addClass('popup-show');
    $('#input_gitcommit').focus();
  }); // fine for click but can't say Cntrl S to save revision?

  if (!$('#editorcontainerbox').hasClass('flex-layout')) {
      $.gritter.add({
          title: "Error",
          text: "ep_git_commit_saved_revision: Please upgrade to etherpad 1.8 for this plugin to work correctly",
          sticky: true,
          class_name: "error"
      })
  }

  $('#dogitcommit').click(function(){
    $('#gitcommitModal').removeClass('popup-show');
    sendgitcommit();
  });

}

function sendgitcommit(){
  var myAuthorId = pad.getUserId();
  var padId = pad.getPadId();
  var message = $('#gitcommitSrc').val();
  // Send chat message to send to the server
  var message = {
    type : 'gitcommit',
    action : 'sendgitcommitMessage',
    message : message,
    padId : padId,
    myAuthorId : myAuthorId
  }
  pad.collabClient.sendMessage(message);  // Send the chat position message to the server
}
