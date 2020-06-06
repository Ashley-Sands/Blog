
class TextInput 
{
    constructor(inputId, cursorId, cursorCharId){  
        this.text = "";
        this.current_char = 0;
        this.max_char = 0;
        this.inputElement = document.getElementById(inputId);
        this.cursorElement = document.getElementById(cursorId);
        this.cursorCharElement = document.getElementById(cursorCharId);

        this.text = this.inputElement.innerHTML;
        this.SetCursor( this.inputElement.innerHTML.length );

    }

    SetText( text ){
        
        this._SetInput( text );
        this.SetCursor( text.length );

    }

    AppendText( text ){

        var start, end;
        start = this.text.substr(0, this.current_char);
        end = this.text.substr(this.current_char);
        
        this._SetInput(start + text + end);
        this.moveCursor( text.length );

    }
    
    RemoveChar(removeFromRight=false)
    {
        var charToRemove = (removeFromRight ? 1 : 0) + this.current_char;
        
        if (charToRemove < 0 || charToRemove > this.text.length)
            return;

        var start, end;

        start = this.text.substr(0, charToRemove-1);
        end = this.text.substr(charToRemove);

        this._SetInput( start + end );

        if ( !removeFromRight )
            this.moveCursor(-1);
        else
            this._SetSelectedChar()
    }

    ClearText()
    {
        this._SetInput( "" );
        this.SetCursor(0);
    }

    _SetInput( text )
    {
        this.text = text;
        this.inputElement.innerHTML = text.replace(/ /g, "&nbsp;");
    }

    SetCursor( pos ){

        this.current_char = pos;
        this.cursorElement.style.left = (10.625 * pos) + "px";
        this._SetSelectedChar( );
    }

    moveCursor( amt ){

        this.current_char += amt;
        
        if ( this.current_char < 0 )
            this.current_char = 0;
        else if ( this.current_char > this.text.length)
            this.current_char = this.text.length;

        this.cursorElement.style.left = (10.625 * this.current_char) + "px";
        this._SetSelectedChar( );
    }

    _SetSelectedChar( pos )
    {
        var char = "";

        if ( this.current_char < this.text.length )
            char = this.text[this.current_char];
        
        this.cursorCharElement.innerHTML = char;
    }

}