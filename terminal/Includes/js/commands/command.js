
class Command
{
    constructor()
    {
        
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
    }

    IsCommand( comm )
    {
        /** Is the command in the list of valid commands */
        return this.commands.includes( comm, 0 );
    }

}