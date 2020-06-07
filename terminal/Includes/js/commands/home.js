class HomeCommand extends Command
{

    get validCommands()
    {
        return ["cd", "cd ~/", "cd /home", "cd /home/"]
    }

}