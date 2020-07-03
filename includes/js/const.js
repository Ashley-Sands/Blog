
class Const{

    static get basePath()
    {
        
        if (location.hostname == "localhost")
            return "http://localhost/ashleysands.co.uk";
        else
            return "https://www.ashleysands.co.uk"

    }

    static get OneDayMillis()
    {
        return 1000*60*60*24;
    }

    static get OneYearMillis()
    {
        return this.OneDayMillis * 365;
    }

}
