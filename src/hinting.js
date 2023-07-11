// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/5/LICENSE
import CodeMirror from "codemirror";

//TODO: analyze the efficiency of this
    // look for lag on large values

var WORD = /[\w$]+/, RANGE = 500;
var initList = ["apple", "banana", "cantelope", "dandelion", "elephant"];

//hintFunc is an edited version of CodeMirror's anyword-hint
export function hintFunc(editor, options) {
    var word = options && options.word || WORD;
    var range = options && options.range || RANGE;
    var cur = editor.getCursor(), curLine = editor.getLine(cur.line);

    //end is cursor character ( guessing that ch is character )
    var end = cur.ch

    //start at the end, and move start back until you reach the start of the word
    var start = end;
    while (start && word.test(curLine.charAt(start - 1))) --start;

    //curWord checks to make sure start doesn't equal end, then slices the line to get the whole word 
        // is a boolean if start != end, otherwise is a string? untyped languages are wild
    var curWord = start != end && curLine.slice(start, end);
    var list = options && options.list || [];

    var seen = {};
    var re = new RegExp(word.source, "g");

    //if there is no word (blank), just put the whole init list in
    if(!curWord)
    {
        list.push(...initList);
    }
    //the user has started typing a word, so push stuff that matches
    else
    {

        for(let i = 0; i < initList.length; i++)
        {
            //if the user is starting to type a part of the word, look for it
            if(initList[i].lastIndexOf(curWord, 0) == 0)
            {
                list.push(initList[i]);
            }
    
        }
    }

    //for words within the document
    for (var dir = -1; dir <= 1; dir += 2) {

        //get the line and the end line
        var line = cur.line
        var endLine = Math.min(Math.max(line + dir * range, editor.firstLine()), editor.lastLine()) + dir;

        //go over the lines (forward, then backward)
        for (; line != endLine; line += dir) {

            //the text on the line
            var text = editor.getLine(line)
            var m;

            //while there is a match in the line
            while (m = re.exec(text)) {

                //skip if the line is the current line and the first match is the current word
                if (line == cur.line && m[0] === curWord) continue;

                //if curWord is a string, then !curWord is false
                //1st half of &&: short circuits if curWord is a boolean, otherwise checks the match
                //second half: check if it's been seen before
                if ((!curWord || m[0].lastIndexOf(curWord, 0) == 0) && !Object.prototype.hasOwnProperty.call(seen, m[0])) {
                    seen[m[0]] = true;
                    list.push(m[0]);
                }
            }

        }
    }

    return {list: list, from: CodeMirror.Pos(cur.line, start), to: CodeMirror.Pos(cur.line, end)};
}
    
  