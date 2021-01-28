/*!
 * Kwic Kwoc Kwac - utility file util.js 
 * Version 1.0 - 01/05/2020
 * Ideation and first prototype: Fabio Vitali, ©2020
 * Author: Fabio Vitali, May 2020
 * All rights reserved. This software is NOT open source at the moment. Permission to use and modify this 
   file is granted to individuals requesting it explicitly to the author. This may change in the future.
   
   Rules to edit this file: 
   * Change and modify and reshuffle and refactor and throw away as you see fit. 
   * Never remove this comment
   * Never change the line "Ideation and first prototype"
   * If you fixed some bugs or did some minor refactoring, ADD a new line "Contributor" with your name and date. 
   * If you did some major reshuffling or refactoring, ADD your name to the authors' list. 
   * Switching to ES2015 is NOT major refactoring.
   * If my code has basically disappeared, remove my name from the authors' list. 
   * Do NOT inform me of this. 
 */

		// utility with same functionality of JQuery. Not completed. Not used. Here for future switch
		var $$ = new (function() {
			var remove = function(node) {
				return node.parentElement.removeChild(node)
			}
			var newElementFrom = function(s, c) {
				var ret = []
				var pdxElementForge;
				if (!c) {
					pdxElementForge = document.createElement("div");
					pdxElementForge.classList.add("pdxElementForge");
				} else {
					pdxElementForge = c
				}
				pdxElementForge.innerHTML = s;
				while (pdxElementForge.children.length) {
					ret.push(remove(pdxElementForge.children[0]))		
				}
				return ret; 
			}

			var selector = function(sel,context) {
				if (sel.trim().substr(0,1)=='<') {
					return newElementFrom(sel,context)
				}
				if (context) {
					return Array.from(context.querySelectorAll(sel))
				}
				return Array.from(document.querySelectorAll(sel))
				}

			selector.remove = remove
			return selector; 
		})()
		var $$1 = function(sel,context) {
			return $$(sel,context)[0]
		}

		// this function extends Node to return the full list of text nodes contained 
		// inside the node at any level of depth.Parameter position allows to assign an 
		// index to it so that you can immediately see its neighbors without looping 
		// through the array
		Node.prototype.allTextNodes = function(position) {
		  if (!position) position = 0
		  var tn = []; 
		  for (var i=0; i<this.childNodes.length;i++) {
			var n = this.childNodes[i] ;
			if (n.nodeType == Node.TEXT_NODE) {
			  n.position = position++
			  tn.push(n)
			} else {
			  var x = n.allTextNodes(position)
			  tn = tn.concat(x)
			  position += x.length
			}
		  }
		  return tn ;
		}

		// this function extends Range to return the full list of text nodes contained 
		// inside the node at any level of depth.
		Range.prototype.allTextNodes = function() {
		  var a = this.commonAncestorContainer ;
		  var tn = a.allTextNodes(); 
		  while (tn[0] && tn[0] !== this.startContainer) tn.shift() ;
		  while (tn[tn.length-1] && tn[tn.length-1] !== this.endContainer) tn.pop() ;
		  return tn ;
		}

		// returns an array of the positions of all matches of a regular expression
		// inside an input
		function allMatches(r, input) {					
			var re = new RegExp(r, 'g')						
			var ret = []
			
			var i = re.exec(input)
			while (i) {
				console.log(i);
				ret.push(i.index)
				i = re.exec(input)
			}
			return ret
		}
		
		// boolean function exclusive or (XOR)
		function xor(a,b) {
		  return ( a ? 1 : 0 ) ^ ( b ? 1 : 0 );
		}

		// the poor man's interpolation function for templates. ©FV
		String.prototype.tpl = function(o, removeAll) { 
			var r = this ; 
			for (var i in o) { 
				r = r.replace(new RegExp("\\{\\$"+i+"\\}", 'g'),o[i]) 
			} 
			if (removeAll) {
				r = r.replace(new RegExp("\\{\\$[^\}]+\\}", 'g'),"") 
			}
			return r 
		}

		// String accent vocal translate
		String.prototype.removeAccent = function(special) {
			let translate_re = /([^a-zA-Z0-9]+)/g; //get all special character
			let translate = {
			  a: ['à','á','À','Á'],
			  e: ['è','é','È','É'],
			  i: ['ì','í','Ì','Í'],
			  o: ['ò','ó','Ò','Ó'],
			  u: ['ù','ú','Ù','Ú']
			};		
			let s = this;
			
			return s.replace(translate_re, function(match) { 
				let replace = '';

				for(v in translate){	
					for(a of translate[v]){
						for(c of match){
							if(a === c) replace += v; //if accent vocal, replace with just vocal variable
							else replace += special ? '' : c	//else keep the character
						}						
					}
				}

				return replace //return changed string
				});			
		  };


		// creates a CSS stylesheet with custom rules.  
		async function setStylesheet(css, id, asExternalFile, onload) {
			if (!id) var id = "pdxDefaultCSS" ;
			var style = $$("#"+id)[0]
			var args=  {
				css: css,
				id: id
			}
			if (!style) {
				if (asExternalFile) {
					style = $$("<link rel='stylesheet' id='{$id}' href='{$css}'>".tpl(args))[0]
				} else {
					style = $$("<style id='{$id}' type='text/css'>{$css}</style>".tpl(args))[0]			
				}
				if (onload)	{
					//  https://stackoverflow.com/questions/10537039/how-to-determine-if-css-has-been-loaded			
					var fi = setInterval(function() {
						try {
							style.sheet.cssRules; // <--- MAGIC: only populated when file is loaded
							onload();
							clearInterval(fi);
						} catch (e){}
					}, 10);  
				}
				document.head.appendChild(style)
			} else { 
				style.innerHTML = css; 
			}
			return style.sheet; 
		}

		// JQuery extension. Checks whether the two passed parameters are before, after
		// or contained inside each other. 
		$.fn.docPosition = function(element) {
			// https://stackoverflow.com/questions/8902270/is-element-before-or-after-another-element-in-dom
			function comparePosition(a, b) {
				return a.compareDocumentPosition ? 
				  a.compareDocumentPosition(b) : 
				  a.contains ? 
					(a != b && a.contains(b) && 16) + 
					  (a != b && b.contains(a) && 8) + 
					  (a.sourceIndex >= 0 && b.sourceIndex >= 0 ?
						(a.sourceIndex < b.sourceIndex && 4) + 
						  (a.sourceIndex > b.sourceIndex && 2) :
						1)
					+ 0 : 0;
			}

			if (element.jquery) element = element[0];

			var position = comparePosition(this[0], element);
			if (position & Node.DOCUMENT_POSITION_CONTAINED_BY) return 'contained';
			if (position & Node.DOCUMENT_POSITION_CONTAINS) return 'contains';
			if (position & Node.DOCUMENT_POSITION_FOLLOWING) return 'after';
			if (position & Node.DOCUMENT_POSITION_PRECEDING) return 'before';
			return "unrelated"
		};
		// jquery extension utility to see if the element is before the other using docPosition(). 
		$.fn.isBefore = function(element) {
			return ['before', 'contains'].indexOf( this.docPosition(element)) !== -1
		};

		//Get file ID
		function splitFilename(currentFilename, value = ""){
			if(currentFilename === "") return currentFilename;

			let split = [];
			
			let file = currentFilename;
			split = file.split('_');
			
			let user = split[0];
			let section = split[1].replace(/[^0-9]+/g, "");
			let volume = split[2].replace(/[^0-9]+/g, "");
			let tome = split[3].replace(/[^0-9]+/g, "");
			let work = split[4];
			let status = split[5];
			let objId = split[6];

			switch(value) {
				case "user":
					return user;
				case "section":
					return section;
				case "volume":
					return volume;
				case "tome":
					return tome;
				case "work":
					return work;
				case "status":
					return status;
				case "objId":
					return objId;
				default:
					return split;
			}

		}

		function isEmptyObject(obj){
			return JSON.stringify(obj) === '{}';
		}
		

