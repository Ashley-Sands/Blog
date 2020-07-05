# JavaScript MarkDown Parser (JsMd Parser).
## By Ashley Sands 2020 
### version 0.1.0
### Lincence: CC-BY 4.0
#### WARNING: I have not covered any edge cases, so use at your own risk!

## About 
JsMd Parser is a simple md parser tool that convers to html (by default)   
JsMd parses in 2 stages,  
Stage one: Parse lines.                 (single pass per line)  
Parses the file line by line to define headers and paragraphs.  
Building the output string without formating/images ect.  

Stage two: Parse output string          (multiple passes output)  
Parses the entire output string untill there are not match remaining.  

It is done in two passes for a few of reasons.  
1. headers can only be defined on a single line and consumes the intire line.  
2. unformed text can span multiple lines, meaning we need to accumalte all the text with line breaks
   into a single 'p' tag

3. Bold/Italic can also span multiple lines, and should be contatined within 'p' tags.  
   By doing it on the second pass, we are able to get a match across multiple lines
   and contatined with the header or pargraph tags
   WARNING: there is a edge case that is not covered in the solution.  
   it is posible to define bold/italic that start in one tag and end in another.  
     
   ie.
   '
   **start bold
   # im a header
   im paragraph** im the same paragraph.

   '
    this would output
    '<p><b>start bold</p><h1>im header</h1><p>i'm paragraph </b> im the same paragraph</p>'
    which is a very unhappy web browser, as its not vaild HTML flow.
    
    ^^^ Good luck parsing this file :P ^^^
    (after note, it seam all good. tbf to chrome its handled it well :) )


    Notes. regex (i will fix this edge case at some point)
    Finds tags with no end tag.
    <([a-zA-Z0-9]*)>(?!(.*<\/\1>))

## overriding default output html
It is posible to override the default output html by suppling an objects with keys that you want to override
example.
var overrideKeys = {
    header: {
        "##": "<h2 class='myClass'>{v0}</h2>",
        "####": "<h4 class='myClass'>{v0}</h4>"
    },
    boldItalic{
        "*": "<span class='MyItalicClass'>{v0}</span>"
    }
}

would override the h2 (##), h4 (####) and italic output HTML while the reset would remain default.

values are defined as {v0} or {v1} formate: {v[value-index]}
unless its an element that runs in additive mode, in witch case its just {v} (the additive output key must be '$complete')

## overriding default outputs, formate keys
#### Line Parse
header:     (mode: normal)
{v0}    = text string
paragraph:  (mode: addative)
{v0}    = text string to be acculated
{v}     = valid only for key '$complete' acculated text position

#### After Parse
boldItalic:
{v0}    = string to be bold, italic or both
linksImages:
{v0}    = if image alt text. if link, link text
{v1}    = if image src. if link href



## Support
JsMd Parse has vrey limited support.

#### Headers.
All headers 1-6 useing # = h1, ## = h2 ect...
example: ### Im a header
output: <h3> Im a header </h3>

#### paragraphs and line breaks
Any line that does not start with a # is considered a paragraph
line breaks are defined '  \n' (2 spaces + new line char)

example: 
Im the first line of the paragraph  
and im the Second

output: 
<p>Im the first line of the paragraph<br />and im the Second</p>

#### Bold and Italic text.
*text*     = italic
**test**   = bold
***text*** = bold and italic

#### images and links
[linkText](link-href) = hyperlink
![alt-text](image-src) = image

## Future support (currently no support)
- tables  
- list  
- block quotes  
- fenced code blocks (unlikly support)  
- underline / strike throught  
- task-list (unlikly support)  

## Changes
None as of inital release.
