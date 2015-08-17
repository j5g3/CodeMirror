// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  var modes = ["clike", "css", "javascript"];

  for (var i = 0; i < modes.length; ++i)
    CodeMirror.extendMode(modes[i], {blockCommentContinue: " * "});
  
  function continueComment(cm) {
    if (cm.getOption("disableInput")) return CodeMirror.Pass;
    var ranges = cm.listSelections(), mode, inserts = [];
    for (var i = 0; i < ranges.length; i++) {
      var pos = ranges[i].head, token = cm.getTokenAt(pos);
      if (token.type != "comment") return CodeMirror.Pass;
      var modeHere = CodeMirror.innerMode(cm.getMode(), token.state).mode;
      if (!mode) mode = modeHere;
      else if (mode != modeHere) return CodeMirror.Pass;

      var insert = null;
      if (mode.blockCommentStart && mode.blockCommentContinue) {
        var end = token.string.indexOf(mode.blockCommentEnd);
        var full = cm.getRange(CodeMirror.Pos(pos.line, 0), CodeMirror.Pos(pos.line, token.end)), found;
        if (end != -1 && end == token.string.length - mode.blockCommentEnd.length && pos.ch >= end) {
          // Comment ended, don't continue it
        } else if (token.string.indexOf(mode.blockCommentStart) == 0) {
          insert = full.slice(0, token.start);
          if (!/^\s*$/.test(insert)) {
            insert = "";
            for (var j = 0; j < token.start; ++j) insert += " ";
          }
        } else if ((found = full.indexOf(mode.blockCommentContinue)) != -1 &&
                   found + mode.blockCommentContinue.length > token.start &&
                   /^\s*$/.test(full.slice(0, found))) {
          insert = full.slice(0, found);
        }
        if (insert != null) insert += mode.blockCommentContinue;
      }
      if (insert == null && mode.lineComment && continueLineCommentEnabled(cm)) {
        var line = cm.getLine(pos.line), found = line.indexOf(mode.lineComment);
        if (found > -1) {
          insert = line.slice(0, found);
          if (/\S/.test(insert)) insert = null;
          else insert += mode.lineComment + line.slice(found + mode.lineComment.length).match(/^\s*/)[0];
        }
      }
      if (insert == null) return CodeMirror.Pass;
      inserts[i] = "\n" + insert;
    }

    cm.operation(function() {
      for (var i = ranges.length - 1; i >= 0; i--)
        cm.replaceRange(inserts[i], ranges[i].from(), ranges[i].to(), "+insert");
    });
  }

  function continueLineCommentEnabled(cm) {
    var opt = cm.getOption("continueComments");
    if (opt && typeof opt == "object")
      return opt.continueLineComment !== false;
    return true;
  }
  
  function eachComment(cm, fn)
  {
    if (cm.getOption("disableInput")) return CodeMirror.Pass;
    
    var ranges = cm.listSelections(), i, range, token, pos, line, start, result, inserts = [];
    
    for (i = 0; i < ranges.length; i++)
    {
      range = ranges[i];
    	pos = range.head;
      start = CodeMirror.Pos(pos.line, 0);
      token = cm.getTokenAt(range.head);
      line = cm.getRange(start, CodeMirror.Pos(pos.line, token.end));
      
      if (token.type === "comment" && (result = fn(line, token)))
        inserts.push({ start: start, end: CodeMirror.Pos(pos.line, token.end), insert: result });
    }
    
    if (inserts.length===0)
      return CodeMirror.Pass;
    
    cm.operation(function() {
      for (i = inserts.length - 1; i >= 0; i--)
        cm.replaceRange(inserts[i].insert, inserts[i].start, inserts[i].end, "+insert");
    });
  }
  
  function closeComment(line, token)
  {
    var m = /^(\s*\*)(\s*)$/.exec(line);
    return m && (m[1] + '/' );
  }
  
  function closeCommentHandler(cm) {
    return eachComment(cm, closeComment);
  }

  CodeMirror.defineOption("continueComments", true, function(cm, val, prev) {
    if (prev && prev != CodeMirror.Init)
      cm.removeKeyMap("continueComment");
    if (val) {
      var key = "enter";
      if (typeof val == "string")
        key = val;
      else if (typeof val == "object" && val.key)
        key = val.key;
      var map = {name: "continueComment"};
      map[key] = continueComment;
      map['/'] = closeCommentHandler;
      
      cm.addKeyMap(map);
    }
  });
});
