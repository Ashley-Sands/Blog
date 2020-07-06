
var headerElement = document.getElementById("content-header");
var subHeaderElement = document.getElementById("content-sub-heading");
var contentElement = document.getElementById("content-main");

var templates = {}
var responceQueue = {
    templateName: null,
    jsonStr: null
}
 
function ContentObject (url, callback, parent=null, isTemplate=false){
    /**
     * @param url:          content url.
     * @param callback:     the callback method, responsible for handlering the content
     * @param parent:       the parent contentObject that triggered the request. null if user/origin request.
     */

    this.url = url;
    this.callback = callback;
    this.parent = parent;                  // if isTemplate and parent is set, parent is waiting for template to load.
    this.isTemplate = isTemplate;

    this.responce = "";
    
    this.loaded = false;
    this.error = false;
    this.canceled = false;
    
    this.Useable = function(){
        return ( parent == null || parent.Usable() ) && !canceled && !error && loaded;
    }

}

var contentCache = {
    templates: {},
    pages: {},
    additinalContent: {}
};

var pages = [ "about", "git", "blogs"]  // assumed that element is the entry page
var spanElementID = 0;

LoadContent = function( page )
{
    var url = Const.basePath + "/pages/" + page + ".json";
    Common.LoadContent( url, JsonFormator, page );
    location.hash = page

    // update the last updated.
    Common.FetchHeader( url, "Last-Modified", 
    document.getElementById("last-updated"), 
    "Last Updated<br/>{responce}" )

}

JsonFormator = function( jsonStr, requestName )
{
    
    var json = JSON.parse( jsonStr );

    var contentTemplate = null;
    var jsFunctions = null
    var additionalContent = null

    if ( "contentTemplate" in json )
        contentTemplate = json.contentTemplate;

    if ( "jsFunctions" in json )
        jsFunctions = json.jsFunctions;

    if ( "additionalContent" in json )
    {
        // reg ex to extract addCont vars var re = /\$\{([a-zA-Z][a-zA-Z0-9-_]*)(?<![-_])\}/
        additionalContent = json.additionalContent;
    }

    // load the template, if not already loaded
    if ( contentTemplate != null && ( !(contentTemplate in templates) ) )
    {
        console.log( `Loading Template for page ${contentTemplate}` )
        LoadTemplate( contentTemplate )
        responceQueue.templateName = requestName;
        responceQueue.jsonStr = jsonStr;
        return;
    }

    var content = json.content;
    var outputContent = "";

    if ( contentTemplate == null )
    {
        // make sure the fist element of content is a string.
        if (content.length > 0 && ( typeof content[0] == "string" || content[0] instanceof String) )  // check both primitive and object
            outputContent = content.join(" ");
        else
            console.log(`Warning: Either no content suppled or content is not a String (Content Len: ${content.length}) `)
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
                console.log("Error: Content supplied for template was a string or Array. must be json object")
                break;
            }


            keys = Object.keys( tempCont );
            template = templates[ contentTemplate ];

            for ( var k = 0; k < keys.length; k++)
            {
                var contentString = "error :(";

                // find if the content @ key is a string or an array
                if ( typeof tempCont[keys[k]] == "string" || tempCont[keys[k]] instanceof String )
                    contentString = tempCont[ keys[ k ] ]
                else if( tempCont[keys[k]] instanceof Array )
                    contentString = tempCont[ keys[ k ] ].join( " " );
                else
                    console.log("Error: Could not parse content into html, content is nither a string or array");

                template = template.replace( `{${keys[k]}}`, contentString );

            }

            outputContent += template;
        }
    }

    headerElement.innerHTML = json.header;
    subHeaderElement.innerHTML = json.subHeader;
    contentElement.innerHTML = outputContent == "" ? "<p class='center'>No Content :(</p>" : outputContent;

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

LoadTemplate = function( template )
{
    if ( template in templates ) return;

    Common.LoadContent( Const.basePath + "/pages/templates/" + template + ".html", StoreTemplate, template )
    templates[template] = null; // Add the template to the templates so we dont handle the same request brfore a responce comes back.

}

StoreTemplate = function( templateStr, pageName )
{

    // TODO. check for error responce.
    templates[pageName] = templateStr;

    // trigger the Json Formater if this page is in the responce Queue.
    if ( responceQueue.templateName == pageName )
    {
        JsonFormator( responceQueue.jsonStr );
        responceQueue.templateName = null;
        responceQueue.jsonStr = null;
    }

}

// Load the request page, (TODO: it might be worth change if from hash to the history method )
requestPage = location.hash.substring(1).toLowerCase();
loadPage = pages[0];

console.log("requestPage is "+requestPage)

if ( pages.includes(requestPage) )
    loadPage = requestPage;

LoadContent( loadPage );

// update the foot year
document.getElementById("year").innerHTML = Common.Year();
