////////////////////////////////////
//
// Autocomplete
// MIT-style license. Copyright 2012 Matt V. Murphy
//
////////////////////////////////////
(function(window, document, undefined) {
	"use strict";
	
	var AutocompleteProto;
	var Autocomplete = function(element, options) {
		if ((this.element = (typeof(element) === "string") ? $(element) : element)) {
			if ((this.element.tagName || "").toLowerCase() === "input") {
				this.boundCheckValue = bind(this.checkValue, this);
				this.cache = {};
				this.container = null;
				this.delayTimer = null;
				this.elementHasFocus = false;
				this.highlightIdx = -1;
				this.lastValue = "";
				this.lastOnInputValue = null;
				this.shownValues = [];
				this.throttle = -1;
				this.usesTouch = (window.ontouchstart !== undefined);
				this.values = [];
				this.setOptions(options);
				this.init();
			}
		}
	};
	
	//////////////////////////////////////////////////////////////////////////////////
	(AutocompleteProto = Autocomplete.prototype).nothing = function(){};
	
	//////////////////////////////////////////////////////////////////////////////////
	AutocompleteProto.setOptions = function(options) {
		var hasOwnProp = Object.prototype.hasOwnProperty, 
		    option;
		
		this.options = {
			useNativeInterface : true, 
			offsetTop : 0, 
			offsetLeft : 0, 
			maxChoices : 6, 
			highlightColor : "#ffffff", 
			highlightBgColor : "#3399ff", 
			srcType : "", // "array", "dom", "xml"
			srcData : "", 
			onInput : this.nothing, 
			onInputDelay : 0
		};
		
		if (options) {
			for (option in this.options) {
				if (hasOwnProp.call(this.options, option) && options[option] !== undefined) {
					this.options[option] = options[option];
				}
			}
		}
	};
	
	//////////////////////////////////////////////////////////////////////////////////
	AutocompleteProto.init = function() {
		var srcType = this.options.srcType, 
		    datalist, datalistId, boundSetElementFocus;
		
		// Get values:
		this.values = (srcType === "array") ? (this.options.srcData || []).concat() : 
		              (srcType === "dom") ? this.getDomValues() : 
		              (srcType === "xml") ? this.getXmlValues() : [];
		
		// Get datalist element, set it's innerHTML if source type not "dom":
		if (datalistSupported && this.options.useNativeInterface) {
			if (this.options.onInput !== this.nothing) {
				addEvent(this.element, "input", this.boundCheckValue);
			}
			return this.setDatalist();
		}
		
		// Remove any attached datalist element if not using native interface:
		if (datalistSupported && (datalistId = this.element.getAttribute("list"))) {
			if ((datalist = $(datalistId))) {
				datalist.parentNode.removeChild(datalist);
			}
			this.element.removeAttribute("list");
		}
		
		// Attach behaviors:
		boundSetElementFocus = bind(this.setElementFocus, this);
		addEvent(this.element, "focus", boundSetElementFocus);
		addEvent(this.element, "blur", boundSetElementFocus);
		if (document.activeElement === this.element) {
			boundSetElementFocus({ type : "focus" });
		}
	};
	
	//////////////////////////////////////////////////////////////////////////////////
	AutocompleteProto.getDomValues = function() {
		var datalistId = this.element.getAttribute("list"), 
		    container = (datalistId) ? ($(datalistId) || {}).parentNode : null, 
		    options = (container) ? container.getElementsByTagName("option") : [], 
		    option, i, v, 
		    values = [];
		
		for (i=0, v=0; option=options[i]; i++) {
			if ((option = option.value) !== undefined) {
				values[v++] = option;
			}
		}
		return values;
	};
	
	//////////////////////////////////////////////////////////////////////////////////
	AutocompleteProto.getXmlValues = function() {
		var xml = parseXML(this.options.srcData), 
		    nodes, node, n, value, v, 
		    values = [];
		
		if ((nodes = (xml.getElementsByTagName("datalist")[0] || {}).childNodes)) {
			for (n=0, v=0; node=nodes[n]; n++) {
				if (node.nodeName === "option" && (value = node.getAttribute("value")) !== null) {
					values[v++] = value;
				}
			}
		}
		
		return values;
	};
	
	//////////////////////////////////////////////////////////////////////////////////
	AutocompleteProto.setDatalist = function() {
		var datalistId = this.element.getAttribute("list"), 
		    container = (this.container = (datalistId && $(datalistId)));
		
		// Generate datalist or set options HTML if source type not "dom":
		if (!container) {
			container = (this.container = document.createElement("datalist"));
			container.id = "list" + Math.ceil(Math.random() * 50000);
			container.innerHTML = this.generateDatalistOptionsHtml();
			this.element.parentNode.appendChild(container);
			this.element.setAttribute("list", container.id);
		} else if (this.options.srcType !== "dom") {
			container.innerHTML = this.generateDatalistOptionsHtml();
		}
	};
	
	//////////////////////////////////////////////////////////////////////////////////
	AutocompleteProto.generateDatalistOptionsHtml = function() {
		if (this.values.length) {
			return "<option value=\"" + this.values.join("\"><option value=\"") + "\">";
		}
		return "";
	};
	
	//////////////////////////////////////////////////////////////////////////////////
	AutocompleteProto.setElementFocus = function(event) {
		var isFocusEvent = (((event || window.event).type || "").toLowerCase() === "focus");
		
		if ((this.elementHasFocus = isFocusEvent)) {
			if (!this.container) {
				this.lastValue = this.element.value;
				this.generateContainer();
				this.addInputListeners(event);
			}
		} else if (this.shownValues.length) {
			this.clearValues();
		}
	};
	
	//////////////////////////////////////////////////////////////////////////////////
	AutocompleteProto.generateContainer = function() {
		var wrapper = document.createElement("div"), 
		    container = (this.container = document.createElement("div")), 
		    cStyle, eStyle, wDisplay;
		
		// Get element display style and use it for the wrapper display:
		if ((eStyle = window.getComputedStyle) && (eStyle = eStyle(this.element, null))) {
			wDisplay = eStyle.getPropertyValue("display");
		} else if ((eStyle = this.element.currentStyle)) {
			wDisplay = eStyle["display"];
		}
		
		// Initialize container:
		container.className = "aCon";
		if (!this.usesTouch) {
			addEvent(container, "mousemove", bind(this.highlightValue, this));
			if (msie === undefined || msie >= 9) {
				addEvent(container, "mousedown", stopEvent);
				addEvent(container, "mouseup", bind(this.selectValue, this));
			} else {
				addEvent(container, "mousedown", bind(this.selectValue, this));
			}
		} else {
			addEvent(container, "touchstart", bind(this.highlightValue, this));
			addEvent(container, "touchend", bind(this.selectValue, this));
		}
		(cStyle = container.style).minWidth = this.element.offsetWidth + "px";
		cStyle.marginLeft = this.options.offsetLeft + "px";
		cStyle.marginTop = (this.element.offsetHeight + this.options.offsetTop) + "px";
		
		// Initialize wrapper and insert into DOM:
		wrapper.className = "aWrapper";
		wrapper.style.display = wDisplay || "block";
		wrapper.appendChild(container);
		this.element.parentNode.insertBefore(wrapper, this.element);
	};
	
	//////////////////////////////////////////////////////////////////////////////////
	AutocompleteProto.addInputListeners = function(event) {
		var boundToggleSelectionChangeEvent;
		
		// Monitor the text field value as it changes:
		if (msie === undefined || msie >= 9) {
			addEvent(this.element, "input", this.boundCheckValue);
			if (msie === 9) {
				boundToggleSelectionChangeEvent = bind(this.toggleSelectionChangeEvent, this);
				addEvent(this.element, "focus", boundToggleSelectionChangeEvent);
				addEvent(this.element, "blur", boundToggleSelectionChangeEvent);
				boundToggleSelectionChangeEvent(event);
			}
		} else {
			addEvent(this.element, "propertychange", bind(this.checkForValuePropertyChange, this));
		}
		
		// Check for arrow navigation and enter/tab key:
		addEvent(this.element, "keydown", bind(this.performKeyAction, this));
	};
	
	//////////////////////////////////////////////////////////////////////////////////
	AutocompleteProto.toggleSelectionChangeEvent = function(event) {
		// Used by MSIE 9 to fill missing parts of oninput event implementation:
		if (event.type === "focus") {
			addEvent(document, "selectionchange", this.boundCheckValue);
		} else {
			removeEvent(document, "selectionchange", this.boundCheckValue);
		}
	};
	
	//////////////////////////////////////////////////////////////////////////////////
	AutocompleteProto.checkForValuePropertyChange = function() {
		// Used by MSIE < 9 to simulate oninput event:
		if (this.elementHasFocus && window.event.propertyName === "value") {
			this.checkValue(window.event);
		}
	};
	
	//////////////////////////////////////////////////////////////////////////////////
	AutocompleteProto.checkValue = function(event) {
		var newValue = this.element.value, 
		    lastValue = this.lastValue, 
		    delay;
		
		if (newValue !== lastValue) {
			this.matchValue(newValue);
			
			// Trigger onInput instantly or set a timer:
			if ((delay = this.options.onInputDelay) > 0) {
				if (this.lastOnInputValue === null) {
					this.lastOnInputValue = lastValue;
				}
				this.delayTimer = (this.delayTimer) ? window.clearTimeout(this.delayTimer) : null;
				this.delayTimer = window.setTimeout(bind(function() {
					this.options.onInput.apply(this, [newValue, this.lastOnInputValue]);
					this.lastOnInputValue = null;
				}, this), delay);
			} else {
				this.options.onInput.apply(this, [newValue, lastValue]);
			}
			this.lastValue = newValue;
		}
	};
	
	//////////////////////////////////////////////////////////////////////////////////
	AutocompleteProto.matchValue = function(val) {
		var escapeRgx, matchResult, matchRgx, matchText, maxChoices, results, 
		    matches = [], m = 0;
		
		if (!datalistSupported || !this.options.useNativeInterface) {
			if (val && !(results = this.cache["r-" + val])) {
				// Find all matching values:
				escapeRgx = this.cache.escapeRgx || (this.cache.escapeRgx = /([-.*+?^${}()|[\]\/\\])/g);
				matchRgx = new RegExp("^(" + val.replace(escapeRgx, "\\$1") + ".*)$", "igm");
				matchText = this.cache.values || (this.cache.values = this.values.sort().join("\n"));
				maxChoices = this.options.maxChoices;
				
				while ((matchResult = (matchRgx.exec(matchText) || [])[0])) {
					if (val !== matchResult) {
						matches[m++] = matchResult;
						if (m === maxChoices) { break; }
					}
				}
				results = (this.cache["r-" + val] = matches);
			}
			if (results && results.length) {
				this.showValues(results);
			} else {
				this.clearValues();
			}
		}
	};
	
	//////////////////////////////////////////////////////////////////////////////////
	AutocompleteProto.performKeyAction = function(event) {
		var which = (event = event || window.event).which || event.keyCode, 
		    actionable = { 9 : 1, 13 : 1, 27 : 1, 38 : 1, 40 : 1 }, 
		    container, shownValuesLen;
		
		if (actionable[which]) {
			// TAB or ENTER key:
			if (which === 9 || which === 13) {
				if (this.highlightIdx > -1) {
					this.selectValue(event);
				} else if (which === 13 && window.opera) {
					window.setTimeout(bind(this.clearValues, this), 0); // Opera bug workaround
				} else {
					this.clearValues();
				}
				
			// ESC key:
			} else if (which === 27) {
				this.clearValues();
				
			// DOWN or UP key:
			} else {
				if ((shownValuesLen = this.shownValues.length)) {
					if ((which === 38 && this.highlightIdx === 0) || 
					    (which === 40 && this.highlightIdx === shownValuesLen - 1)) {
						this.setHighlightedIndex(-1);
					} else if (which === 38 && this.highlightIdx === -1) {
						this.setHighlightedIndex(shownValuesLen - 1);
					} else {
						this.setHighlightedIndex(this.highlightIdx + ((which === 38) ? -1 : 1));
					}
				} else {
					this.checkValue(event);
				}
			}
		}
	};
	
	//////////////////////////////////////////////////////////////////////////////////
	AutocompleteProto.showValues = function(values) {
		var html = [], h = 0, 
		    rRgx = /</g, 
		    rStr = "&lt;", 
		    len, i;
		
		// Generate choices list:
		html[h++] = "<ul class='aList'>";
		for (i=0, len=values.length; i<len; i++) {
			html[h++] = "<li data-idx='" + i + "' class='aLim'>" + values[i].replace(rRgx, rStr) + "</li>";
		}
		html[h++] = "</ul>";
		
		// Display and store list:
		this.highlightIdx = -1;
		this.shownValues = values.concat();
		this.container.innerHTML = html.join("");
	};
	
	//////////////////////////////////////////////////////////////////////////////////
	AutocompleteProto.highlightValue = function(event) {
		var target, targetClass, targetStyle, highlightIdx;
		
		if (this.usesTouch || (this.throttle++) & 1) {
			target = (event = event || window.event).target || event.srcElement;
			targetClass = target.className || "";
			
			while (targetClass.indexOf("aLim") === -1 && targetClass !== "aCon") {
				targetClass = (target = target.parentNode).className || "";
			}
			if (targetClass.indexOf("aLim") > -1) {
				if ((highlightIdx = parseInt(target.getAttribute("data-idx") || -1, 10)) > -1) {
					this.setHighlightedIndex(highlightIdx);
				}
			}
		}
	};
	
	//////////////////////////////////////////////////////////////////////////////////
	AutocompleteProto.setHighlightedIndex = function(highlightIdx) {
		var choices, choiceStyle;
		
		if ((highlightIdx = Math.max(-1, highlightIdx)) !== this.highlightIdx) {
			if (highlightIdx < this.shownValues.length) {
				if (highlightIdx > -1 || this.highlightIdx > -1) {
					choices = this.container.firstChild.children;
				}
				
				// Highlight new choice:
				if (highlightIdx > -1) {
					(choiceStyle = choices[highlightIdx].style).color = this.options.highlightColor;
					choiceStyle.backgroundColor = this.options.highlightBgColor;
				}
				
				// Remove prior choice highlighting:
				if (this.highlightIdx > -1) {
					(choiceStyle = choices[this.highlightIdx].style).color = "";
					choiceStyle.backgroundColor = "";
				}
				
				// Save:
				this.highlightIdx = highlightIdx;
			}
		}
	};
	
	//////////////////////////////////////////////////////////////////////////////////
	AutocompleteProto.selectValue = function(event) {
		var eventType = (event = event || window.event).type.toLowerCase(), 
		    returnFocus = eventType !== "keydown" || (event.which || event.keyCode) !== 9, 
		    target, highlightIdx;
		
		// If mouse or touch event, check if clicking on a value that's not currently selected:
		if (eventType.indexOf("mouse") > -1 || eventType.indexOf("touch") > -1) {
			if (((target = event.target || event.srcElement).className || "").indexOf("aLim") > -1) {
				if ((highlightIdx = parseInt(target.getAttribute("data-idx") || -1, 10)) > -1) {
					this.highlightIdx = highlightIdx;
				}
			}
		}
		
		// Select value:
		if (this.highlightIdx > -1) {
			this.element.value = this.shownValues[this.highlightIdx];
			this.clearValues();
		}
		if (returnFocus) {
			this.element.focus();
			return stopEvent(event);
		}
	};
	
	//////////////////////////////////////////////////////////////////////////////////
	AutocompleteProto.clearValues = function() {
		this.highlightIdx = -1;
		this.lastValue = "";
		this.shownValues = [];
		this.container.innerHTML = "";
	};
	
	//////////////////////////////////////////////////////////////////////////////////
	AutocompleteProto.addValues = function(values) {
		var currentValues, cLen, c;
		
		if (values && values.length) {
			cLen = c = (currentValues = this.values).length;
			for (var i=0, value; (value=values[i]) !== undefined; i++) {
				if (value && indexOf(currentValues, value) === -1) {
					currentValues[c++] = value;
				}
			}
			
			if (c > cLen) {
				this.refresh();
			}
		}
	};
	
	//////////////////////////////////////////////////////////////////////////////////
	AutocompleteProto.removeValues = function(values) {
		var currentValues, cLen, c, idx;
		
		if (values && values.length) {
			cLen = c = (currentValues = this.values).length;
			for (var i=0, value; (value=values[i]) !== undefined; i++) {
				if (value && (idx = indexOf(currentValues, value)) > -1) {
					currentValues.splice(idx, 1);
				}
			}
			
			if (currentValues.length < cLen) {
				this.refresh();
			}
		}
	};
	
	//////////////////////////////////////////////////////////////////////////////////
	AutocompleteProto.refresh = function() {
		this.cache = {};
		
		if (datalistSupported && this.options.useNativeInterface) {
			this.container.innerHTML = this.generateDatalistOptionsHtml();
		} else if (this.highlightIdx === -1) {
			this.matchValue(this.lastValue);
		}
	};
	
	//////////////////////////////////
	//
	// Utility Methods
	//
	//////////////////////////////////////////////////////////////////////////////////
	var getIEVersion = function() {
		var nav, version;
		
		if ((nav = navigator).appName === "Microsoft Internet Explorer") {
			if (new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})").exec(nav.userAgent)) {
				version = parseFloat(RegExp.$1);
			}
		}
		return (version > 5) ? version : undefined;
	};
	
	//////////////////////////////////////////////////////////////////////////////////
	var parseXML = function(source) {
		var sourceType, dE, xml;
		
		if ((sourceType = typeof(source)) === "string") {
			if (window.DOMParser) {
				xml = new DOMParser().parseFromString(source, "text/xml");
			} else if (window.ActiveXObject) {
				xml = new ActiveXObject("Microsoft.XMLDOM");
				xml.async = false;
				xml.loadXML(source);
			}
		} else if (sourceType === "object") {
			dE = (source.ownerDocument || source).documentElement || {};
			if (dE.nodeName && dE.nodeName.toUpperCase() !== "HTML") {
				xml = source;
			}
		}
		
		return xml || null;
	};
	
	//////////////////////////////////////////////////////////////////////////////////
	var addEvent = (document.addEventListener) ? 
	  function(elem, type, listener) { elem.addEventListener(type, listener, false); } : 
	  function(elem, type, listener) { elem.attachEvent("on" + type, listener); };
	
	//////////////////////////////////////////////////////////////////////////////////
	var stopEvent = function(event) {
		if (event.stopPropagation) {
			event.stopPropagation();
			event.preventDefault();
		} else {
			event.returnValue = false;
			event.cancelBubble = true;
		}
		return false;
	};
	
	//////////////////////////////////////////////////////////////////////////////////
	var removeEvent = (document.addEventListener) ? 
	  function(elem, type, listener) { elem.removeEventListener(type, listener, false); } : 
	  function(elem, type, listener) { elem.detachEvent("on" + type, listener); };
	
	//////////////////////////////////////////////////////////////////////////////////
	var bind = function(func, that) {
		var a = slice.call(arguments, 2);
		return function() { return func.apply(that, a.concat(slice.call(arguments))); };
	};
	
	//////////////////////////////////////////////////////////////////////////////////
	var indexOf = ([].indexOf) ? 
	  function(arr, item) { return arr.indexOf(item); } : 
	  function(arr, item) {
	  	for (var i=0, len=arr.length; i<len; i++) { if (arr[i] === item) { return i; } } return -1;
	  };
	
	//////////////////////////////////////////////////////////////////////////////////
	var $ = function(elemId) { return document.getElementById(elemId); }, 
	    datalistSupported = !!(("list" in document.createElement("input")) && 
	                           document.createElement("datalist") && 
	                           window.HTMLDataListElement), 
	    slice = Array.prototype.slice, 
	    msie = getIEVersion();
	
	// Expose:
	window.Autocomplete = Autocomplete;
	
})(this, this.document);

