/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
BrowserID.Wait = (function(){
  "use strict";

  var Wait = {
    authentication: {
      /* L10n: test block */
      title: gettext("Finishing Sign In..."),
      message:  gettext("In just a moment you'll be signed into BrowserID.")
    },

    generateKey: {
      title:  gettext("Finishing Sign In..."),
      /* L10n: test multi
       * line */
      message:  gettext("Please wait a few seconds while we sign you into the site.")
    },

    slowXHR: {
      // L10n: test single line comment
      title:  gettext("We are sorry, this request is taking a LOOONG time."),
      // ignore this comment
      message:  _("This message will go away when the request completes (hopefully soon). If you wait too long, close this window and try again."),
      id: "slowXHR"
    }

  };


  return Wait;
}());


