
var headerElement = document.getElementById("content-header");
var subHeaderElement = document.getElementById("content-sub-heading");
var contentElement = document.getElementById("content-main");

JsonFormator = function( jsonStr )
{
    var json = JSON.parse( jsonStr );

    headerElement.innerHTML = json.header;
    subHeaderElement.innerHTML = json.subHeader;
    contentElement.innerHTML = json.content.join(" ");

}

LoadContent = function( page )
{
    Common.LoadJsonContent( Const.basePath + "/pages/" + page + '.json', JsonFormator );
    location.hash = page
}
