import React from "react";

var simple = (
  <div>
    <h1>{gettext('inside h1')}</h1>
    <div id={gettext('inside attribute')}></div>
  </div>
);



export default (
    <main>
      <header>{gettext('inside header')}</header>
      <footer id={gettext('inside footer attribute')}></footer>
    </main>
);
