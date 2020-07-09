
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

SwitchClass = function(element, fromClass, toClass, reversible=false)
{
    /**
     * Switch all elements with class to another class
     * @param element: the element that trigger the event
     * @param fromClass: the class to switch from
     * @param toClass: the class to switch to.
     * @param reversible: can the change be reversed.
     */

    // find the current state of the element that triggered the event,
    // to find if the class needs changing.
    var elemClasses = element.classList;
    var isFrom = elemClasses.contains( fromClass );
    var isTo   = elemClasses.contains( toClass );

    console.warn(isFrom +" && "+ isTo)

    if ( !isFrom && !isTo ) return;
    else if ( isTo && reversible ) UpdateElementsWithClassName(toClass, fromClass);
    else if ( isFrom ) UpdateElementsWithClassName(fromClass, toClass);
    else console.warn("Unable to switch class, non reversible or some how we're in both states?")

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

SetElementTopPosition = function( elementIdToSet, classToCount, classHeight, negitive=true, offset=0 ){
    /** 
     * Sets the top position of element of elementIdToSet. to classHeight * elements with class classToCount + offset
     * @param elementIdToSet:   Name of Element Id To Set
     * @param classToCount:     the name of the element class to count
     * @param classheight:      (int) the height of the elements in px
     * @param negive:           should the value be mutlipled by -1
     * @param offset            (int) any addisional offset that shold be applied in px
     */
    console.warn("SetTopPosition..................")
    var classElements = document.getElementsByClassName(classToCount).length;
    var topOffset = (classElements * classHeight + offset) * (negitive ? -1 : 1);

    document.getElementById(elementIdToSet).style.top = `${topOffset}px`;

}