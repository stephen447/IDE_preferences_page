import CodeMirror from "codemirror";
import { pythonBuiltinFunctions } from "./unavailableKeywords";
import { check } from "prettier";

CodeMirror.registerHelper("lint", "python", parse);

export function parse(doc, options)
{
    let originalEditor = document.querySelector("#originalEditor").firstChild.CodeMirror;
    var allErrors = [];

    //for each line
    for(let i = 0; i < originalEditor.getDoc().lastLine(); i++)
    {
        let tokens = originalEditor.getLineTokens(i);

        //skip blank lines
        if(tokens.length < 1)
            continue;
            
        allErrors = allErrors.concat(visitLine(tokens, i));
    }
    return allErrors;
}

function visitLine(tokens, lineNumber)
{
    let startIndex = removeLeadingWhitespace(tokens);
    let errors = [];

    if(tokens[startIndex].type == "keyword")
    {
        if(tokens[startIndex].string == "def")
            errors = errors.concat(visitFunction(tokens, startIndex+1, lineNumber));
        
    }
    //not a keyword
    else
    {

    }

    return errors;
}

// 'def' NAME '(' [params] ')' ['->' expression ] ':' [func_type_comment] block
//  ASYNC 'def' NAME '(' [params] ')' ['->' expression ] ':' [func_type_comment] block 

// function definitions will always have def
// name of function must be the direct next token (excluding whitespace) following def
// open parentheses should be next token after name
// colon must be after right parentheses (may have other tokens in between)
function visitFunction(tokens, start, lineNumber)
{
    let hasColon = false;
    let funcName = "";
    let streamPos = start+1;
    let errors = [];

    //TODO: check for duplicate func name
    //TODO: check more builtin func name
    //TODO: allow for adding robotify functions as "existing functions?"
    //TODO: check placement of colon?
    streamPos += skipWhitespace(tokens[streamPos]);

    //type of "def" means it's a NAME
    if(tokens[streamPos].type == "def")
    {
        funcName = tokens[streamPos].string;
    }
    //the next token is something other than NAME
    else
    {
        let message = "Function is missing name"

        if(tokens[streamPos].type == "builtin")
        {
            message = tokens[streamPos].string + " is a built-in function that already exists";
            streamPos++;
        }
        
        return [getErrorObj(message, "error", lineNumber,tokens[streamPos-1])]
    }

    //continue the stream
    streamPos = advanceStream(false, tokens, streamPos);

    //check parentheses
    let parentheses = visitParentheses(tokens, streamPos, lineNumber);

    //there were errors
    if(parentheses.length > 0)
        return parentheses;

    //no errors, continue
    streamPos = advanceStream(false, tokens, streamPos);

    //just makes sure that a colon exists, at some point after the opening parentheses
        //TODO: ensure it comes AFTER close parentheses
    for(let i = streamPos; i < tokens.length; i++)
    {
        //the defined name of the function has type "def"
        if(tokens[i].string == ":")
        {
            hasColon = true;
        }
        
    }

    //missing colon
    if(!hasColon)
    {
        errors.push(getErrorObj("Function missing colon", "error", lineNumber, tokens[tokens.length-1]));
    }

    return errors;
}

function removeLeadingWhitespace(tokens)
{
    let index = 0;
    while(tokens[index].string.match(/\s/g))
    {
        index++;
    }
    return index;
}

//checks if the token is whitespace, returns 1 if it is, 0 if not
function skipWhitespace(token)
{
    if(token.string.match(/\s/g))
        return 1;

    return 0;
}

function advanceStream(includeWhitespace, tokens, streamPos)
{
    let newPos = streamPos+1;

    if(!includeWhitespace)
        newPos += skipWhitespace(tokens[newPos]);
    

    return newPos;
}

//makes sure that there is both an open and close parentheses somewhere in the line
    //does NOT account for multiple sets, simply checks to make sure there is AT LEAST one of each
function visitParentheses(tokens, start, lineNumber)
{
    let pos = start + skipWhitespace(tokens[start]);
    //no open parentheses
    if(tokens[pos].string != "(")
    {
        return [getErrorObj("Missing (", "error", lineNumber, tokens[pos])];
    }

    //from here on out there is an open parentheses
    pos++;

    for(let i = pos; i < tokens.length; i++)
    {

        if(tokens[i].string == ")")
        {
            return [];
        }
    }

    //reached the end of the line with no right parentheses
    return [getErrorObj("Missing )", "error", lineNumber, tokens[tokens.length-1])];
}

function getErrorObj(message, severity, lineNumber, token)
{
    return {
        message: message, 
        severity: severity, 
        from: CodeMirror.Pos(lineNumber, token.start), 
        to: CodeMirror.Pos(lineNumber, token.end)
    };
}