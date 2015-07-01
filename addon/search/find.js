// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

// Define find commands. Depends on searchcursor.
// implementation of the openDialog method.

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"), require("./searchcursor"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror", "./searchcursor" ], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  "use strict";
  function searchOverlay(query, caseInsensitive) {

    return {
	  token: function(stream) {
      query.lastIndex = stream.pos;
      var match = query.exec(stream.string);
      if (match && match.index == stream.pos) {
        stream.pos += match[0].length;
        return "searching";
      } else if (match) {
        stream.pos = match.index;
      } else {
        stream.skipToEnd();
      }
    }};
  }

  function SearchState() {
    this.posFrom = this.posTo = this.lastQuery = this.query = null;
    this.overlay = null;
  }
	
  function find(query, pos, options)
  {
    var state = this.getSearchState(this);
	  
    state.query = query;
	//this.removeOverlay(state.overlay);
	//state.overlay = searchOverlay(state.query);
	//this.addOverlay(state.overlay);
	  
    state.posFrom = state.posTo = pos || this.getCursor();
    CodeMirror.signal(this, 'search', state);
    this.findNext(options);
  }
	
  function findNext(options)
  {
	this.operation(function() {
      var state = this.getSearchState();
		
	  if (!state.query)
		return;
		
      var cursor = this.getSearchCursor(state.query, this.getCursor());
		
	  options = options || {};
	  options.backwards = options.forward===false;
    
	  if (!cursor.find(options.backwards))
	  {
        cursor = this.getSearchCursor(state.query, {
		  line: options.backwards ? this.lastLine() : 0,
		  ch: 0 }
		);
		  
        if (!cursor.find(options.backwards)) return;
      }
	  var to = cursor.to();
	  to.ch = to.ch-1;
		
      this.setCursor(options.backwards ? cursor.from() : to);
      this.scrollIntoView({from: cursor.from(), to: cursor.to()}, 60);
      state.posFrom = cursor.from(); state.posTo = cursor.to();
    }, this);
  }
	
  function getSearchState()
  {
    return this.state.search || (this.state.search = new SearchState());
  }
	
  CodeMirror.defineExtension('find', find);
  CodeMirror.defineExtension('findNext', findNext);
  CodeMirror.defineExtension('getSearchState', getSearchState);
	
  CodeMirror.commands.findNext = function(cm) { cm.findNext(); };
  CodeMirror.commands.findPrev = function(cm) { cm.findNext({ backwards: true }); };
/*
  CodeMirror.commands.find = function(cm) {clearSearch(cm); doSearch(cm);};
  CodeMirror.commands.clearSearch = clearSearch;
  CodeMirror.commands.replace = replace;
  CodeMirror.commands.replaceAll = function(cm) {replace(cm, true);};
  */
});