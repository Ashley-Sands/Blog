// a real simple MD parser
// I'm only doing this to practice regEx :)

// See ./mdParse.md for futher details.

print = console.log;

class MarkDownParse{

    static lineMode = {
        "NORMAL": 0,
        "ADDITIVE": 1
    }

    constructor( overrideOutputs={} ){

        // define default html elements.
        // this alows use to replace any that are supplied by params
        // while ensuring that all required are still present.
        var outputs = { 
            header: {
                "#": "<h1>{v0}</h1>",
                "##": "<h2>{v0}</h2>",
                "###": "<h3>{v0}</h3>",
                "####": "<h4>{v0}</h4>",
                "#####": "<h5>{v0}</h5>",
                "######": "<h6>{v0}</h6>"
            },
            paragraph: {
                "  ": "{v0}<br />",
                "===": "<hr />",
                "$complete": "<p>{v}</p>" // additive must contatin an output var $compleat, for the accumulated text to be outputed into. Notice {v} rather than {v0}
            },
            boldItalic: {
                "*": "<i>{v0}</i>",
                "**": "<b>{v0}</b>"
            },
            linksImages: {
                "undefined": "<a href='{v1}'>{v0}</a>",
                "!": "<img src='{v1}' alt='{v0}' />"
            }

        };

        // update the output.
        var overrideOutputKeys = Object.keys( overrideOutputs ) 

        for ( var ok = 0; ok < overrideOutputKeys.length; ++ek )
        {
            var outputKey = overrideOutputKeys[ok];
            var overrideElementKeys = Object.keys[outputKey];

            for ( var ek = 0; ek < overrideElementKeys.length; ++ek )
            {
                var elementKey = overrideElementKeys[ek];
                outputs[outputKey][elementKey] = overrideOutputs[outputKey][elementKey];
            }

        }

        // define regexParseObjs
        // The line regex parses line by line, to create the basic output with headers, paragraphs and line breaks, 
        // then the after regex is executed untill there are no more regex matches.
        // (after regex is preformed on the whole output in one go, rather than line by line.) 
        this.lineRegex = {
            header: {
                regex: /(^##{0,5}) (.+)/,            
                outKeyCapGroups: [1],      //this list id must match the values list id
                valueCapGroups: [[2]],
                lineMode: MarkDownParse.lineMode.NORMAL,
                output: outputs.header
                
            },
            paragraph: {
                regex: /((={3})=*)|((.+)( {2})(\r|\n|\r\n))/,            
                /*regex: /(  )\n/,   */         
                outKeyCapGroups: [2, 5],      //this list id must match the values list id
                valueCapGroups: [[], [3]],
                lineMode: MarkDownParse.lineMode.ADDITIVE,
                output: outputs.paragraph
            }

        };

        this.afterRegex = {
            boldItalic: {
                regex: /((\*{2})([!-)+-~]+)\*{2})|((\*{1})([!-)+-~]+)\*{1})/, 
                outKeyCapGroups: [2, 5],      
                valueCapGroups: [[3], [6]],
                output: outputs.boldItalic
            },
            linksImages: {
                regex: /(!)*\[([ -Z\\^-~]*)\]\(([ -'*-~]*)\)/,
                outKeyCapGroups: [1],      
                valueCapGroups: [[2, 3]],
                output: outputs.linksImages
            }
        };

    }

    parse(string){

        var lines = string.split(/\n/);
        var additiveString = null;    // if null, currently not in addative mode, otherwise string
        var additiveOutputString = null;
        var output = "";
        
         
        for ( var i = 0; i < lines.length; ++i)
        {
            // parse line as a header.
            var header = this._parse( this.lineRegex.header, lines[i] );

            if ( header != null )
            {
                // if we're been in additive mode, add the additive text to the output
                // befor adding the header
                if ( additiveString != null)    
                {
                    output += additiveOutputString.replace(/{v}/, additiveString);
                    additiveString = null;  // disable additive mode.
                }

                output += header;
                continue;
            }

            // parse paragraphs and line breaks.
            var paragraph = this._parse( this.lineRegex.paragraph, lines[i] );        
            
            if ( additiveString == null )   // enable additive mode.
            {
                additiveString = paragraph == null ? lines[i] : paragraph;
                additiveOutputString = this.lineRegex.paragraph.output["$complete"];
            }
            else
            {
                additiveString += paragraph == null ? lines[i] : paragraph;
            }

        }

        if ( additiveString != null)    // if we where in additive mode, add it to the output.
        {
            output += additiveOutputString.replace(/{v}/, additiveString);
            additiveString = null;
        }

        // parse all of the affter regex
        var values = Object.values(this.afterRegex);
        
        for ( var i = 0; i < values.length; ++i)
        {
            var temp = this._parse( values[i], output, true )

            if ( temp != null ) // if nothing was parsed insert the original string.
                output = temp;
        }

        return output;

    }

    _parse(regexParseObj, string, update=false)
    {
        /**
         * @returns: null if no match, otherwise parsed string
         */

        // we must add the newline back to the end of string
        // so we can detect line breaks '/(  )\n/'
        var output = `${string}`+ !update ?? '\n' ; 
        var parsed = false;

        // parse the string at least once.
        // when not in update, the string is only parsed once (line by line mode),
        // otherwise parse untill theres no regex matches remaining.
        do{

            var regGroups = regexParseObj.regex.exec(output);

            if ( regGroups != null )
            {

                print(regGroups);

                for ( var j = 0; j < regexParseObj.outKeyCapGroups.length; j++ )
                {
                    // find if any of the 'capture group output keys' are in the output object
                    if ( regGroups[ regexParseObj.outKeyCapGroups[j] ] in regexParseObj.output )
                    {
                        var tempOutput = regexParseObj.output[ regGroups[ regexParseObj.outKeyCapGroups[j] ] ];

                        // parsh all of the capture group output values' into 
                        // the output @ 'capture group output keys' html element.
                        for( var k = 0; k < regexParseObj.valueCapGroups[j].length; k++)
                        {
                            tempOutput =  tempOutput.replace(`{v${k}}`, regGroups[ regexParseObj.valueCapGroups[j][k] ]);  
                        }
                        
                        if ( update )
                            output = output.replace(regGroups[0], tempOutput);  // replace the (whole) match with the output value.
                        else
                            output = tempOutput;
                        

                        parsed = true;

                    }

                }

            }

        }while(update && regGroups != null);

        return parsed ? output : null;    

    }

}
