
class Command
{
    constructor( content_url ) 
    {
        this.url = content_url;
     }

    get validCommands()
    {
        /** requires override. returns list of accepted commands */
        return [];
    }

    Execute(htmlElement)
    {
        /** requires override.
         *  executes the command.
         *  @param htmlElement: the element to print the responce into.
         */
        Command._LoadContent( this.url, htmlElement );
        
    }

    IsCommand( comm )
    {
        /** Is the command in the list of valid commands */
        return this.validCommands.includes( comm.toLowerCase(), 0 );
    }

    static _LoadContent( url, responceElem )
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
                responceElem.innerHTML = ` Error: ${this.status}`
            }
        };

        request.open("GET", url, true);
        request.send();
    }

}