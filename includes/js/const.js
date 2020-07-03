
class Const{

    static get basePath()
    {
        
        if (location.hostname == "localhost")
            return "http://localhost/Portfolio2.0";
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
