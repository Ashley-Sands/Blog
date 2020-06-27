
class Common
{
    static Year()
    {
        return new Date().getFullYear()
    }

    static LoadContent( url, responceElem )
    {
        var request = new XMLHttpRequest();
        request.onreadystatechange = function() 
        {
            if (this.readyState == 4 && this.status == 200) 
            {
                responceElem.innerHTML = this.responseText;
            }
            else if ( this.status >= 300)
            {
                responceElem.innerHTML = `Error: ${this.status}`
            }
        };

        request.open("GET", url, true);
        request.send();
    }

}
