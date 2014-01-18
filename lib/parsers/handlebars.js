"use strict";

// Turn handlebars helper calls into javascript-syntax functions.
// Also comment blocks are turned into javascript comments.
function parseHandlebars(str) {
  // Using regexes for parsing, ooooh yeeeahhh!
  // Short comments:  {{! this is a comment }}
  var shortCommentRE = /\{\{\!(.*?)\}\}/;
  // Long comments:  {{!-- this comment has {{markup}} in it --}}
  var longCommentRE = /\{\{\!--(.*?)--\}\}/;
  // Block helpers:  {{#helper}}template content{{/helper}}
  var blockHelperStartRE = /\{\{#(\w+)\}\}/;
  var blockHelperEndRE = /\{\{\/(\w+)\}\}/;
  // Function helpers:  {{ helper value }} or {{ helper "some string" }}
  var singleQuotedStringWithEscapes = "'(([^']*?(\\\\')?)+)'";
  var doubleQuotedStringWithEscapes = '"(([^"]*?(\\\\")?)+)"';
  var funcHelperRE = new RegExp("\\{\\{\\s*(\\w+)\\s+((\\w+)|(" +
                                singleQuotedStringWithEscapes + ")|(" +
                                doubleQuotedStringWithEscapes + "))\\s*\\}\\}");

  var buf = [];
  var match = null;

  function addComment(comment) {
    buf.push("//");
    buf.push(comment);
    buf.push("\n");
  }

  while (str.length) {
    // Find the earliest match of any type of tag in the string.
    match = str.match(shortCommentRE);
    if (match) {
      match.type = 'comment';
    }
    var nextMatch = str.match(longCommentRE);
    if (nextMatch) {
      if (!match || nextMatch.index < match.index) {
        match = nextMatch;
        match.type = 'comment';
      }
    }
    nextMatch = str.match(blockHelperStartRE);
    if (nextMatch) {
      if (!match || nextMatch.index < match.index) {
        match = nextMatch;
        match.type = 'block';
      }
    }
    nextMatch = str.match(funcHelperRE);
    if (nextMatch) {
      if (!match || nextMatch.index < match.index) {
        match = nextMatch;
        match.type = 'func';
      }
    }
    if (!match) {
      break;
    }
    str = str.substring(match.index + match[0].length);

    // Translate the match into an appropriate chunk of javascript.
    if (match.type === 'comment') {
      // Template comment => javascript comment
      match[1].split("\n").forEach(addComment);
    } else if (match.type === 'block') {
      // Template block helper => javascript function call
      var helperName = match[1];
      buf.push(helperName);
      buf.push('("');
      var endMatch = str.match(blockHelperEndRE);
      while (endMatch && endMatch[1] !== helperName) {
        var skipTo = endMatch.index + endMatch[0].length;
        buf.push(str.substring(0, skipTo).replace('"', '\\"'));
        str = str.substring(skipTo);
        endMatch = str.match(blockHelperEndRE);
      }
      if (endMatch) {
        buf.push(str.substring(0, endMatch.index).replace('"', '\\"'));
        str = str.substring(endMatch.index + endMatch[0].length);
      } else {
        buf.push(str.replace('"', '\\"'));
        str = '';
      }
      buf.push('")\n');
    } else if (match.type === 'func') {
      // Template function helper => javascript function call
      buf.push(match[1]);
      buf.push('(');
      buf.push(match[2]);
      buf.push(')\n');
    }
  }

  return buf.join('');
}

// generate extracted strings file from Handlebars/Mustache templates
exports.handlebars = function Handlebars(hbSources, options) {
  Object.keys(hbSources).forEach(function (filename) {
    hbSources[filename] = parseHandlebars(hbSources[filename]);
  });

  return [hbSources, options];
};