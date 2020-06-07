
class Command
{
    constructor() { }

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
        htmlElement.innerHTML = "== TEST CONTENT =="
    }

    IsCommand( comm )
    {
        /** Is the command in the list of valid commands */
        return this.validCommands.includes( comm.toLowerCase(), 0 );
    }

    static LoadContent( url, responceElem )
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
                responceElem.innerHTML = "Error"
            }
        };
        
        request.open("GET", url, true);
        request.send();
    }

}