"use strict";

// Turn handlebars helper calls into javascript-syntax functions.
// Also comment blocks are turned into javascript comments.
function parseHandlebars(str, recurse) {
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

  // an unescaped double quote starts with anything but an escape (\) or nothing
  var unescapedDoubleQuote = /([^\\])"|^"/g;

  var buf = [];
  var tempBuf;
  var match = null;

  function addComment(comment) {
    buf.push("//");
    buf.push(comment);
    buf.push("\n");
  }

  function escapeQuotes(str) {
    return str.replace(unescapedDoubleQuote, function (match, group) {
      var prefix = group || '';
      return prefix + '\\"';
    });
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
      if (recurse) buf.push(str.replace(/\n/g, '\\n'));
      break;
    } else if (recurse) {
      buf.push(str.substring(0, match.index).replace(/\n/g, '\\n'));
    }
    str = str.substring(match.index + match[0].length);


    // Translate the match into an appropriate chunk of javascript.
    if (match.type === 'comment') {
      // Template comment => javascript comment
      match[1].split("\n").forEach(addComment);
    } else if (match.type === 'block') {
      if (recurse) buf.push('" + ');
      // Template block helper => javascript function call
      var helperName = match[1];
      buf.push(helperName);
      buf.push('("');

      tempBuf = [];

      var endMatch = str.match(blockHelperEndRE);

      while (endMatch && endMatch[1] !== helperName) {
        var skipTo = endMatch.index + endMatch[0].length;
        tempBuf.push(str.substring(0, skipTo));
        str = str.substring(skipTo);
        endMatch = str.match(blockHelperEndRE);
      }

      if (endMatch) {
        tempBuf.push(str.substring(0, endMatch.index));
        str = str.substring(endMatch.index + endMatch[0].length);
      } else {
        tempBuf.push(str);
        str = '';
      }

      var result = parseHandlebars(escapeQuotes(tempBuf.join('')), true);
      buf.push(result);

      buf.push('")\n');
      if (recurse) buf.push(' + "');

    } else if (match.type === 'func') {
      if (recurse) buf.push('" + ');
      // Template function helper => javascript function call
      buf.push(match[1]);
      buf.push('(');
      buf.push(match[2]);
      buf.push(')\n');
      if (recurse) buf.push(' + "');
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
