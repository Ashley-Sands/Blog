// a real simple MD parser
// I'm only doing this to practice regEx :)
print = console.log;

class MarkDownParse{

    static lineMode = {
        "NORMAL": 0,
        "ADDITIVE": 1
    }

    constructor(){

        this.lineRegex = {
            header: {
                regex: /(^##{0,5}) (.+)/,            
                outKeyCapGroups: [1],      //this list id must match the values list id
                valueCapGroups: [[2]],
                lineMode: MarkDownParse.lineMode.NORMAL,
                output: {
                    "#": "<h1>{v0}</h1>",
                    "##": "<h2>{v0}</h2>",
                    "###": "<h3>{v0}</h3>",
                    "####": "<h4>{v0}</h4>",
                    "#####": "<h5>{v0}</h5>",
                    "######": "<h6>{v0}</h6>",
                }
                
            },
            paragraph: {
                regex: /(.+)(  )\n/,            
                /*regex: /(  )\n/,   */         
                outKeyCapGroups: [2, 2],      //this list id must match the values list id
                valueCapGroups: [[1], [0]],
                lineMode: MarkDownParse.lineMode.ADDITIVE,
                output: {  // additive must contatin an output var $compleat, for the text to be outputed into
                    "undefined": "{v0}",
                    "  ": "{v0}<br />",
                    "$complete": "<p>{v}</p>"
                }
            }

        };

        this.afterRegex = {
            boldItalic: {
                regex: /((\*{2})([!-)+-~]+)\*{2})|((\*{1})([!-)+-~]+)\*{1}) /,
                outKeyCapGroups: [1, 2],      // this ant right...
                valueCapGroups: [[2], [3]],
                output: {
                    "*": "<i>{v0}</i>",
                    "**": "<b>{v0}</b>"
                }
            },
            linksImages: {
                regex: /(!)*\[([ -Z\\^-~]*)\]\(([ -'*-~]*)\)/,
                outKeyCapGroups: [1],      
                valueCapGroups: [[2, 3]],
                output: {
                    "undefined": "<a href='{v1}'>{v0}</a>",
                    "!": "<img src='{v1}' alt='{v0}' />"
                }
            }
        };

    }

    parse(string){

        var lines = string.split(/\n/);
        var additiveString = null;    // if null, currently not in addative mode, otherwise string
        var additiveOutputString = null;
        var output = "";
        
        // 
        for ( var i = 0; i < lines.length; ++i)
        {
            // find if header.
            var header = this._parse( this.lineRegex.header, lines[i] );

            if ( header != null )
            {
                if ( additiveString != null)
                {
                    output += additiveOutputString.replace(/{v}/, additiveString);
                    additiveString = null;
                }

                output += header;
                continue;
            }

            var paragraph = this._parse( this.lineRegex.paragraph, lines[i] );        
            
            if ( additiveString == null )
            {
                additiveString = paragraph == null ? lines[i] : paragraph;
                additiveOutputString = this.lineRegex.paragraph.output["$complete"];
            }
            else
            {
                additiveString += paragraph == null ? lines[i] : paragraph;
            }

        }

        if ( additiveString != null)
        {
            output += additiveOutputString.replace(/{v}/, additiveString);
            additiveString = null;
        }

        var values = Object.values(this.afterRegex);
        

        for ( var i = 0; i < values.length; ++i)
        {
            var temp = this._parse( values[i], output, true )

            if ( temp != null )
                output = temp;
        }

        return output;

    }

    _parse(regexParseObj, string, update=false)
    {
        /**
         * @returns: null if no match.
         */

        
        var output = `${string}\n`;
        var parsed = false;

        do{

            var regGroups = regexParseObj.regex.exec(output);

            if ( regGroups != null )
            {

                print(regGroups);

                for ( var j = 0; j < regexParseObj.outKeyCapGroups.length; j++ )
                {

                    if ( regGroups[ regexParseObj.outKeyCapGroups[j] ] in regexParseObj.output )
                    {
                        var tempOutput = regexParseObj.output[ regGroups[ regexParseObj.outKeyCapGroups[j] ] ];
                        // parsh into html
                        for( var k = 0; k < regexParseObj.valueCapGroups[j].length; k++)
                        {
                            tempOutput =  tempOutput.replace(`{v${k}}`, regGroups[ regexParseObj.valueCapGroups[j][k] ]);  
                        }
                        
                        if ( update ){

                            output = output.replace(regGroups[0], tempOutput);
                            print(`string: ${string} \ntempOut ${tempOutput} \nOutput ${output} \nre index: ${regGroups.index} `)
                        }else
                        {
                            output = tempOutput;
                        }

                        parsed = true;

                    }

                }

            }

        }while(update && regGroups != null)

        return parsed ? output : null;    

    }

}

mdp = new MarkDownParse();

/*MarkDownParse.parse("# dsagfda");*/