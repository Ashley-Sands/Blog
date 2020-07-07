
function ContentObject (url, callback, parent=null, requiresParentInUse=false){
    /**
     * @param url:          content url.
     * @param callback:     the callback method, responsible for handlering the content
     * @param parent:       the parent contentObject that triggered the request. null if user/origin request.
     */

    this.url = url;

    this.callback = callback;
    this.callbackParams = [];       // any parmas that should be passed into the callback along with content object

    this.parent = parent;  
    this.requiresParentInUse = requiresParentInUse; //??

    this._responceParser = null;

    this.responceHeaders = {"Last-Modified": ""}
    this.responce = "";
    
    this.htmlElementId = null;
    this.htmlElement = null;

    this.state = 0;     // Initialized == 0. You can not put the object back into an Initialized state
    this.canceled = false;

    this.handleHTTPError = null  // callback to handle any HTTP error. TODO: <<

    this.SetResponceParser = function( parser ){
        this._responceParser = parser;
    }

    this.Usable = function(parentInUse=false){
        /**
         * @param parentInUse:  Usable only if the TOP MOST parent (parent == null) is considered usable.
         *                      Any objects with a parent (not top most) will considered usable in both loaded and inUse.
         *                      // This may change at a later date.
         */
        // Aways use the greatest inUse value.
        parentInUse = parentInUse || this.requiresParentInUse;

        var parentUsable = ( parent == null || parent.Usable(parentInUse) );
        var usable = parent == null && parentInUse && this.state == 3   || // if we are the top most parent, and parentInUse is true, we must be in the IsUse state to be usable
                    ( parent == null && !parentInUse || parent != null ) && 
                    ( this.state >= 2 );

        return parentUsable && usable && !this.canceled;

    }

    this.Use = function()
    {
        /** Loads the object if unloaded otherwise
         *  trigger the callback if usable and not in use 
         * */
 

        if (this.state == 0)
            this.Load();
        else if ( this.state >= 2 && this.Usable() )
            callback( this, ...this.callbackParams );
        else
            console.warn(`Unable to use content from url: ${this.url}`)
        
        var parentState = null;

        if (this.parent)
            parentState = this.parent.state;

        console.log( `Use info for ${this.url} || State: ${this.state} Usable: ${this.Usable()}. Parent: ${this.parent} pState: ${parentState})` );

    }

    this.Load = function( reload = false ){

        if ( this.state == 0 || reload )
        {
            this.SetState.Loading();
            Common.LoadContent( this );
        }

    }

    this.UpdateHTMLElement = function(){

        if ( this.htmlElementId == null )
        {
            console.error("Unable to update html element no elementId set");
            return;
        }

        try{

            if ( this.htmlElement == null )
                this.htmlElement = document.getElementById( this.htmlElementId );

            this.htmlElement.innerHTML = this.responce;

        }catch(error){
            console.error( `Unable to update html element. (${error})` )
        }

    }

    this.SetResponce = function( responceString ){

        if ( this._responceParser )
            this.responce = this._responceParser( responceString );
        else
            this.responce = responceString;

    }

    this.HasResponce = function(){
        return this.state >= 2;
    }

    this.SetState = {   
        Error:       ()=>this.state = -1,
      //Initialize   ()=>this.state = 0,         // Note this only here for clarity. You can NEVER put a contentObj back into an init state.
        Loading:     ()=>this.state = 1,
        Loaded:      ()=>this.state = 2,         // any value above 2 singles that we have a valid/usable responce.
        InUse:       ()=>this.state = 3,
    }


}