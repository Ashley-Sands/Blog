
ToggleMode = {
    "SINGLE": 0,
    "MULTIPLE": 1
}

ToggleClass = function( element, toggleA, toggleB, activeModeA=ToggleMode.SINGLE, activeModeB=ToggleMode.SINGLE )
{
    /** Toggle call from toggleA to ToggleB or vise verser.
     *  if the calling element does not contatin class toggleA or B 
     *  function call is ignored.
     *  params
     *  @param toggleA:         class name a
     *  @param toggleB:         other class name
     *  @param activeModeA:     can toggleA have a single or multiple elements active at the same time
     *  @param activeModeB:     can toggleB have a single or multiple elements active at the same time
     *  ie. if we have class 'active' and 'inactive'
     */

    var elemClasses = element.classList;
    var isA = elemClasses.contains( toggleA );
    var isB = elemClasses.contains( toggleB );
    var activeClass, inactiveClass;

    if ( !isA && !isB )
    {
        console.log( `Error: unable to toggle class. element does not contain ${toggleA} nor ${toggleB}`)
        return;
    }

    activeClass = isA ? toggleA : toggleB;
    activeMode = isA ? activeModeA : activeModeB; // needed ???
    inactiveClass = isA ? toggleB : toggleA;
    inactiveMode = isA ? activeModeB : activeModeA; 

    console.log( `Toggle class (current active) ${activeClass} to (current inactive): ${inactiveClass}` )

    if ( inactiveMode == ToggleMode.SINGLE ) // toggle to inactive. making sure all active's are set to inactives
    {
        UpdateElementsWithClassName(inactiveClass, activeClass);
        UpdateElementClassName(element, activeClass, inactiveClass);
    }
    else
    {
        if ( activeMode == ToggleMode.SINGLE ) // make sure the all actives are close if in sigle mode. (Unlikly case, but lets make sure)
            UpdateElementsWithClassName( activeClass, inactiveClass )
        else
            UpdateElementClassName(element, activeClass, inactiveClass);
    }


}

UpdateElementsWithClassName = function( from, to )
{
    /** Updates all elements with class name 'from' to 'to' */
    var elements = document.getElementsByClassName(from);

    // go backwards so we dont skip any elements 
    // as we are removing em'
    for ( var i = elements.length-1; i >= 0 ; --i)  
    {
        UpdateElementClassName(elements[i], from, to);
    }
}

UpdateElementClassName = function( element, from, to )
{
    element.classList.remove( from );
    element.classList.add(to); 
}
