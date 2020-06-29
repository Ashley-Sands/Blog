
class Common
{
    static Year()
    {
        return new Date().getFullYear()
    }

    static LoadHTMLContent( url, responceElem )
    {

        var request = new XMLHttpRequest();
        request.onreadystatechange = function() 
        {
            if (this.readyState == 4 && this.status == 200) 
            {
                responceElem.innerHTML = this.responseText;
            }
            else if ( this.status >= 300)
            {
                responceElem.innerHTML = `Error: ${this.status}`
            }
        };

        request.open("GET", url, true);
        request.send();
    }

    static LoadJsonContent( url, jsonFormater )
    {
        /**
         * @param jsonFormater: Function to format json into the current page.
         */
        var request = new XMLHttpRequest();
        request.onreadystatechange = function() 
        {
            var status = this.status;
            if (this.readyState == 4 && status == 200) 
            {
                jsonFormater( this.responseText );
            }
            else if ( status >= 300)
            {
                jsonFormater( `{ "header": "${status}", "subHeader": "Error", "content": ["<p class='center'>Oops...</p>"] }`); 
            }
        };

        request.open("GET", url, true);
        request.send();
    }

    static FetchHeader(url, header, responceElem, responceStr="{responce}")
    {
        /**
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
