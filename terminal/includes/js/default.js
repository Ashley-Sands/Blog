
var headerElement = document.getElementById("content-header");
var subHeaderElement = document.getElementById("content-sub-heading");
var contentElement = document.getElementById("content-main");

var templates = {}
var responceQueue = {
    templateName: null,
    jsonStr: null
}

LoadContent = function( page )
{
    Common.LoadContent( Const.basePath + "/pages/" + page + ".json", JsonFormator, page );
    location.hash = page
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

    var content = json.content;
    var outputContent = "";

    if ( contentTemplate == null )
    {
        outputContent = content.join(" ");
    }
    else
    {
        console.log("Building Template Content... element count: " + content.length)

        for ( var i = 0; i < content.length; i++ )
        {
            tempCont = content[i];

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
    contentElement.innerHTML = outputContent == "" ? "No Content :(" : outputContent;

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