# Saved Revision Hooks

Perform tasks when you hit saved revision.

## Example Settings.json for committing to git
```
  /*
    Available variables to plugin are:
    * padId = The ID of the Pad you are working on IE "foo"
    * message = the message IE "Hello world"
    * path = The path defined in the settings blob
  */
  "ep_git_commit_saved_revision":{
    "path":"/home/jose/develop/var/git",
    "initCommand":"git init ${path}",
    "saveCommand":"git -C \"${path}\" add \"${padId}.txt\" && git -C \"${path}\" commit -m \"${message}\""
  }
```

## Installation
1. Install using http://%youretherpad%/admin/plugins or ``npm install ep_git_commit_saved_revision``
1. Copy / paste above settings example into the bottom of settings.json

## TODO
* i18n support
* Clean up
* More hook example

## License
Apache 2
