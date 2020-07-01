
var headerElement = document.getElementById("content-header");
var subHeaderElement = document.getElementById("content-sub-heading");
var contentElement = document.getElementById("content-main");

var templates = {}
var responceQueue = {
    templateName: null,
    jsonStr: null
}

var pages = [ "about", "git", "blogs"]  // assumed that element is the entry page

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

    if ( "contentTemplate" in json )
        contentTemplate = json.contentTemplate;


    // load the template, if not already loaded
    if ( contentTemplate != null && ( !(contentTemplate in templates) ) )
    {
        console.log( `Loading Template for page ${contentTemplate}` )
        LoadTemplate( contentTemplate )
        responceQueue.templateName = requestName;
        responceQueue.jsonStr = jsonStr;
        return;
    }

    console.log( jsonStr );

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
                console.log(`Replace {${keys[k]}} with ${tempCont[keys[k]]}`);
                template = template.replace( `{${keys[k]}}`, tempCont[keys[k]] );
            }

            outputContent += template;
        }
    }

    headerElement.innerHTML = json.header;
    subHeaderElement.innerHTML = json.subHeader;
    contentElement.innerHTML = outputContent == "" ? "<p class='center'>No Content :(</p>" : outputContent;

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
