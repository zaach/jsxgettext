
# jsxgettext

A node module with a CLI that extracts gettext strings from JavaScript and EJS files. It also extracts comments that begin with "L10n:" when they appear above a `gettext` call.

Install:

  git clone https://github.com/zaach/jsxgettext.git
  cd jsxgettext
  npm link

Use:
  jsxgettext wait-messages.js
