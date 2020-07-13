// a real simple MD parser
// I'm only doing this to practice regEx :)

// See ./mdParse.md for futher details.

print = console.log;

class MarkDownParse{

    PARSEMODE = {
        "NORMALL": 0,       // parses untill there nothing left to parse.
        "ONCE": 1,          // ensures that the values is parsed only once if at all, befor the next instruction set
        "FINAL": 2,         // parses the value only once if at all, preventing the value from parsing any further
        "RAW": 3            // Same as FINAL also converting the parsed value into raw output
    }

    constructor( overrideOutputs={} ){

        // define default html elements.
        // this alows use to replace any that are supplied by params
        // while ensuring that all required are still present.
        var outputs = { 
            paragraph: {
                "": "<p>{v0}</p>",
            },
            inlineCode: {               // this could just be paragraph but as it need to be convered to raw, it needs to be in its own thing.
                ">": "<code>{v0}</code>"
            },
            blockCode: {
                "'''": "<code>{v0}</code>",
                "```": "<code>{v0}</code>"
            },
            header: {
                "#": "<h1>{v0}</h1><hr/>",
                "##": "<h2>{v0}</h2><hr/>",
                "###": "<h3>{v0}</h3>",
                "####": "<h4>{v0}</h4>",
                "#####": "<h5>{v0}</h5>",
                "######": "<h6>{v0}</h6>"
            },
            hozRule: {
                "===": "<hr />",
            },
            boldItalic: {
                "*": "<i>{v0}</i> ",
                "_": "<i>{v0}</i> ",
                "**": "<b>{v0}</b> ",
                "__": "<b>{v0}</b> ",
                "~~": "<strike>{v0}</strike> "
            },
            linksImages: {
                "undefined": "<a href='{v1}'>{v0}</a>",
                "!": "<img src='{v1}' alt='{v0}' style='max-width: 100%' />"
            },
            newLine:{
                "  \n": "<br />",
                "\n\n": "<br />",
            },
            space:{
                " ": "&nbsp;",
                "\t": "&nbsp;&nbsp;&nbsp;&nbsp;"
            }

        };

        // update the output.
        var overrideOutputKeys = Object.keys( overrideOutputs ) 

        for ( var ok = 0; ok < overrideOutputKeys.length; ++ok )
        {
            var outputKey = overrideOutputKeys[ok];
            var overrideElementKeys = Object.keys[outputKey];

            for ( var ek = 0; ek < overrideElementKeys.length; ++ek )
            {
                var elementKey = overrideElementKeys[ek];
                outputs[outputKey][elementKey] = overrideOutputs[outputKey][elementKey];
            }

        }

        // regex to be run line by run. (only once)
        // Also accumaltes lines if its the same match line after line.
        // ie. line 1: > helloo
        //     line 2: > world
        // would acculate as the start of the line both match '>'
        this.lineRegex = {
            inlineCode: {
                regex: /[ \t]*(>{1}).*/,            
                keyCapGroups: [1],             
                valueCapGroups: [[]],            
                parseMode: this.PARSEMODE.RAW,               
                output: outputs.inlineCode
            }
        }

        // regex to be run on the entire body (untill there nothing left to parse)
        this.bodyRegex = {
            /*paragraph: {
                regex: /()^[ \t]*([^#>]*(?![ #>]))/m,            // the empty capture group used for the key. (minor issue, this doent check for a space after # or >)
                keyCapGroups: [1],             
                valueCapGroups: [[2]],            
                parseMode: this.PARSEMODE.ONCE,               
                output: outputs.paragraph
            },*/
            header: {
                regex: /(^##{0,5}) (.+)/m,            
                keyCapGroups: [1],                  // this list id must match the values list id
                valueCapGroups: [[2]],              // the corrisponding capture groups that belong with KeyCap. list id 0 matches format {v0}, 1 {v1} ect..
                parseMode: this.PARSEMODE.FINAL,               
                output: outputs.header    
            },
            blockCode: {
                regex: /('{3}|`{3})([!-~\s]*?)\1/,            
                keyCapGroups: [1],             
                valueCapGroups: [[2]],            
                parseMode: this.PARSEMODE.RAW,               
                output: outputs.blockCode
            },
            newLine:{
                regex: /( {2}\n)|(\n{2})/,
                keyCapGroups: [0, 1],      
                valueCapGroups: [[], []],
                parseMode: this.PARSEMODE.NORMALL,
                output: outputs.newLine
            },
            hozRule: {
                regex: /(={3})=*/,              
                keyCapGroups: [1],
                valueCapGroups: [[]],
                parseMode: this.PARSEMODE.NORMALL,
                output: outputs.hozRule
            },
            linksImages: {
                regex: /(!)*\[([ -Z\\^-~]*)\]\(([ -'*-~]*)\)/,
                keyCapGroups: [1],      
                valueCapGroups: [[2, 3]],
                parseMode: this.PARSEMODE.FINAL,
                output: outputs.linksImages
            },
            boldItalic: {
                regex: /((\*{1,2}|\~{2}|\_{1,2})([\!-\~ \t]+?)\2)/,        //TODO: remove the end space, this is a tep fix for links and images
                keyCapGroups: [2],      
                valueCapGroups: [[3]],
                parseMode: this.PARSEMODE.NORMALL,
                output: outputs.boldItalic
            }/*,
            spaceing:{
                regex: /( )|(\t)/,
                keyCapGroups: [0, 1],      
                valueCapGroups: [[], []],
                parseMode: this.PARSEMODE.NORMALL,
                output: outputs.space
            }*/
            
        };

    }

    parse(string){

        // remove all carage returns, so the string is consistent between platforms
        string = string.replace(/\r/g, "");
        
        var extractedValues = [];
        var output = string;
        
        // parse all of the affter regex
        var values = Object.values(this.bodyRegex);
        
        for ( var i = 0; i < values.length; ++i)
        {
            var temp = this._parse( values[i], output, extractedValues )

            if ( temp != null ) // if nothing was parsed insert the original string.
                output = temp;
        }

        // put the extracted (final) values back into the output
        console.log( extractedValues )
        for ( var i = 0; i < extractedValues.length; i++)
        {
            output = output.replace(`{${i}}`, extractedValues[i]);
        }
        return output;

    }

    _parse(regexParseObj, string, extractedValuesList)
    {
        /**
         * @returns: null if no match, otherwise parsed string
         */

        // we must add the newline back to the end of string
        // so we can detect line breaks '/(  )\n/'
        var output = string; 
        var parsed = false;
        var parsedOnce = [];

        // parse the string at least once.
        do{

            var regGroups = regexParseObj.regex.exec(output);

            if ( regGroups != null )
            {

                var foundReplacement = false;
                var noMatchString = "";

                for ( var j = 0; j < regexParseObj.keyCapGroups.length; j++ )
                {
                    // find if any of the 'capture group output keys' are in the output object
                    if ( regGroups[ regexParseObj.keyCapGroups[j] ] in regexParseObj.output )
                    {
                        var tempOutput = regexParseObj.output[ regGroups[ regexParseObj.keyCapGroups[j] ] ];

                        // parsh all of the capture group output values' into 
                        // the output @ 'capture group output keys' html element.
                        for( var k = 0; k < regexParseObj.valueCapGroups[j].length; k++)
                        {
                            if ( regexParseObj.parseMode == this.PARSEMODE.RAW )
                                tempOutput =  tempOutput.replace(`{v${k}}`, this.ConvertToRaw( regGroups[ regexParseObj.valueCapGroups[j][k] ] ) );
                            else
                                tempOutput =  tempOutput.replace(`{v${k}}`, regGroups[ regexParseObj.valueCapGroups[j][k] ]);  
                        }
                        
                        if ( regexParseObj.parseMode == this.PARSEMODE.FINAL || regexParseObj.parseMode == this.PARSEMODE.RAW )
                        {
                            output = output.replace(regGroups[0], `{${extractedValuesList.length}}`);  // replace the (whole) match with the output value.
                            extractedValuesList.push( tempOutput );
                        }
                        else if( regexParseObj.parseMode == this.PARSEMODE.ONCE )
                        {
                            output = output.replace(regGroups[0], `>>>>>@${extractedValuesList.length}@<<<<<`);  // replace the (whole) match with the output value.
                            parsedOnce.push( tempOutput )
                        }
                        else
                        {    
                            output = output.replace(regGroups[0], tempOutput);  // replace the (whole) match with the output value.
                        }

                        parsed = true;
                        foundReplacement = true
                    }
                    else
                    {
                        noMatchString += `[${regGroups[ regexParseObj.keyCapGroups[j] ]}], `
                    }

                }

                if ( !foundReplacement )
                {
                    console.error("Failed To Parse, A match without a replacement has occurred. This caused infinity loops.");
                    console.error(`Make sure the following keys are set in the output strings for regex '${regexParseObj.regex}' `);
                    console.error(noMatchString.replace(/\n/g, "\\n"));
                    return;
                }

            }

        }while( regGroups != null );

        // replace the parsed once values back into the output
        if (regexParseObj.parseMode == this.PARSEMODE.ONCE )
            for ( var i = 0; i < parsedOnce.length; i++)
                output = output.replace(`>>>>>@${i}}@<<<<<`, parsedOnce[i] );

        return parsed ? output : null;    

    }

    ConvertToRaw = function( htmlString )
    {
        return htmlString.replace(/</g, "&lt;")
                         .replace(/>/g, "&gt;")
                         .replace(/ /g, "&nbsp;")
                         .replace(/\t/g, "&nbsp;&nbsp;&nbsp;&nbsp;")
                         .replace(/\n/g, "<br />")
    }

}
