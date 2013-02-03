Autocomplete
============

Cross browser autocomplete implementation using HTML5's &lt;datalist&gt; element.

Demo
----

http://www.matts411.com/static/demos/autocomplete/index.html

Features
--------

* Cross browser compatible (Chrome, Firefox, Safari, Opera, Internet Explorer 7+)
* Framework independent - Works with jQuery, Mootools, etc.
* Works with HTML5's &lt;datalist&gt; element
* Add and remove autocomplete suggestions on the fly
* Accepts an array or XML as input or retrieves from DOM
* Supports dynamic choice populating via Ajax
* Touch friendly

Installation
------------

Minify and add `src/Autocomplete.js` and `src/Autocomplete.css` to your website's 
resources directory. You can change some of the styling in Autocomplete.css to suit 
your needs.

Usage
-----

Create an `input` element with an `id` attribute:

    <input id="myInput" type="text">

Initialize the autocomplete functionality on the `input` element using Javascript:

    new Autocomplete("myInput", {
        srcType : "array", 
        srcData : ["example 1", "example 2", "example 3", "example 4"]
    });

Or, with XML data enter something like:

    new Autocomplete("myInput", {
        srcType : "xml", 
        srcData : "<datalist><option value='example 1'/><option value='example 2'/></datalist>"
    });

If an `input` element has an attached `datalist` element, some additional setup is 
required:

    <input id="myInput" type="text" list="myDatalist">
    <div class="aListCon">
        <datalist id="myDatalist">
            <!--[if IE 9]><select disabled><![endif]-->
            <option value="example 1">
            <option value="example 2">
            <option value="example 3">
            <option value="example 4">
            <!--[if IE 9]></select><![endif]-->
        </datalist>
    </div>

In the example above, the wrapping `<div class="aListCon">` element hides the `datalist` 
data from browsers that do not support the `datalist` element. Additionally, to support 
Internet Explorer 9, conditional tags are needed to create a hidden `select` element. 
These conditional tags are ignored by all other browsers.

To initialize the above `input` element with attached `datalist` element, enter the 
following initialization code in Javascript:

    new Autocomplete("myInput", {
        srcType : "dom"
    });

See the demo source code for a full example.

Ajax Support
------------

As the user enters their value into the text field, it is possible to tie in roundtrip server requests via 
Ajax to populate the autocomplete options. To do this, use the onInput option:  

    new Autocomplete("myInput", {
        srcType : "dom", 
        onInput : function(newValue, oldValue) {
            var autocomplete = this;
            sendAjaxRequest(newValue, function(values) {
                // Execute callback:
                autocomplete.addValues(values);
            });
        }
    });

The `addValues` method will take care of the rest.  

Please note that some browsers such as Chrome v25 do not update the displayed list of choices (until you 
change the text field value) if using the native UI. It is therefore recommended that if you plan on using 
Ajax with the autocomplete code, you should for now set useNativeInterface to `false`.

Options
-------

**srcType**  
String. Must be either `"array"`, `"dom"` or `"xml"`.  
Default is `""`.

**srcData**  
Variable. If `srcType` is `"array"`, an array of strings is accepted. If `srcType` is `"dom"`, `srcData` 
is ignored. If `srcType` is `"xml"`, an xml string or document is accepted. Use 
`myAutocompleteInstanceObject.addValues(arrayOfStringValues)` and 
`myAutocompleteInstanceObject.removeValues(arrayOfStringValues)` to add and remove autocomplete values 
after initialization.  
Default is `""`.

**useNativeInterface**  
Boolean. Whether or not to use the browser's native autocomplete interface. This option is ignored if 
`srcType` is not `"dom"` or the `datalist` element is not natively supported by the browser.  
Default is `true`.

**offsetTop**
Integer. If the autocomplete dropdown is not displaying directly under the `input` field, adjust this 
option to change the dropdown's vertical position. Negative integers also accepted. If a browser is using 
its native autocomplete interface this option is ignored.  
Default is `0`.

**offsetLeft**
Integer. If the autocomplete dropdown is not displaying directly aligned with the `input` field, adjust 
this option to change the dropdown's horizontal position. Negative integers also accepted. If a browser is 
using its native autocomplete interface this option is ignored.  
Default is `0`.

**maxChoices**
Integer. The maximum number of autocomplete choices to display. If a browser is using its native autocomplete 
interface this option is ignored.  
Default is `6`.

**highlightColor**  
String. The color value to set as the text color for highlighted autocomplete values. If a browser is using 
its native autocomplete interface this option is ignored.  
Default is `"#ffffff"`.

**highlightBgColor**  
String. The color value to set as the background color for highlighted autocomplete values. If a browser is 
using its native autocomplete interface this option is ignored.  
Default is `"#3399ff"`.

**onInput**
Function. Called when user changes the text field value. Returned in `arguments` are the new value and last 
value prior to the change.  
Default is a function that does nothing.

**onInputDelay**
Integer. The time to wait in milliseconds after the user stops typing before firing the `onInput` function. 
This can be a useful option to throttle Ajax requests.  
Default is `0`.

Future Features
---------------

None scheduled at this time.

License
-------

MIT-style license.  
Copyright 2012 Matt V. Murphy | bW11cnBoMjExQGdtYWlsLmNvbQ==
