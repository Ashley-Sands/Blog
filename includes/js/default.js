var headerElement = document.getElementById("content-header");
var subHeaderElement = document.getElementById("content-sub-heading");
var contentElement = document.getElementById("content-main");
var lastUpdateElement = document.getElementById("last-updated");
 
var markDownParser = new MarkDownParse();

var contentCache = {
    templates: {},
    pages: {},
    additinalContent: {}
};

var pages = [ "about", "git", "blogs"]  // assumed that element is the entry page
var nextHtmlElementId = 0;

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

LoadContent = function( page )
{
    var path = "/pages/" + page + ".json";
    var url = Const.basePath + path;

    if ( !(page in contentCache.pages) )    // load content if not in chach.
    {
        var contentRequest = new ContentObject( url, JsonFormator );
        contentCache.pages[page] = contentRequest;
        console.log(`loading content: ${path} `)
    }
    else
    {
        console.log( `using chached page for ${page}` )
    }

    contentCache.pages[page].Use(); 
    location.hash = page;

}

JsonFormator = function( contentObj )
{
    var json = JSON.parse( contentObj.responce );
    var content = json.content;
    var contentTemplate = null; // remove.
    var jsFunctions = null;

    if ( "contentTemplate" in json )
        contentTemplate = json.contentTemplate;

    if ( "jsFunctions" in json )
        jsFunctions = json.jsFunctions;

    if ( "additionalContent" in json )
    {
        LoadAdditionalContent( json.additionalContent, contentObj );
    }

    // load the template, if not already loaded
    if ( contentCache.templates != null && ( !(contentTemplate in contentCache.templates) ) )
    {
        console.log( `Loading Template for page ${contentTemplate}` );
        LoadTemplate( contentTemplate, contentObj );
        return;
    }

    // unset any page content set as inUse
    for ( var i = 0; i < contentCache.pages.length; i++)
    {
        if ( contentCache.pages[i].state == 3 )
            contentCache.pages[i].SetState.Loaded();
    }

    var outputContent = "";

    if ( contentTemplate == null )
    {
        // make sure the fist element of content is a string.
        if (content.length > 0 && ( typeof content[0] == "string" || content[0] instanceof String) )  // check both primitive and object
            outputContent = content.join(" ");
        else
            console.warn(`Warning: Either no content suppled or content is not a String (Content Len: ${content.length}) `)
    }
    else
    {
        console.log("Building Template Content... element count: " + content.length)

        for ( var i = 0; i < content.length; i++ )
        {
            tempCont = content[i];

            // make sure that tempCont is not a string or array.
            if ( typeof tempCont == "string" || tempCont instanceof String || tempCont instanceof Array)  // check both primitive and object
            {
                console.error("Error: Content supplied for template was a string or Array. must be json object")
                break;
            }


            keys = Object.keys( tempCont );
            template = contentCache.templates[ contentTemplate ].responce;

            for ( var k = 0; k < keys.length; k++)
            {
                var contentString = "error :(";
 
                // find if the content @ key is a string or an array
                if ( typeof tempCont[keys[k]] == "string" || tempCont[keys[k]] instanceof String )
                    contentString = tempCont[ keys[ k ] ]
                else if( tempCont[keys[k]] instanceof Array )
                    contentString = tempCont[ keys[ k ] ].join( " " );
                else
                    console.error("Error: Could not parse content into html, content is nither a string or array");

                template = template.replace( `{${keys[k]}}`, contentString );

            }

            outputContent += template;

        }
    }

    outputContent = FormatContentElements( outputContent );

    headerElement.innerHTML = json.header;
    subHeaderElement.innerHTML = json.subHeader;
    contentElement.innerHTML = outputContent == "" ? "<p class='center'>No Content :(</p>" : outputContent;

    contentObj.SetState.InUse();  //<< this breaks things :|

    if ( "Last-Modified" in contentObj.responceHeaders )
    {
        lastUpdateElement.innerHTML = `Last Updated<br />${contentObj.responceHeaders["Last-Modified"]}`
    }

    if ( jsFunctions != null )
        for ( var i = 0; i < jsFunctions.length; i++)
        {
            TriggerFunction( jsFunctions[i] );
        }

}

TriggerFunction = function( functName )
{
    /** Triggers function with funct name
     *  iv decided to do this rather then use eval so i dont have to deal with any security floors
     */
    switch( functName.toLowerCase() )
    {
        case "age":
            document.getElementById("age").innerHTML = Common.Age();
            break;
        case "started-years-ago":
            document.getElementById("started-years-ago").innerHTML = Common.StartedYearsAgo();
            break;
    }
}

LoadTemplate = function( templateName, parentRequest )
{
    if ( templateName in contentCache.templates ) return;

    var templateRequest = new ContentObject( Const.basePath + "/pages/templates/" + templateName + ".html",
                                             CacheTemplate, 
                                             parentRequest );

    templateRequest.Load();
    contentCache.templates[ templateName ] = templateRequest;

}

CacheTemplate = function( contentObj )
{

    if ( !contentObj.Usable() )
    {
        console.log("Error reciving template.");
        return;
    }

    // trigger the parent if available
    if ( contentObj.parent != null )
    {
        contentObj.parent.callback( contentObj.parent );
        contentObj.parent = null;
    }

}

FormatContentElements = function( contentString ){

    // Replace any formating elements with html elements  
    // inputing any content that is already available in the cache
    
    var regex = /\$\{([a-zA-Z][a-zA-Z0-9-_]*)(?<![-_])\}/;
    var reMatch = regex.exec( contentString );

    while( reMatch != null )
    {
        var cachedContent = null;
        var cachedResponce = "";
        var elementId = reMatch[1] +"-"+ nextHtmlElementId++;
        console.log( reMatch[1] + " in AC content " + Object.keys( contentCache.additinalContent ) + " :: " + (reMatch[1] in contentCache.additinalContent) );
        if ( reMatch[1] in contentCache.additinalContent )
        {
            cachedContent = contentCache.additinalContent[ reMatch[1] ];

            if ( cachedContent.HasResponce() )
                cachedResponce = contentCache.additinalContent[ reMatch[1] ].responce;

            cachedContent.htmlElementId = elementId;

        }
        
        var elementString = `<span id="${elementId}">${cachedResponce}</span>`;

        contentString = contentString.replace( reMatch[0], elementString );

        reMatch = regex.exec( contentString );
        console.log( reMatch );
    }

    return contentString;

}

LoadAdditionalContent = function( additinalContent, requestParent )
{

    var contentKeys = Object.keys( additinalContent );

    for ( var i = 0; i < contentKeys.length; i++ )
    {
        var contentKey = contentKeys[i];
        var contentValue = additinalContent[contentKey];
        var contentRequest = null;

        if ( !(contentKey in contentCache.additinalContent) )
        {
            contentRequest = new ContentObject( contentValue.url, HandleAdditinalContent, requestParent, true );
            contentRequest.callbackParams = [contentKey];

            if ( contentValue.parseMd )
                contentRequest.SetResponceParser( (string)=>markDownParser.parse(string) );

            // Cache the content :)
            contentCache.additinalContent[ contentKey ] = contentRequest;
            
            console.log(`Creating Content Object for ${contentKey} (ADC)`);
        }
        else
        {
            contentRequest = contentCache.additinalContent[ contentKey ];
            contentRequest.parent = requestParent;      // update the parent to match the request.

            console.log(`Useing Cached Content Object for ${contentKey} (ADC)`);

        }
        
        if ( contentValue.preLoad )
            contentRequest.Load();

    }

}

HandleAdditinalContent = function( contentObj, contentKey ){

    console.log("HandleAdditinalContent " + contentObj.Usable() );
    if ( !contentObj.Usable() )
        return;

    contentObj.UpdateHTMLElement();

}

UseContent = function( contentKey )
{
    /** Uses caches content in additinalContent */

    if ( !(contentKey in contentCache.additinalContent) )
    {
        console.error( `No Content Found for ${contentKey}` );
        return;
    }

    var content = contentCache.additinalContent[ contentKey ];
    content.Use()

}

// Load the request page, (TODO: it might be worth change if from hash to the history method )
requestPage = location.hash.substring(1).toLowerCase();
loadPage = pages[0];

if ( pages.includes(requestPage) )
    loadPage = requestPage;

LoadContent( loadPage );

// update the foot year
document.getElementById("year").innerHTML = Common.Year();
