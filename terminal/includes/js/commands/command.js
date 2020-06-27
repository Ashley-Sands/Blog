
class Command
{
    constructor( content_page ) 
    {
        var baseUrl = "http://localhost/Portfolio2.0/terminal/pages/"
        this.url = baseUrl + content_page;
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
        Common.LoadContent( this.url, htmlElement );
        
    }

    IsCommand( comm )
    {
        /** Is the command in the list of valid commands */
        return this.validCommands.includes( comm.toLowerCase(), 0 );
    }

}