'use strict';

exports.handleClientMessage_CUSTOM = (hook, context, cb) => {
  if (context.payload.action === 'recievegitcommitMessage') {
    const message = context.payload.message;
    if (message === true) {
      $.gritter.add({
        title: 'Saved Revision Status',
        text: 'Saved',
        sticky: false,
      });
    } else {
      $.gritter.add({
        title: 'Saved Revision Status',
        text: 'Failed!!!',
      });
    }
  }
};

const sendgitcommit = () => {
  const myAuthorId = pad.getUserId();
  const padId = pad.getPadId();
  const srcMessage = $('#gitcommitSrc').val();
  // Send chat message to send to the server
  const message = {
    type: 'gitcommit',
    action: 'sendgitcommitMessage',
    message: srcMessage,
    padId,
    myAuthorId,
  };
  pad.collabClient.sendMessage(message); // Send the chat position message to the server
};

exports.documentReady = () => {
  $('body').on('click', '.buttonicon-savedRevision', () => {
    $('#gitcommitModal').addClass('popup-show');
    $('#input_gitcommit').focus();
  });
  // fine for click but can't say Cntrl S to save revision?

  if (!$('#editorcontainerbox').hasClass('flex-layout')) {
    $.gritter.add({
      title: 'Error',
      text: 'ep_git_commit_saved_revision: Upgrade to etherpad 1.8',
      sticky: true,
      class_name: 'error',
    });
  }

  $('#dogitcommit').click(() => {
    $('#gitcommitModal').removeClass('popup-show');
    sendgitcommit();
  });
};
