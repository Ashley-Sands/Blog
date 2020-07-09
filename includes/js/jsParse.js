
class JSParse{
    
    static Parse(jsonString){

        // search and update the json with any variable defined in the json string.
        // eg. to set var key = $varName 
        //     to use var key or value = $[varName]
        
        var setRegex = /"(\$[a-zA-Z0-9-_]+)": *"([a-zA-Z0-9-_]+) *",*/
        var useRegex = /\$\[([a-zA-Z0-9-_]+)\]/

        var setRegMatch = setRegex.exec( jsonString );

        while( setRegMatch != null )
        {

            // find all use values.
            var useRegMatch = useRegex.exec( jsonString );
            while ( useRegMatch != null )
            {
                jsonString = jsonString.replace(`$[${useRegMatch[1]}]`, setRegMatch[2] );
                useRegMatch = useRegex.exec( jsonString );

            }

            // remove the var line.
            jsonString = jsonString.replace( setRegMatch[0], "" );
            setRegMatch = setRegex.exec( jsonString );

        }

        console.log( jsonString );
        return JSON.parse( jsonString );


    }

}