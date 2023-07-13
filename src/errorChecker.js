import CodeMirror from "codemirror";
import { pythonBuiltinFunctions } from "./unavailableKeywords";

//uses this python grammar: https://docs.python.org/3/reference/grammar.html

//registers it so that CodeMirror.lint.python = the parse function
CodeMirror.registerHelper("lint", "python", parse);

//TODO: check efficiency of push vs concat, change code?
//TODO: for statement
//TODO: linting import functions being defined

var functionList = [];
var nextVisitBlock = false;

var initScope = {
    parent: null,
    functionList: [],
    indent: 0,
    indentChar: ""
}

const tokenStream = {
    pos: 0,
    line: 0,
    scope: initScope,

    //move the stream forward
    advance: function()
    {
        this.pos++;
    },

    //move to the next line of the stream
    nextLine: function()
    {
        this.line++;
        this.pos = 0;
    },

    //reset the stream to its initial state (for new parses)
    reset: function()
    {
        this.line = 0;
        this.pos = 0;
        this.scope = {parent:null, functionList:[], indent:0, indentChar: ""};
    },

    //set the scope to a new one passed in
    setScope: function(newScope) { this.scope = {...newScope}; },

    //go up a scope level to the parent scope
    reverseScope: function()
    {
        if(this.scope.parent != null)
            this.scope = this.scope.parent;
    }
}

// looks at editor's text and finds errors / warnings
export function parse() 
{
    let originalEditor = document.querySelector("#originalEditor").firstChild.CodeMirror;
    var allErrors = [];

    tokenStream.reset();

    //reset list on each parse
    functionList = [];

    //for each line
    for(let i = 0; i < originalEditor.getDoc().lastLine(); i++)
    {
        tokenStream.nextLine();

        let tokens = originalEditor.getLineTokens(i);

        //skip blank lines
        if(tokens.length < 1)
            continue;
        
        //skip lines of ONLY whitespace
        if(tokens.length == 1 && tokens[0].string.match(/\s/g))
            continue;

        if(nextVisitBlock)
            allErrors = allErrors.concat(visitBlock(tokens));
        else
            allErrors = allErrors.concat(visitLine(tokens));
    }
    return allErrors;
}

//parse function for every (non blank) line. 
function visitLine(tokens)
{
    if(skipComment(tokens))
        return [];

    let errors = checkLeadingWhitespace(tokens);

    //avoid out of bounds errors
    if(tokenStream.pos > tokens.length-1)
        return [];

    //is a keyword
    if(tokens[tokenStream.pos].type == "keyword")
    {
        errors = errors.concat(visitKeyword(tokens[tokenStream.pos].string, tokens));
    }
    //not a keyword
    else if(tokens[tokenStream.pos].type == "variable")
    {
        
        if(tokenStream.pos+1 < tokens.length && tokens[tokenStream.pos+1].string == "(")
        {
            errors = errors.concat(visitFunctionCall(tokens));
        }
    }

    return errors;
}

// determines which function to call when token of type keyword is visited
function visitKeyword(keyword, tokens) 
{
    switch(keyword)
    {
        //if the keyword "def" is used then it's a function
        case "def":
            tokenStream.advance();
            return visitFunction(tokens);
        
        //at the moment these only check for if a colon is missing
            //in the python grammar, all of these keywords require a colon at some point
        case "if":
        case "elif":
        case "else":
        case "while":
        case "class":
        case "with":
        case "try":
        case "except":
        case "finally":
        case "match":
        case "case":
        case "lambda":
        case "for":
            return getMissingColonObj(tokens);
        default:
            return [];
    }
}

function visitBlock(tokens)
{
    let shouldSkip = skipComment(tokens);
    if(shouldSkip)
        return [];

    nextVisitBlock = false;
    let firstToken = tokens[tokenStream.pos];

    // update scope level
    let newScope = { 
        parent: tokenStream.scope, 
        functionList: [...tokenStream.scope.functionList], 
        indent: firstToken.string.length,
        indentChar: firstToken.string
    };

    tokenStream.setScope(newScope)

    //replace tabs with spaces ONLY for comparing the length of the scope indent
    let newIndentChar = newScope.indentChar.replace(/\t/g, "    ");
    let parentIndentChar = newScope.parent.indentChar.replace(/\t/g, "    ")

    // check for indentation == new scope level
        // first line of block sets indentation level
        // all following lines must be the same amount indented in
    // the block is over when there is a token on a smaller indentation line

    //first token is not whitespace or the new indent is shorter than the parent indent
    if(!firstToken.string.match(/\s/g) || newIndentChar.length <= parentIndentChar.length)
    {
        return [getErrorObj("Expected indent", "error", tokenStream.line-1, firstToken)];
    }

    //console.log(tokens,newScope)
    return visitLine(tokens);
}


// 'def' NAME '(' [params] ')' ['->' expression ] ':' [func_type_comment] block
//  ASYNC 'def' NAME '(' [params] ')' ['->' expression ] ':' [func_type_comment] block 

// function definitions will always have def
// name of function must be the direct next token (excluding whitespace) following def
// open parentheses should be next token after name
// colon must be after right parentheses (may have other tokens in between)
function visitFunction(tokens)
{
    let line = tokenStream.line;
    let hasColon = false;
    tokenStream.advance();
    let errors = [];

    if(tokens[tokenStream.pos] == undefined)
        return [];

    //TODO: check more builtin func name
    //TODO: allow for adding robotify functions as "existing functions?"
    //TODO: check placement of colon?
    skipWhitespace(tokens[tokenStream.pos]);

    //type of "def" means it's a NAME
    if(tokens[tokenStream.pos].type != "def")
    {
        let message = "Function is missing name"

        //the name of the function is a built-in python function
        if(tokens[tokenStream.pos].type == "builtin")
        {
            message = tokens[tokenStream.pos].string + " is a built-in function that already exists";
            tokenStream.advance();
        }

        return [getErrorObj(message, "error", line-1, tokens[tokenStream.pos-1])]
    }

    //the name of the function already exists
        //note: python lets you create 2 of the same function, but if they have the same parameter list, the latest one takes precedence
    if(tokenStream.scope.functionList.includes(tokens[tokenStream.pos].string))
    {    

        return [getErrorObj(tokens[tokenStream.pos].string + " already exists", "warning", line-1, tokens[tokenStream.pos])];
        
    }
    //function name is good to go so add it to the list
    tokenStream.scope.functionList.push(tokens[tokenStream.pos].string);


    //continue the stream
    advanceStream(false, tokens);

    //check parentheses
    let parentheses = visitParentheses(tokens);

    //there were errors
    if(parentheses.length > 0)
        return parentheses;

    //no errors, continue
    advanceStream(false, tokens);

    //just makes sure that a colon exists, at some point after the opening parentheses
        //TODO: ensure it comes AFTER close parentheses
    if(findColon(tokens) != -1)
        hasColon = true;

    //missing colon
    if(!hasColon)
    {
        errors.push(getErrorObj("Function missing colon", "error", line-1, tokens[tokens.length-1]));
    }

    return errors;
}

//assumes that a function call is type variable followed by an open parentheses
//note: python does not let you call functions that are defined later in the script
function visitFunctionCall(tokens)
{
    //if calling function name that does not exist
    if(!tokenStream.scope.functionList.includes(tokens[tokenStream.pos].string))
    {
        return [getErrorObj("Function may not have been defined", "warning", tokenStream.line-1, tokens[tokenStream.pos])];
    }

    //TODO: possibly check parentheses
    return [];
    
}

//makes sure that there is both an open and close parentheses somewhere in the line
    //does NOT account for multiple sets, simply checks to make sure there is AT LEAST one of each
    // (potential) TODO: balance parentheses?
function visitParentheses(tokens)
{
    skipWhitespace(tokens[tokenStream.pos]);

    //no open parentheses
    if(tokens[tokenStream.pos].string != "(")
    {
        return [getErrorObj("Missing (", "error", tokenStream.line-1, tokens[tokenStream.pos])];
    }

    //from here on out there is an open parentheses
    tokenStream.advance();

    for(let i = tokenStream.pos; i < tokens.length; i++)
    {

        if(tokens[i].string == ")")
        {
            return [];
        }
    }

    //reached the end of the line with no right parentheses
    return [getErrorObj("Missing )", "error", tokenStream.line-1, tokens[tokens.length-1])];
}

//returns the index of the token that contains a colon
function findColon(tokens)
{
    for(let i = tokenStream.pos; i < tokens.length; i++)
    {
        if(tokens[i].string == ":")
        {
            //TODO: double check grammar that this is always true

            nextVisitBlock = true; //when you find a colon, the next line will always be a "block"
            return i;
        }
    }

    return -1;
}

//checks to make sure the leading whitespace amount is consistent within the scope
function checkLeadingWhitespace(tokens)
{
    let index = 0;
    let indentLength = 0;

    //while it is in bounds and is a whitespace
    while(index < tokens.length && tokens[index].string.match(/\s/g))
    {
        indentLength += tokens[index].string.length;
        tokenStream.advance();
        index++;
    }

    let tempScope = {...tokenStream.scope};
    while(tempScope.parent != null && indentLength != tempScope.indent)
    {
        tempScope = tempScope.parent;
    }

    //we've moved back one or more scopes
    if(tempScope.parent == null || indentLength == tempScope.indent)
    {
        tokenStream.setScope(tempScope);
    }

    //same scope, inconsistent spacing
    if(indentLength != tokenStream.scope.indent)
    {
        return [getErrorObj("Indentation does not match.", "error", tokenStream.line-1, tokens[index-1])]
    }
    return [];
}

//checks if the token is whitespace, returns 1 if it is, 0 if not
function skipWhitespace(token)
{
    if(token != undefined && token.string.match(/\s/g))
    {
        tokenStream.advance();
        return 1;
    }
    return 0;
}

//looks to see if there's anything of value on the line. returns false if there's a token that should be analyzed
function skipComment(tokens)
{
    for(let i = 0; i < tokens.length; i++)
    {
        //ignore whitespace
        if(tokens[i].string.match(/\s/g))
            continue;
        
        //something other than a comment / whitespace exists
        if(tokens[i].type != "comment")
            return false;
    }
    
    return true;
}

//get the new stream position by increasing by one, and skipping whitespace if flagged to do so
function advanceStream(includeWhitespace, tokens)
{
    tokenStream.advance();

    if(!includeWhitespace)
        skipWhitespace(tokens[tokenStream.pos]);
    

}

// returns an object so code can call this instead of writing out the object properties every time
function getErrorObj(message, severity, lineNumber, token)
{
    return {
        message: message, 
        severity: severity, 
        from: CodeMirror.Pos(lineNumber, token.start), 
        to: CodeMirror.Pos(lineNumber, token.end)
    };
}

//returns an array containing an error obj if there is a missing colon, otherwise empty array
function getMissingColonObj(tokens)
{
    if(findColon(tokens) == -1)
        return [getErrorObj("Missing colon", "error", tokenStream.line-1, tokens[tokens.length-1])];
    else
        return [];
}
