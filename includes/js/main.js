
main = function()
{
    var user = "guest";
    var systemName = user + "@ams-portfolio";
    var currentDir = "~";

    var htmlBody = document.getElementsByTagName("BODY")[0];
    var contentOuterHold = document.getElementById("console-outer-content-hold")

    var scrollPosY = 0;

    var input = new TextInput("console-text-input", "console-input-cursor", "console-input-cursor-char");
    var lastContentId = -1;

    var commands = [
        new HomeCommand( "index.html" )
    ]

    var history = []
    var currentHistoryId = 0;
    // setup input event listeners

    // charactor inputs
    htmlBody.addEventListener( "keypress", (e) => {

        
        var charCode = e.charCode;
        this.DisableDefaults( charCode, e, "code" )

        if ( charCode == 13 )   // ignore enter
            return;

        document.getElementById("debug").innerHTML = ` ${charCode}`;

        input.AppendText( String.fromCharCode(charCode) );


    } );

    // other keyinputs ie backspace and return/enter
    htmlBody.addEventListener( "keydown", (e) => {

        var keyCode = e.code;
        this.DisableDefaults( keyCode, e, "key" )
        //document.getElementById("debug").innerHTML = ` ${keyCode}`;

        switch ( keyCode )
        {
            case "ArrowRight": 
                input.moveCursor(1); 
                break;
            case "ArrowLeft": 
                input.moveCursor(-1); 
                break;
            case "ArrowUp":
                SetFromHistory(-1);
                break;
            case "ArrowDown":
                SetFromHistory(1);
                break;
            case "NumpadEnter":
            case "Enter": 
                if ( input.text.trim().length > 0)
                {
                    var command = input.text;

                    history.push( command );
                    currentHistoryId = history.length;

                    this.AddContent( command );
                    input.ClearText();
                }
                break
            case "Backspace": 
                input.RemoveChar(false);
                break;
            case "Delete": 
                input.RemoveChar(true);
                break;
            case "Slash":   // since we have disabled the defaults of shash we need to manuly get it to add the slash.
                
                break;
        }

    } );

    window.onscroll = function(event) {

        scrollPosY = window.scrollY;

        if (scrollPosY > 210)
        {
            document.getElementById("cli-commands-hold").className = "cli-commands-docked";
            document.getElementById("cli-commands-docked-spacer").style.display = "block";
        }
        else
        {
            document.getElementById("cli-commands-hold").className = "cli-commands-undocked";
            document.getElementById("cli-commands-docked-spacer").style.display = "unset";
        }

    };

    DisableDefaults = function( key, event, type="key" )
    {
        var disabled = [];

        switch( type.toLowerCase() ){
        case "key":
            disabled = [
                "ArrowUp",
                "ArrowDown",
                "Backspace",    // disable backspace, as its STILL back in firefox (and probs some other browers too)
                "Delete",
                "keyCode",
            ]
            break;
        case "code":
            disabled = [
                // disable defaults on slash as its brings up the quick search in firefox.
                // By disabling the keycode we still get the key press but ignore the default action.
                // if we disable it via the key, it will ignore the press as well :) 
                47        
            ]
            break;
        }

        if ( disabled.indexOf(key) >= 0 )
        {
            event.preventDefault();
        }
    }

    SetFromHistory = function(dir)
    {
        var nextElem = currentHistoryId + dir;
        currentHistoryId = Math.max( 0, Math.min(nextElem, history.length ) );

        //document.getElementById("debug").innerHTML = ` ${currentHistoryId}`;

        if ( currentHistoryId == history.length )
            input.SetText( "" );
        else
            input.SetText( history[ currentHistoryId ] );

    }

    AddContent = function( command )
    {

        var htmlCommand = command.replace(/ /g, "&nbsp;");
        var commandObj = null;

        // find if a vaild command is being executed
        for ( var i = 0; i < commands.length; i++ )
            if ( commands[i].IsCommand( command.trim() ) )
            {
                commandObj = commands[i];
                break;
            }
        
        // create the html elements
        var contentHold = document.createElement( "DIV" );
        contentHold.className = "console-content-hold";

        var commandText = document.createElement( "P" );
        commandText.className = "console-content-command";
        commandText.innerHTML = `${systemName}:${currentDir}$ ${htmlCommand}`;

        var content = document.createElement( "DIV" );
        content.className = "console-content";
        content.innerHTML = commandObj ? "<p>[...Loading...]</p>" : `${htmlCommand}: command not found`;
        content.id = "console-content-" + (++lastContentId);       // dont think i need this :)

        contentHold.appendChild( commandText );
        commandText.appendChild( content );

        contentOuterHold.appendChild(contentHold);

        if ( commandObj )
            commandObj.Execute( content );

        // finally scrole to the bottom.
        window.scrollTo(0, htmlBody.offsetHeight);

    }

}