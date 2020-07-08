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

LoadContent = function( page )
{
    var path = "/pages/" + page + ".json";
    var url = Const.basePath + path;

    if ( !(page in contentCache.pages) )    // load content if not in chach.
    {
        var contentRequest = new ContentObject( url, JsonFormator, HTTPErrorHandler );
        contentRequest.SetResponceParser( (jsonStr)=>JSON.parse(jsonStr) );
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
    var json = contentObj.responce;
    var content = json.content;
    var defaultTemplate = null;
    var jsFunctions = null;

    if ( "~defaultTemplate" in json )
        defaultTemplate = json["~defaultTemplate"];

    if ( "jsFunctions" in json )
        jsFunctions = json.jsFunctions;

    if ( "additionalContent" in json )
    {
        LoadAdditionalContent( json.additionalContent, contentObj );
    }

    // load any templates, that are not already loaded
    // while blocking if any templates are still loading.
    var loadingTemplate = defaultTemplate != null                               && 
                          defaultTemplate in contentCache.templates             && 
                          contentCache.templates[defaultTemplate].IsLoading();

    if ( defaultTemplate && !loadingTemplate)
        LoadTemplate( defaultTemplate, contentObj );

    for ( var i = 0; i < content.length; i++ )
    {
        let contentTemplate = "~template" in content[i] ? content[i]["~template"] : null;
        console.log(i + "@@ "+contentTemplate);

        if ( contentTemplate != null && content[i]["~template"] in contentCache.templates)
            loadingTemplate = contentCache.templates[ content[i]["~template"] ].IsLoading();

        if ( contentTemplate != null && !loadingTemplate )
            LoadTemplate( contentTemplate, contentObj );

    }

    if ( loadingTemplate ) return;  // wait for all template to be loaded.

    // unset any page content set as inUse
    for ( var i = 0; i < contentCache.pages.length; i++)
    {
        if ( contentCache.pages[i].state == 3 )
            contentCache.pages[i].SetState.Loaded();
    }

    var outputContent = "";

    if ( content.length > 0 && ( typeof content[0] == "string" || content[0] instanceof String) )
    {   // if content is supplied as a list of strings, format the content without a template.
        console.log("Building Content Without Tempalte")
        outputContent = content.join(" ");
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
            var template = defaultTemplate != null ? contentCache.templates[ defaultTemplate ].responce : null ; 
            console.log( contentCache.templates[ defaultTemplate ] );
            //console.log("responce "+ contentCache.templates[ defaultTemplate ].responce );
            console.log("responce "+ template );

            if ( "~template" in tempCont && !contentCache.templates[ tempCont["~template"] ].HasResponce() )
            { 
                console.log("ccontinue Temp");      
                console.log( contentCache.templates[ tempCont["~template"] ] ); 
                continue;     
            }
            else if ( "~template" in tempCont )
            {
                template = contentCache.templates[ tempCont["~template"] ].responce;
                console.log("No cTemp");      
                console.log( template );    
                //console.log( template.responce );    
            }

            for ( var k = 0; k < keys.length; k++)
            {
                // any key starting with '~', as treated as content formating option
                // therefore the value should not be parsed to the outputContent.
                if ( keys[k][0] == "~")
                    continue;

                var contentString = "error :(";
 
                // find if the content @ key is a string or an array
                if ( typeof tempCont[keys[k]] == "string" || tempCont[keys[k]] instanceof String )
                    contentString = tempCont[ keys[ k ] ]
                else if( tempCont[keys[k]] instanceof Array )   // multipline support. values must be strings.
                    contentString = tempCont[ keys[ k ] ].join( " " );
                else
                    console.error("Error: Could not parse content into html, content is nither a string or array");

                console.log( (template==null)+" && "+ (defaultTemplate!=null) );
                console.log( template +" \n fuck you ");
                if ( template != null)
                    template = template.replace( `{${keys[k]}}`, contentString );
                else    // if there no template parse the content directly into the output.
                    outputContent += contentString;

            }
            console.log( "final " + template != null );

            if ( template != null )
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
                                             HTTPErrorHandler,
                                             parentRequest    );

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
            contentRequest = new ContentObject( contentValue.url, HandleAdditinalContent, HTTPErrorHandler, requestParent, true );
            contentRequest.callbackParams = [contentKey];

            if ( contentValue.parseMd )
                contentRequest.SetResponceParser( (mdStr)=>markDownParser.parse(mdStr) );

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

HTTPErrorHandler = function( errorContentObject )
{
    console.error( `An Error Occurred load content from ${errorContentObject.url} (resopnce: ${errorContentObject.responceStatus})` );

    // TEMP FIX: for now until i get round to making it async
    // the parent must still be called. 
    // (any error elements just get ignored. what they dont know wont kill em)

    if ( errorContentObject.parent != null )
        errorContentObject.parent.callback( errorContentObject.parent )

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

LoadTemplate( "error", null);
LoadContent( loadPage );

// update the foot year
document.getElementById("year").innerHTML = Common.Year();
