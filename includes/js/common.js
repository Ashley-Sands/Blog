
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

    static LoadContent( contentObj )
    {
        //url, responceHandler, requestName=""
        /**
         * Loads Content passing the responce into a responce handler function
         * @param contentObj:   The content object to load.
         */

        var request = new XMLHttpRequest();
        request.onreadystatechange = function() 
        {
            var status = this.status;
            contentObj.responceStatus = this.statusText;
            if (this.readyState == 4 && status == 200) 
            {
                // retrive headers for the content object.
                var headers = Object.keys( contentObj.responceHeaders );
                for ( var i = 0; i < headers.length; i++ )
                {
                    var header = headers[i];
                    contentObj.responceHeaders[ header ] = this.getResponseHeader( header );
                }

                contentObj.SetResponce( this.responseText );
                contentObj.SetState.Loaded();
                contentObj.Use();

                console.log("URL: "+contentObj.url+" loaded");

            }
            else if ( status >= 300)
            {
                contentObj.SetState.Error();
                //contentObj.HandleHTTPError();
                console.error("URL: "+contentObj.url+" error");

            }

        };

        request.open("GET", contentObj.url, true);
        request.send();
    }

}
