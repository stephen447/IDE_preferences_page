import CodeMirror from "codemirror";
import "../index.css";
import 'codemirror/mode/python/python.js';
//css imports
import 'codemirror/lib/codemirror.css';
import './theme.css';
import './constTheme.css';
import 'codemirror/addon/fold/foldgutter.css'
//fold imports
import 'codemirror/addon/fold/foldcode.js'
import 'codemirror/addon/fold/foldgutter.js'
import 'codemirror/addon/fold/indent-fold.js';
//brackets imports
import 'codemirror/addon/edit/matchbrackets.js'
import 'codemirror/addon/edit/closebrackets.js'
//autocomplete imports
import 'codemirror/addon/hint/anyword-hint.js'

import './themeEditor.js'
import {setFont} from './themeEditor.js'

let startCode = 
`
def func():
    return 5

print("hello world")
`

var originalEditor = CodeMirror(document.getElementById("originalEditor"), {
    value: startCode,
    mode:  "python",
    lineNumbers: true,
    foldGutter: true,
    matchBrackets: true,
    autoCloseBrackets: true,
    showHint: true,
    gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
    theme: "constTheme"
});

var previewEditor = CodeMirror(document.getElementById("previewEditor"), {
    value: originalEditor.getDoc().linkedDoc(),
    mode:  "python",
    lineNumbers: true,
    foldGutter: true,
    matchBrackets: true,
    autoCloseBrackets: true,
    gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
    theme: "theme"
});

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