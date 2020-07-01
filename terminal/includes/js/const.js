
class Const{

    static get basePath()
    {
        
        if (location.hostname == "localhost")
            return "http://localhost/Portfolio2.0/terminal";
        else
            return "https://www.ashleysands.co.uk/terminal"

    }

}
