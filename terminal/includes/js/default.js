
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
    contentTemplate = json.contentTemplate;

    // load the template, if not already loaded
    if ( contentTemplate.name != null && ( !(contentTemplate.name in templates) || contentTemplate.name != responceQueue.templateName ) )
    {
        LoadTemplate( contentTemplate.name )
        responceQueue.templateName = requestName;
        responceQueue.jsonStr = jsonStr;
        return;
    }

    headerElement.innerHTML = json.header;
    subHeaderElement.innerHTML = json.subHeader;

    contentElement.innerHTML = json.content.join(" ");

}

LoadTemplate = function( template )
{
    if ( template in templates ) return;

    Common.LoadContent( Const.basePath + "/pages/" + template + ".html", StoreTemplate, template )
    templates[template] = null; // Add the template to the templates so we dont handle the same request brfore a responce comes back.

}

StoreTemplate = function( templateStr, pageName )
{

    // TODO. check for error responce.
    templates[pageName] = templateStr;

    // trigger the Json Formater if this page is in the responce Queue.
    if ( responceQueue.templateName == pageName )
    {
        JsonFormator( responceQueue.jsonData );
        responceQueue.templateName = null;
        responceQueue.jsonStr = null;
    }

}