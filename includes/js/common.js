
class Common
{
    static Year()
    {
        return new Date().getFullYear()
    }

    static Age()
    {
        return Math.floor( ( new Date() - new Date(1991, 6) ) / Const.OneYearMillis ); 
    }

    static StartedYearsAgo()
    {
        return Math.floor( ( new Date() - new Date(2008, 1) ) / Const.OneYearMillis )
    }

    static LoadContent( url, responceHandler, requestName="" )
    {
        /**
         * Loads Content passing the responce into a responce handler function
         * @param url:              request url
         * @param responceHandler:  Function to handle the responce. ie formate json into html :)
         *                          The function must contatin two params. 
         *                          ResponceStr:    The responce from url
         *                          requestName:    Name of request
         * @param requestName:      Name of request, Only used to track request.
         */

        var request = new XMLHttpRequest();
        request.onreadystatechange = function() 
        {
            var status = this.status;
            if (this.readyState == 4 && status == 200) 
            {
                responceHandler( this.responseText, requestName );
            }
            else if ( status >= 300)
            {
                //TODO: I need to do somthink about this, its not allways correct anymore.
                // for instance, its doesent always return json anymore 
                responceHandler( `{ "header": "${status}", "subHeader": "Error", "content": ["<p class='center'>Oops...</p>"] }`, requestName); 
            }
        };

        request.open("GET", url, true);
        request.send();
    }

    static FetchHeader(url, header, responceElem, responceStr="{responce}")
    {
        /**
         * Fetches the header of a file.
         * @param responceStr: the string that the responce should be formated into.
         *                     the string must contain '{responce}' where the responce
         *                     will be printed
         */

        var request = new XMLHttpRequest();
        request.onreadystatechange = function() 
        {
            if (this.readyState == 4 && this.status == 200) 
            {
                responceElem.innerHTML = responceStr.replace( /{responce}/g, this.getResponseHeader(header) );
            }
            else if ( this.status >= 300)
            {
                responceElem.innerHTML = `Error: ${this.status}`
            }
        };

        request.open("HEAD", url, true);
        request.send();

    }

}
