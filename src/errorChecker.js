import CodeMirror from "codemirror";
import { pythonBuiltinFunctions } from "./unavailableKeywords";

//uses this python grammar: https://docs.python.org/3/reference/grammar.html

//registers it so that CodeMirror.lint.python = the parse function
CodeMirror.registerHelper("lint", "python", parse);

//TODO: check efficiency of push vs concat, change code?
//TODO: for statement
//TODO: potential change that may be cleaner, but probably not necessary for function:
     // make TokenStream as an object rather than reading line by line


var functionList = [];

//TODO: function call scoping
var scope = {
    parent: {},
    functionList: []
}

const tokenStream = {
    pos: 0,
    line: 0,
    scope: scope,
    advance: function()
    {
        this.pos++;
    },
    nextLine: function()
    {
        this.line++;
        this.pos = 0;
    },
    reset: function()
    {
        this.line = 0;
        this.pos = 0;
        this.scope = {parent:{}, functionList:[]};
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
        
        allErrors = allErrors.concat(visitLine(tokens, i));
    }
    return allErrors;
}

//parse function for every (non blank) line. 
function visitLine(tokens)
{
    //potentially change later when looking for inconsistent spacing
    removeLeadingWhitespace(tokens);
    let errors = [];

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
            return getMissingColonObj(tokens);
        default:
            return [];
    }
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

    //TODO: check for duplicate func name
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
    if(functionList.includes(tokens[tokenStream.pos].string))
    {    

        return [getErrorObj(tokens[tokenStream.pos].string + " already exists", "warning", line-1, tokens[tokenStream.pos])];
        
    }
    //function name is good to go so add it to the list
    functionList.push(tokens[tokenStream.pos].string);


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
function visitFunctionCall(tokens)
{
    //if calling function name that does not exist
    if(!functionList.includes(tokens[tokenStream.pos].string))
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
            return i;
    }

    return -1;
}

//removes any whitespace at the start; for linting errors that don't matter with regards to leading whitespace
function removeLeadingWhitespace(tokens)
{
    let index = 0;
    while(index < tokens.length && tokens[index].string.match(/\s/g))
    {
        tokenStream.advance();
        index++;
    }
    return index;
}

//checks if the token is whitespace, returns 1 if it is, 0 if not
function skipWhitespace(token)
{
    if(token.string.match(/\s/g))
    {
        tokenStream.advance();
        return 1;
    }
    return 0;
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
