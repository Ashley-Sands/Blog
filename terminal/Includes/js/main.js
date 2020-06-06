
main = function()
{
    var user = "guest";
    var systemName = user + "@ams-portfolio";
    var currentDir = "~";

    var htmlBody = document.getElementsByTagName("BODY")[0];
    var contentOuterHold = document.getElementById("console-outer-content-hold")

    var input = new TextInput("console-text-input", "console-input-cursor", "console-input-cursor-char");
    var lastContentId = -1;

    var commands = {
        "cd /home/": "Change to home",
        "ls ~/git": "List Git",
        "ls ~/blog": "List Blog Post",
        "cd ~/about": "Change to about",
        "help": "No Help Avabile :(",
        "do-ui-upgrade": "ssh guest@127.0.0.1"
    }
    // setup input event listeners

    // charactor inputs
    htmlBody.addEventListener( "keypress", (e) => {

        
        var charCode = e.charCode;

        if ( charCode == 13 )   // ignore enter
            return;

        //document.getElementById("debug").innerHTML = ` ${charCode}`;

        input.AppendText( String.fromCharCode(charCode) );


    } );

    // other keyinputs ie backspace and return/enter
    htmlBody.addEventListener( "keydown", (e) => {

        var keyCode = e.code;
        //document.getElementById("debug").innerHTML = ` ${keyCode}`;

        switch ( keyCode )
        {
            case "ArrowRight": 
                input.moveCursor(1); 
                break;
            case "ArrowLeft": 
                input.moveCursor(-1); 
                break;
            case "NumpadEnter":
            case "Enter": 
                if ( input.text.trim().length > 0)
                {
                    var command = input.text;
                    var content = command.replace(/ /g, "&nbsp;") + ": command not found";

                    if ( command in commands )
                    {
                        content = commands[ command ];
                    }

                    this.AddContent( command, content );
                    input.ClearText();
                }
                break
            case "Backspace": 
                input.RemoveChar(false);
                break;
            case "Delete": 
                input.RemoveChar(true);
                break;
        }

    } );

    AddContent = function( command, cont="" )
    {
        var contentHold = document.createElement( "DIV" );
        contentHold.className = "console-content-hold";

        var commandText = document.createElement( "P" );
        commandText.className = "console-content-command";
        commandText.innerHTML = `${systemName}:${currentDir}$ ${command.replace(/ /g, "&nbsp;")}`;

        var content = document.createElement( "DIV" );
        content.className = "console-content";
        content.innerHTML = cont.length > 0 ? cont : "[...]";
        content.id = "console-content-" + (++this.lastContentId);       // dont think i need this :)

        contentHold.appendChild( commandText );
        commandText.appendChild( content );

        contentOuterHold.appendChild(contentHold);

        window.scrollTo(0, htmlBody.offsetHeight);

    }

}