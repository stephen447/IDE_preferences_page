// index.js contains the code for the two editors & for font size & style submission

import CodeMirror from "codemirror";
import "../index.css";
import 'codemirror/mode/python/python.js';
//css imports
import 'codemirror/lib/codemirror.css';
import './theme.css';
import './constTheme.css';
import 'codemirror/addon/fold/foldgutter.css'
import 'codemirror/addon/dialog/dialog.css'
import 'codemirror/addon/hint/show-hint.css'
import 'codemirror/addon/lint/lint.css'
//fold imports
import 'codemirror/addon/fold/foldcode.js'
import 'codemirror/addon/fold/foldgutter.js'
import 'codemirror/addon/fold/indent-fold.js';
//brackets imports
import 'codemirror/addon/edit/matchbrackets.js'
import 'codemirror/addon/edit/closebrackets.js'
//search imports
import 'codemirror/addon/dialog/dialog.js'
import 'codemirror/addon/search/search.js'
import 'codemirror/addon/search/searchcursor.js'
//auto complete
import 'codemirror/addon/hint/show-hint.js'
import { hintFunc } from "./hinting.js";
//linting
import 'codemirror/addon/lint/lint.js'
import { parse } from "./errorChecker.js"

import './themeEditor.js'
import {setFont} from './themeEditor.js'

//initial code put into the editor
let startCode = 
`
def func(test):
    return 5

if 2 < 3:
    print("hello")
elif 2 > 3:
    print("goodbye")
else:
    print("hello goodbye")

while False:
    func()

func()
`

//the editor on the left, does not respond to CSS changes
var originalEditor = CodeMirror(document.getElementById("originalEditor"), {
    value: startCode,
    mode:  "python",
    lineNumbers: true,
    foldGutter: true,
    matchBrackets: true,
    autoCloseBrackets: true,
    search: true,
    lint: true, //uses CodeMirror.lint.mode, in this case CodeMirror.lint.python
    extraKeys: {
        "Esc": function(cm) {cm.display.input.blur()},  //leave focus on the editor with Esc
        "Ctrl-Space": async function(cm) { cm.showHint({
            hint: hintFunc,         // show autocompletion
            completeSingle: false   //does not autocomplete when there is only a single match
        })}
    },
    gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter", "CodeMirror-lint-markers"],
    theme: "constTheme"
});

//the editor on the right, DOES respond to CSS changes
var previewEditor = CodeMirror(document.getElementById("previewEditor"), {
    value: originalEditor.getDoc().linkedDoc(), //makes changes in one affect the other
    mode:  "python",
    lineNumbers: true,
    foldGutter: true,
    matchBrackets: true,
    autoCloseBrackets: true,
    search: true,
    lint: true,
    extraKeys: {
        "Esc": function(cm) {cm.display.input.blur()},
        "Ctrl-Space": async function(cm) { cm.showHint({
            hint: hintFunc,
            completeSingle: false
        })}
    },
    gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter", "CodeMirror-lint-markers"],
    theme: "theme"
});

//for submitting font size & font style
const fontSizeForm = document.getElementById("fontSizeForm");
fontSizeForm.addEventListener('submit', (e) => {

  //stop page refresh on submit
  e.preventDefault();

  let index = e.target.fonts.selectedIndex;
  let font = e.target.fonts[index].value;
  let fontSize = e.target.quantity.value;

  setFont(`${fontSize}pt`, font)
  
  //keep things working properly
  originalEditor.refresh();
  previewEditor.refresh();
  
});

