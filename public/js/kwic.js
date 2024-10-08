﻿/*!
 * Kwic Kwoc Kwac - main kwic.js 
  * Version 1.9 - 18/09/2024
 * Ideation and first prototype: Fabio Vitali, ©2020
 * Authors: Fabio Vitali, Francesco Paolucci, Sebastian Barzaghi September 2024
 * License: https://github.com/sanofrank/KwicKwocKwac/blob/master/LICENSE.md (MIT)
  
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

/* ------------------------------------------------------------------------------ */
/*                                                                                */
/*                                MAIN CLASS                                      */
/*                                                                                */
/* ------------------------------------------------------------------------------ */
var kwic = new (function () {
	var lastId = -1;                  // last specified id for new mentions
	var lastQuoteId = -1;
	var lastBibId = -1; //to regenerate exp and bibref
	var modifyOlderDocuments = false;

	const uri = '#'

	const ont = {
		id: 'moro',
		label: 'rdfs:label',
		sort: 'moro:altLabel',
		wikidataId: 'dcterms:relation',
		treccaniId: 'wdt:P1986'
		}
	
	const rdfaBib = {
		exp: 'fabio:Expression',
		label: 'dcterms:bibliographicCitation',
		typeof: 'moro:BibliographicReference',
		property: 'biro:references'
	}

	const rdfaQuote = {
		typeof: 'moro:Quotation',
		property: 'dcterms:relation'
	}
	
	// generates the id for a mention
	function getNewId(prefix) {
		return prefix + (lastId++)
	}

	//Quote Id
	function getNewQuoteId(prefix) {
		return prefix + (lastQuoteId++)
	}

	//BibRef Id
	function getNewBibId(prefix){
		return prefix + (lastBibId++)
	}
	
	// if mentions are already present in this file, find the largest one and set lastId to that+1
	function getLargestId(selection) {
		// https://stackoverflow.com/questions/15371102/get-highest-id-using-javascript
		return selection.reduce( (a, b) => {
			return Math.max(a, (b.id.match(/\w+\-(\d+)/)||[,a])[1]) // /w:word +:more word \-:"-" ():group \d:digits 
		}, -1);
	}

	// If start and end anchors of a range are compatible the mention can be created. 
	// If one or both of them belong to an existing mention, no worries since the existing mention will be removed anyway. 
	function compatibleExtremes(range, mention) {
		if (range.startContainer.parentElement == range.endContainer.parentElement){
			//ADDED TO PREVENT OVERWRITE OF MENTIONS CONTAINING OTHERS 
			if((range.startContainer.parentElement.classList.contains('mention') && range.endContainer.parentElement.classList.contains('mention')) 
				&& !(range.startContainer.parentElement.classList.contains('trash') || range.endContainer.parentElement.classList.contains('trash'))
				&& !(range.startContainer.parentElement.classList.contains('scraps') || range.endContainer.parentElement.classList.contains('scraps'))){
				return false
			}
				
			return true //Meaning that if the selection is plain, untouched and it's in the same node.
		} 
		const formatters = ['B','STRONG','I','EM','MARK','SMALL','DEL','INS']

		var start = range.startContainer.parentElement
		var end = range.endContainer.parentElement

		if (start.classList.contains('mention'))
			start = start.parentElement // will remove it anyway
		if (end.classList.contains('mention'))
			end = end.parentElement // will remove it anyway
		// if (mention && (start.classList.contains('mention')))
		// 	start = start.parentElement // will remove it anyway
		// if (mention && (end.classList.contains('mention')))
		// 	end = end.parentElement // will remove it anyway
		if (start.classList.contains('quote-text'))
			start = start.parentElement.parentElement // will remove it anyway
		if (end.classList.contains('quote-text'))
			end = end.parentElement.parentElement // will remove it anyway
		if (start.classList.contains('bibref'))
			start = start.parentElement // will remove it anyway
		if (end.classList.contains('bibref'))
			end = end.parentElement // will remove it anyway
		//Check if formatter extreme
		if(!mention){
			let start_tag = start.tagName;
			let end_tag = end.tagName;
			if(formatters.find(el => el == start_tag))
				start = start.parentElement;
			if(formatters.find(el => el == end_tag))
				end = end.parentElement;
		}
		return  start == end
	}

	function compatibleExtremesRef(range, supNode){
		if(supNode){
			let start = range.startContainer.parentElement;
			let end = supNode.parentElement.parentElement;

			if (start.classList.contains('mention') || start.classList.contains('quote'))
				start = start.parentElement // will remove it anyway
			if (end.classList.contains('mention') || end.classList.contains('quote'))
				end = end.parentElement // will remove it anyway
			if (start.classList.contains('quote-text'))
				start = start.parentElement.parentElement
			if (end.classList.contains('quote-text'))
				end = end.parentElement.parentElement

			return start == end;
		}else{
			return compatibleExtremes(range,false);
		}
	}

	// remove the tag wrapping a mention
	function unwrap(node) {
		var p = node.parentElement
		while (node.childNodes.length>0) {
			p.insertBefore(node.childNodes[0],node)		
		}
		p.removeChild(node)
	}

	//ADDED BIB BOOLEAN TO VERIFY BIBREF NODES
	// insert a range within an element. Make sure to remove the overlapping mentions if they exist. 
	function wrap(range, node, mention, removeOverlaps) {
		// save range extremes here, since unwrapping elements will affect them later
		var r = {
			sc: range.startContainer, 
			so: range.startOffset, 
			ec: range.endContainer, 
			eo: range.endOffset
		}
		if (range.startContainer.parentElement.classList.contains('mention') && mention){
			unwrap(range.startContainer.parentElement)
		} 			
		if (range.endContainer.parentElement.classList.contains('mention') && mention) 
			unwrap(range.endContainer.parentElement)
		// if (range.startContainer.parentElement.classList.contains('block') && !mention) 
		// 	unwrap(range.startContainer.parentElement)
		// if (range.endContainer.parentElement.classList.contains('block') && !mention) 
		// 	unwrap(range.endContainer.parentElement)
		// //In case there's a mention on the end or start of range with a block element.	
		// if (range.endContainer.parentElement.classList.contains('mention') && !mention){ 
		// 	var endNode = range.endContainer.parentNode;

		// 	range.setStart(r.sc,r.so);
		// 	range.setEndAfter(endNode);
		// }	
		// if (range.startContainer.parentElement.classList.contains('mention') && !mention){
		// 	var startNode = range.startContainer.parentNode;

		// 	range.setStartBefore(startNode);
		// 	if(!endNode){
		// 		range.setEnd(r.ec,r.eo);
		// 	}
		// }	
					
		//if(!endNode && !startNode){
		range.setStart(r.sc, r.so)
		range.setEnd(r.ec, r.eo)
		//}
		range.surroundContents(node); //moves content of the range into a new node, placing the new node at the start of the specified range
		node.parentElement.normalize() //puts the specified node and all of its sub-tree into a "normalized" form
		if (node.parentElement.classList.contains('mention') && mention) unwrap(node)
		if (node.parentElement.classList.contains('block') && !mention) unwrap(node)
		if(mention){
			var inner = node.querySelectorAll('.mention')
			for (var i=0; i<inner.length; i++) {
				unwrap(inner[i]) 
			}
		}else{
			var inner = node.querySelectorAll('.block')
			for (var i=0; i<inner.length; i++) {
				unwrap(inner[i]) 
			}
		}
		return node
	}

	function wrapBib(range,node){
		let documentFragment;

		//Range object information 
		var r = {
			sc: range.startContainer, 
			so: range.startOffset, 
			ec: range.endContainer, 
			eo: range.endOffset
		}
		
		//Unwrap any bibref tag or quote tag
		if (range.startContainer.parentElement.classList.contains('bibref') || range.startContainer.parentElement.classList.contains('quote-text') || range.startContainer.parentElement.classList.contains('mention')) 
			unwrap(range.startContainer.parentElement)
		if (range.endContainer.parentElement.classList.contains('bibref') || range.endContainer.parentElement.classList.contains('quote-text') || range.startContainer.parentElement.classList.contains('mention')) 
			unwrap(range.endContainer.parentElement)
		
		range.setStart(r.sc, r.so)
		range.setEnd(r.ec, r.eo)

		documentFragment = range.extractContents();
			
		node.appendChild(documentFragment);
		range.insertNode(node);
		node.parentElement.normalize() //puts the specified node and all of its sub-tree into a "normalized" form
		if (node.parentElement.classList.contains('bibref')) unwrap(node)

		var inner = node.querySelectorAll('.bibref')
		for (var i=0; i<inner.length; i++) {
			unwrap(inner[i]) 
			}
		return node
	}

	function wrapQuote(range,node,aNode){
		let documentFragment;
		let quote = document.createRange(); //quote-text range
		
		//Range object information 
		var r = {
			sc: range.startContainer, 
			so: range.startOffset, 
			ec: range.endContainer, 
			eo: range.endOffset
		}
		
		//Unwrap any quote tag
		if (range.startContainer.parentElement.classList.contains('quote')) 
			unwrap(range.startContainer.parentElement)
		if (range.endContainer.parentElement.classList.contains('quote')) 
			unwrap(range.endContainer.parentElement)
		if (range.startContainer.parentElement.classList.contains('mention')) 
			unwrap(range.startContainer.parentElement)
		if (range.endContainer.parentElement.classList.contains('mention')) 
			unwrap(range.endContainer.parentElement)
			
		//Unwrap quote-text two times deeper
		if (range.startContainer.parentElement.classList.contains('quote-text')){
			let parent = range.startContainer.parentElement;
			let grandParent = parent.parentElement;

			unwrap(parent);
			unwrap(grandParent);
		}
		if (range.endContainer.parentElement.classList.contains('quote-text')){
			let parent = range.endContainer.parentElement;
			let grandParent = parent.parentElement;

			unwrap(parent);
			unwrap(grandParent);
		}
		//Unwrap from supNode if not text node.
		if (aNode && range.startContainer.nodeType != 3 && range.startContainer.classList.contains('quote')){
			if(range.startContainer.firstChild.classList.contains('quote-text')){
				unwrap(range.startContainer.firstChild)
			}
			unwrap(range.startContainer);
		}
		if (aNode && range.endContainer.nodeType != 3 && range.endContainer.classList.contains('quote')){
			if(range.endContainer.firstChild.classList.contains('quote-text')){
				unwrap(range.endContainer.firstChild)
			}
			unwrap(range.endContainer);
		}
		
		//Set range end after A node if forward
		if(aNode){
			range.setEndAfter(aNode.parentNode);
		}else{
			range.setEnd(r.ec,r.eo);
		}
		//Set range start before A node if backward
		//TODO

		range.setStart(r.sc, r.so)

		documentFragment = range.extractContents();
			
		node.appendChild(documentFragment);
		range.insertNode(node);
		
		quoteText = document.createElement('span');

		//if there is a footnote create quote-text span
		if(aNode) {
			quote.setStartBefore(node.firstChild);
			quote.setEndBefore(aNode.parentNode);
			quote.surroundContents(quoteText);
		}else{
			quote.setStartBefore(node.firstChild);
			quote.setEndAfter(node.lastChild);
			quote.surroundContents(quoteText);
		}
		
		
		quoteText.classList.add('quote-text');

		node.parentElement.normalize() //puts the specified node and all of its sub-tree into a "normalized" form
		if (node.parentElement.classList.contains('quote')) unwrap(node)

		var inner = node.querySelectorAll('.quote')
		for (var i=0; i<inner.length; i++) {
			unwrap(inner[i]) 
		}
		var inner_text = node.querySelectorAll('.quote-text')
		for (var i=1; i<inner_text.length; i++) { //i=1 because the first quote-text element is always the new inner_text
			unwrap(inner_text[i]) 
		}

		return node
	}

	// if the selection is not composed of whole words, and the action requires whole words,
	// extend the selection to the whole words around it 
	function snapSelection(boundary, snap, alt) {
		// https://stackoverflow.com/questions/10964016/how-do-i-extend-selection-to-word-boundary-using-javascript-once-only		
		var sel;

		// Check for existence of window.getSelection() and that it has a
		// modify() method. IE 9 has both selection APIs but no modify() method.
		if (window.getSelection && (sel = window.getSelection()).modify) {
			sel = window.getSelection();
			if (xor(alt, boundary && snap)) { //true if different
				// Detect if selection is backwards
				var range = document.createRange();
				range.setStart(sel.anchorNode, sel.anchorOffset);
				range.setEnd(sel.focusNode, sel.focusOffset);
				var backwards = range.collapsed;
				range.detach();
				
				// modify() works on the focus of the selection
				var endNode = sel.focusNode, endOffset = sel.focusOffset;
				sel.collapse(sel.anchorNode, sel.anchorOffset);

				var direction = [];
				if (backwards) {
					direction = ['backward', 'forward'];
				} else {
					direction = ['forward', 'backward'];
				}

				sel.modify("move", direction[0], "character");
				sel.modify("move", direction[1], boundary);
				sel.extend(endNode, endOffset);
				sel.modify("extend", direction[1], "character");
				sel.modify("extend", direction[0], boundary);
			}
		} else if ( (sel = document.selection) && sel.type != "Control") { // IE below 9
			if (xor(alt, boundary && snap)) {
				var textRange = sel.createRange();
				if (textRange.text) {
					textRange.expand(boundary);
					// Move the end back to not include the word's trailing space(s),
					// if necessary
					while (/\s$/.test(textRange.text)) {
						textRange.moveEnd("character", -1);
					}
					textRange.select();
				}
			}
		}
		return sel.isCollapsed?null:sel; 
	}		

	// extend selection to apex if selected

	function snapSelectionRef(boundary, snap, alt){
		var sel;
		var range;
		var footnoteNode = null;

		var rangeObj = {
			sel,
			range,
			footnoteNode
		};

		if(window.getSelection && (sel = window.getSelection()).modify){

			sel = window.getSelection();
			range = document.createRange();
			range.setStart(sel.anchorNode, sel.anchorOffset);

			var endNode, endOffset, startNode, startOffset;

			if(sel.anchorNode.parentNode.tagName == "A") footnoteNode = sel.anchorNode.parentNode;
			if(sel.focusNode.parentNode.tagName == "A") footnoteNode = sel.focusNode.parentNode;

			if(sel.focusNode.parentNode.tagName == "A"){
				footnoteNode = sel.focusNode.parentNode;
				let parent = footnoteNode;

				while(parent.previousSibling == null){
					parent = parent.parentNode;
				}

				endNode = parent, endOffset = parent.length;
				range.setEndAfter(parent);
			}
			if(sel.anchorNode.parentNode.tagName == "A"){
				footnoteNode = sel.anchorNode.parentNode;
				//TO DO
			
			}

			if(!footnoteNode){
				endNode = sel.focusNode, endOffset = sel.focusOffset;
				range.setEnd(sel.focusNode,sel.focusOffset);
			}

			var backwards = range.collapsed;
			range.detach();

			if(xor(alt,boundary && snap)) {
				// Detect if selection is backwards
				// modify() works on the focus of the selection
				
				sel.collapse(sel.anchorNode, sel.anchorOffset);

				var direction = [];
				if (backwards) {
					direction = ['backward', 'forward'];
				} else {
					direction = ['forward', 'backward'];
				}

				if(footnoteNode){
					sel.modify("move", direction[0], "character");
					sel.modify("move", direction[1], boundary);
					sel.extend(endNode, endOffset);
					sel.modify("extend", direction[1], "character");
					sel.modify("extend", direction[0], boundary);
					range.setStart(sel.anchorNode,sel.anchorOffset);
				}else{
					sel.modify("move", direction[0], "character");
					sel.modify("move", direction[1], boundary);
					sel.extend(endNode, endOffset);
					sel.modify("extend", direction[1], "character");
					sel.modify("extend", direction[0], boundary);
				}
				
			}
		}else if ( (sel = document.selection) && sel.type != "Control") { // IE below 9
			if (xor(alt, boundary && snap)) {
				var textRange = sel.createRange();
				if (textRange.text) {
					textRange.expand(boundary);
					// Move the end back to not include the word's trailing space(s),
					// if necessary
					while (/\s$/.test(textRange.text)) {
						textRange.moveEnd("character", -1);
					}
					textRange.select();
				}
			}
		}

		rangeObj.sel = sel;
		rangeObj.range = range;
		rangeObj.footnoteNode = footnoteNode;

		return rangeObj;
	}

	//Find footnote reference on a quote selection
	function getFootnote(container){
		let footnote;
		let href = container.getAttribute("href");

		let footnoteNode = $(href);
		let footnoteID = href.replace(/^#/, ''); //get footnote number
		let footnoteText = footnoteNode.text().replace(/↑+/g,"").trim(); //get text by replacing arrow up symbol and removing start and end white space

		return footnote = {
			footnoteNode,
			footnoteID,
			footnoteText
		}

	}

	// search for a text and return the text node(s) containing the text (even across text nodes)
	function searchAll(context, sel, markWords) {
		var text = sel.toString()
		var ret = []
		var atn = context.allTextNodes()	
		var all = allMatches(text, context.textContent, markWords)
		//console.log(sel.getRangeAt(0))		

		var pos = 0; 
		var index  = 0
		for (var i=0; i<all.length; i++) {
			while (pos + atn[index].length <= all[i]) 
				pos += atn[index++].length
			var offset = all[i]-pos

			var end = all[i]+text.length
			var endIndex = index
			var endPos = pos
			while (endPos + atn[endIndex].length < end) 
				endPos += atn[endIndex++].length
			var endOffset = end-endPos

			var r = document.createRange();
			r.setStart(atn[index], offset);
			r.setEnd(atn[endIndex], endOffset);

			ret.push(r)
		}
		return ret
	}

	// this variable will contain directions to create and organize mentions according to categories. 
	this.categoryList = {}

	// this variable will contain directions to create and organize blocks according to references. 
	this.referenceList = {}

	// preferences for this kwic. 
	this.prefs = {
		loggedUser: 'none',
		wordsAround: 5,
		style: "KWIC",
		sort: 'alpha',	
		extend: true,
		markAll: true,
		markWords: false,
	}

	// list of editing operations performed. Currently not used. 
	this.editList = []

	// default HTML templates for the rendering of mentions, entities and categories, plus kwic/kwoc/wkac) 
	this.templates = {
		categories: `
			<div class="header">{$label}</div>
			<ul class="entities">
				{$content}
			</ul>
		`,
		entities: `
			<li>
				<div class="header">{$label}</div>
					<ul class="mentions">
					{$content}
				</ul>
			</li>
		`,
		mentions: `
			<li>{$content}</li>
		`,
		KWIC:  `<span class="before">{$before}</span>
				<span class="label">{$inner}</span>
				<span class="after">{$after}</span>
				`,
		KWAC:  `<span class="label">{$inner}</span>
				<span class="after">{$after}</span>
				<span class="before">{$before}</span>
				`,
		KWOC:  `<span class="label">{$inner}</span>
				<span class="whole">{$before} {$inner} {$after}</span>
				`,
		none: `<span class="label">{$inner}</span>
				`	
	}

	// categories are the main organization of types: persons, places, concepts, terms, etc.	
	this.Category = function(entities, options) {
		if (!options) options = {}         // fallback object for inizialization
		var entities = entities || []   // fallback object for inizialization
		var prefix = "category-" ;
		
		this.id = entities[0].category
		this.entities = entities
		this.label = options.label || kwic.categoryList[this.id].label
		this.type = options.type || kwic.categoryList[this.id].type
		this.mention = options.mentions || kwic.categoryList[this.id].mention;
		this.sort = options.sort || kwic.categoryList[this.id].sort
		
		this.sortFunctions ={
			'alpha': function(a,b) {
				var asort = a.sort || a.label || a.id
				var bsort = b.sort || b.label || b.id
				return asort.localeCompare(bsort)
			},
			'count': function(a,b) {
				return b.mentions.length - a.mentions.length
			},
			'position': function(a,b) {
				return a.position - b.position
			}
		}

				return this; 	
		
	}
	this.Category.prototype = {
		// add a new category
		append: function(entity, override=false) {
			if (override) {
				entity.category = this.id
			}
			this.entities.push(entity)
		
		},
		// sort categories
		sortEntities: function() {
			this.entities.sort(this.sortFunctions[kwic.prefs.sort]);
		}

		
	}

	// entities are the individuals of the content: each person, each place, each concept, etc. is an entity
	this.Entity = function(mentions, options) {
		if (!options) options = {}         // fallback object for inizialization
		var mentions = mentions || []   // fallback object for inizialization
		var prefix = "entity-" ;
		this.mentions = []

		var category = ""
		var label = ""
		var sort = ""
		var wikidataId = ""
		var treccaniId = ""
		var property = ""
		this.id = mentions[0].entity.match(/^#/) ? mentions[0].entity.replace(/^#/,'') : mentions[0].entity //remove first occurence of #
		this.position = Number.MAX_VALUE
		var inners = []

		for (var i=0; i<mentions.length; i++) {
			mentions[i].entity = this.id
			category = mentions[i].category || category
			label = mentions[i].label || label
			// sort = mentions[i].sort || sort
			// wikidataId = mentions[i].wikidataId || wikidataId
			// treccaniId = mentions[i].treccaniId || treccaniId
			property = mentions[i].property || property
			inners.push(mentions[i].inner)
			this.position = Math.min(this.position, mentions[i].position)
			this.mentions.push(mentions[i])
			}
	
		label = $(`meta[about="#${this.id}"][property='${ont.label}']`).length ? $(`meta[about="#${this.id}"][property='${ont.label}']`).attr('content') : label
		sort = $(`meta[about="#${this.id}"][property='${ont.sort}']`).length ? $(`meta[about="#${this.id}"][property='${ont.sort}']`).attr('content') : sort
		wikidataId = $(`meta[about="#${this.id}"][property='${ont.wikidataId}']`).length ? $(`meta[about="#${this.id}"][property='${ont.wikidataId}']`).attr('resource').replace(/http:\/\/www.wikidata.org\/entity\//g,'') : wikidataId
		treccaniId = $(`meta[about="#${this.id}"][property='${ont.treccaniId}']`).length ? $(`meta[about="#${this.id}"][property='${ont.treccaniId}']`).attr('content') : treccaniId

		// this.category = options.category || category || "scraps"
		// this.label = options.label || label
		// this.sort = options.sort || sort
		// this.wikidataId = options.wikidataId || wikidataId
		// this.treccaniId = options.treccaniId || treccaniId
		
		this.prop('id', options.category || category || "scraps", true)
		this.prop('sort', options.sort || sort, options.force)
		this.prop('wikidataId', options.wikidataId || wikidataId, options.force) //Wikidata
		this.prop('treccaniId', options.treccaniId || treccaniId, options.force) //Treccani
		
		this.category = options.category || category || "scraps"
		this.label = options.label || label
		// this.label = options.label || label
		this.sort = options.sort || sort			
		this.wikidataId = options.wikidataId || wikidataId //clean value wikidataId
		this.treccaniId = options.treccaniId || treccaniId
		this.property = options.property || property
		
		if (!this.label) {
			var inn = {}
			var max = 0
			var el = ''
			for (var i in inners) {
				if (!inn[inners[i]]) inn[inners[i]] = 0
				inn[inners[i]]++
				if (inn[inners[i]] > max) {
					el = inners[i]
					max = inn[inners[i]]
				}
			}
			this.change('label',el)
			this.label = el			
		}

		this.prop('label', options.label || this.label, options.force)
		
		return this; 	
	}
	this.Entity.prototype = {
		// adds a mention to this entity. If override, replace the info of the entity with the ones of the mention
		append: function(mention, override=false) {
			if (override) {
				mention.entity = this.id
				this.label = mention.label || this.label
				this.sort = mention.sort || this.sort
				this.wikidataId = mention.wikidataId || this.wikidataId
				this.treccaniId = mention.treccaniId || this.treccaniId
			}
			this.mentions.push(mention)
		},
		// place all mentions of a different entity into this one.
		mergeInto: function(target) {
			for (var i=0; i<this.mentions.length; i++) {				
				this.mentions[i].prop('entity',target.id, true)
				this.mentions[i].prop('sort','', true)
				this.mentions[i].prop('wikidataId','', true)
				this.mentions[i].prop('treccaniId','', true)
				this.mentions[i].prop('label','', true)
				target.mentions.push(this.mentions[i])
			}

			// // adding target entity
			// kwic.allEntities[target.id].prop('id',target.category,true)
			// //kwic.allEntities[target.id].prop('label',target.label,true)
			// kwic.allEntities[target.id].prop('sort','',true)
			// kwic.allEntities[target.id].prop('wikidata','',true)
			// kwic.allEntities[target.id].prop('treccaniId','',true)
			// kwic.allEntities[target.id].prop('label','',true)

			// cleaning source entity
			let all = false, force = true, names = ['id','label','sort','wikidataId','treccaniId']
			this.clearMeta(names,all,force)
			
			kwic.allEntities[this.id] = null
		},
		// // change a property of this entity by changing the corresponding property of the first mention 
		// change: function(field,value) {
		// 	var done = false			
		// 		for (var i=0; i<this.mentions.length; i++) {
		// 			if (this.mentions[i][field]) {
		// 				if(field == "label"){ // Reset wikidata and treccani if label changed
		// 					this.mentions[i].prop(field,value,true)
		// 					this.mentions[i].prop('wikidataId','',true)
		// 					this.mentions[i].prop('treccaniId','',true)
		// 					done = true
		// 				}else{
		// 					this.mentions[i].prop(field, value,true)
		// 					done = true
		// 				}
		// 			}
		// 		}			
		// 		if (!done) {
		// 			this.mentions[0].prop(field, value)}

		// },
		// change a property of this entity by changing the corresponding property of the first mention 
		change: function(field,value) {
			var done = false			
				for (var i=0; i<this.mentions.length; i++) {	

					if (this.mentions[i][field]) {
						if(field == "label"){ // Reset wikidata and treccani if label changed
							//entity prop
							this.prop(field,value,true)
							this.prop('wikidataId','',true)
							this.prop('treccaniId','',true)

							this.mentions[i].prop(field,value,true)
							this.mentions[i].prop('wikidataId','',true)
							this.mentions[i].prop('treccaniId','',true)
							done = true
						}else{
							this.prop(field,value,true)

							this.mentions[i].prop(field, value,true)
							done = true
						}
					}
				}			
				if (!done) {
					this.prop(field,value)

					this.mentions[0].prop(field, value)
				}

		},
		// append data on meta tag file head
		prop: function(name,value,force = false) {
			// modify older documents without the newer markup			
			let id = modifyOlderDocuments ? "#"+this.id : "#"+this.id.toLowerCase()
			let prop = ont[name] || ''; //Get property term

			let metaTpl_type = `<meta about="{$id}" typeof="{$prop}:{$value}">`
			let metaTpl_res = `<meta about="{$id}" property="{$prop}" resource="{$value}">`
			let metaTpl_prop = `<meta about="{$id}" property="{$prop}" content="{$value}">`


			switch (name) {
				case 'id':
					if(force || id == "#"){
						if(value!=''){
							value = value.charAt(0).toUpperCase() + value.slice(1) //first letter upper case

							let meta_type = metaTpl_type.tpl({id,prop,value})
							if($(`#mentionMeta meta[about='${id}'][typeof]`).length)
								$(`#mentionMeta meta[about='${id}'][typeof]`).attr('typeof',prop+':'+value)
							else{
								$('#file #mentionMeta').append(meta_type);												
							}
						}else{
							$(`#file #mentionMeta meta[about='${id}'][typeof]`).remove()
						}
					}
					break;
				case 'wikidataId':
					if(force || $(`#mentionMeta meta[about='${id}'][property='${prop}']`).length <= 0){						
						if(value) {
							let valueURI = 'http://www.wikidata.org/entity/'+value; //change prop adding wikidata URI
							let meta_res = metaTpl_res.tpl({id,prop,value:valueURI})

							if($(`#mentionMeta meta[about='${id}'][property='${prop}']`).length ){
								$(`#file #mentionMeta meta[about='${id}'][property='${prop}']`).attr('content',valueURI)	
							}else{							
								if($(`#mentionMeta meta[about='${id}']`).length){
									$(`#mentionMeta meta[about='${id}']`).last().after(meta_res); //append on the last element refered to resource
								}																								 	
								else{
									$('#file #mentionMeta').append(meta_res);
								}									
							}
							this[name] = value
						}else{
							$(`#file #mentionMeta meta[about='${id}'][property='${prop}']`).remove()
							//delete this[name]
						}
					}
					break;
				default :
					if(force || $(`#mentionMeta meta[about='${id}'][property='${prop}']`).length <= 0){
						//console.log('inside default prop',name,prop,value,force)
						if(value) {						
							let meta_prop = metaTpl_prop.tpl({id,prop,value})
							if($(`#mentionMeta meta[about='${id}'][property='${prop}']`).length){
								$(`#file #mentionMeta meta[about='${id}'][property='${prop}']`).attr('content',value)	
							}else{							
								if($(`#mentionMeta meta[about='${id}']`).length)
								 	$(`#mentionMeta meta[about='${id}']`).last().after(meta_prop); //append on the last element refered to resource
								else
									$('#file #mentionMeta').append(meta_prop);
							}
							this[name] = value
						}else{
							$(`#file #mentionMeta meta[about='${id}'][property='${prop}']`).remove()
							//delete this[name]
						}
					}
					break;
			}
		},
		//clear meta head tag
		clearMeta: function(names,all,force = false){
			if(!all){
				for(name of names){					
					this.prop(name,'',force)
				}
			}			
		},
		// assign this entity to a different category. 
		switchTo: function(category,force, type) {
				for (var i=0; i<this.mentions.length; i++) {
					this.mentions[i].prop('category', category,force)
					//this.mentions[i].prop('entity', this.id, force);
				}
				this.category = category
				this.prop('id',this.category);
			
		},
		// assign this entity to scraps. 
		putToScraps: function() {
			this.switchTo('scraps',true)
		},
		// assign this entity to trash. 
		putToTrash: function() {
			this.switchTo('trash',true)
		}
	}

	// mentions are places in the document where entities are mentioned
	// they end up as <span class="mention category">text</span>
	this.Mention = function(nodeOrRange, options) {		
		if (!options) options = {}         // fallback object for inizialization
		var dataset = nodeOrRange.dataset || {}   // fallback object for inizialization		
		var prefix = "mention-" ;
		var mention = true;
		let label;		

		if (nodeOrRange.nodeType == Node.ELEMENT_NODE) { //if has already been created
			this.node = nodeOrRange	
		} else {
			if (!compatibleExtremes(nodeOrRange,mention)) return {}
			this.node = wrap(nodeOrRange,document.createElement('span'),mention) 
		}

		var t = this.surroundingContent(this.node) 
		this.before = t.before || ""
		this.after = t.after || ""
		this.inner = t.inner  // this will remain the exact string in the document		
		
		this.property = 'dcterms:references' // RDFa branch
		this.id = this.node.id || getNewId(prefix)		
		this.prop('id', this.id, false);
		this.prop('category', options.category || "scraps", true)
		this.prop('property', options.property || this.property, options.force)
		this.prop('entity', options.entity || options.id || t.inner.formattingEntity().replace(/(^\d+)/, "entity$1").toLowerCase(), false) 
		this.prop('sort', options.sort, options.force) ;

		this.category = dataset.category || options.category 	// person, place, thing, etc. 
		this.position = dataset.position || options.position || -1	// order in document, etc. 
		// this.entity = this.node.attributes.about.value
		this.entity = this.node.attributes.resource.value.match(/^#/) ? this.node.attributes.resource.value.replace(/^#/,'') : this.node.attributes.resource.value // Questa riga probabilmente va cambiata // Questa riga probabilmente va cambiata		

		if(this.category == 'trash'){
			label = 'Menzione cestinata'
		}

		if(this.category == 'scraps'){
			label = 'Menzione scartata'
		}
		
		this.label = $(`meta[about="#${this.entity}"][property='${ont.label}']`).length ? $(`meta[about="#${this.entity}"][property='${ont.label}']`).attr('content') : label || this.inner
		this.sort = $(`meta[about="#${this.entity}"][property='${ont.sort}']`).length ? $(`meta[about="#${this.entity}"][property='${ont.sort}']`).attr('content') : ''
		this.wikidataId = $(`meta[about="#${this.entity}"][property='${ont.wikidataId}']`).length ? $(`meta[about="#${this.entity}"][property='${ont.wikidataId}']`).attr('resource').replace(/http:\/\/www.wikidata.org\/entity\//g,'') : ''
		this.treccaniId = $(`meta[about="#${this.entity}"][property='${ont.treccaniId}']`).length ? $(`meta[about="#${this.entity}"][property='${ont.treccaniId}']`).attr('content') : ''
		
		if (dataset.rs) this.rs = `rs-active ${options.category}` // this is the value used for displaying if the mention is a referenceString
	}
	this.Mention.prototype = {
		// identify the text before and after the mention
		surroundingContent: function() {
			var blockElements = ['P', 'DIV', 'FIGCAPTION', 'LI', 'TR', 'DD', 'BODY']
			var thisAtn = this.node.allTextNodes()
			var container = this.node.parentElement 
			while (blockElements.indexOf(container.nodeName) == -1) container = container.parentElement //while not arrived at the source
			var atn = container.allTextNodes()
			
			var texts = {
				before: "",
				inner: this.node.innerHTML,
				after: ""
			}

			if (thisAtn[0].position !== 0) {
				var i = thisAtn[0].position - 1
				var words = []
				while (i> -1 && words.length <= kwic.prefs.wordsAround+10) {
					words = [...(atn[i--].textContent.split(/\s+/)), ...words]
				}
				var end = words.length-1
				var start = words.length-1
				var totalWords = 0
				while (totalWords < kwic.prefs.wordsAround && 0 <= start)
					if (words[start--].match(/\w+/)) 
						totalWords++
				texts.before = words.slice(start+1, end).join(" ")
			}
			if (thisAtn[thisAtn.length-1].position !== atn.length-1) {
				i = thisAtn[thisAtn.length-1].position + 1
				words = []
				while (i< atn.length && words.length <= kwic.prefs.wordsAround+10) {
					words = [...words, ...(atn[i++].textContent.split(/\s+/))]
				}
				var end = 0
				var start = 0
				var totalWords = 0
				while (totalWords <= kwic.prefs.wordsAround && end < words.length)
					if (words[end++].match(/\w+/)) 
						totalWords++
				texts.after = words.slice(start, end).join(" ")
			}
			return texts
		}, 
		// change the value of one of the properties of the mention
		// the id corresponds to the id of the node
		// the category correspond to the additional class name of the node (plus 'mention')
		// the entity correspond to the about attribute 
		// all other properties become data-* attributes. 
		prop: function(name,value, force=false) {
			var beforeEdit = this.before + this.node.outerHTML +this.after	
			switch (name) {
				case 'id':
					if (force || this.node.id== "") {
						if (value!=='')
							this.node.id = value
							this.node.setAttribute('typeof','moro:Mention') //add type of data fragment
							this.node.setAttribute('about',`#${value}`) //added line
					}
					break; 
				case 'category':
					if (force) {
						if (value) {
							this.node.classList = []
							this.node.classList.add('mention')
							this.node.classList.add(value)
						} else {
							this.node.classList.remove(value)					
						}
					}
					break; 				
				case 'property':
					if (force || this.node.attributes.property == undefined) {
						if (value) {
							this.node.setAttribute('property',value)
						} else {
							this.node.removeAttribute('property')
						}
					}
					break;
				case 'entity':
					if (force || this.node.attributes.resource == undefined) {
						if (value) {							
							this.node.setAttribute('resource',`#${value}`)																						
						} else {
							this.node.removeAttribute('resource')
						}
					}
					break;	
				default:
					if (force || this[name] == undefined) {
						if (value) {
							//$(`meta[about="#${this.entity}"][property='${ont[name]}']`).attr('content',value)
							//this.node.dataset[name] = value
							this[name] = value // added for first round label
						} else {
							//$(`meta[about="#${this.entity}"][property='${ont[name]}']`).remove()
							//delete this.node.dataset[name]
							delete this[name] // added for first round label
						}
					}
					break;
			}
			var afterEdit = this.before + this.node.outerHTML +this.after
			//kwic.addToEditList(beforeEdit, afterEdit)
		},
		referenceString: function(rs,label) {
			if(rs) this.node.classList.remove('metion-rs')
			if(!rs) this.node.classList.add('mention-rs');
			this.prop('rs',label,true)
		},
		switchTo: function(entity,force) {
			this.prop('entity',entity.id,force)
			this.prop('category', entity.category, force)
			this.prop('sort','',force)
			this.prop('label','',force)
			this.prop('wikidataId','',force)
			this.prop('treccaniId','',force)
			this.prop('rs','',force)
		},
		putToScraps: function() {
			this.prop('entity','scraps',true)
			this.prop('category', 'scraps', true)
			this.prop('sort','',true)
			this.prop('label','Menzione scartata',true)
			this.prop('wikidataId','',true)
			this.prop('treccaniId','',true)
			this.prop('rs','',true)
		},
		putToTrash: function() {
			this.prop('entity','trash',true)
			this.prop('category', 'trash', true)
			this.prop('sort','',true)
			this.prop('label','Menzione cestinata',true)
			this.prop('wikidataId','',true)
			this.prop('treccaniId','',true)
			this.prop('rs','',true)
		},
		unwrap: function() {
			unwrap(this.node)
		}
		
	}


	// REFERENCE OBJECTS

	this.Reference = function(citations, options) {
		if (!options) options = {}         // fallback object for inizialization
		var citations = citations || []   // fallback object for inizialization
		var prefix = "reference-" ;
		
		this.id = citations[0].reference
		this.citations = citations
		this.label = options.label || kwic.referenceList[this.id].label
		this.type = options.type || kwic.referenceList[this.id].type
		this.mention = options.mention || kwic.referenceList[this.id].mention;
		this.sort = options.sort || kwic.referenceList[this.id].sort
		
		this.sortFunctions ={
			'alpha': function(a,b) {
				var asort = a.sort || a.label || a.id
				var bsort = b.sort || b.label || b.id
				return asort.localeCompare(bsort)
			},
			'count': function(a,b) {
				return b.mentions.length - a.mentions.length
			},
			'position': function(a,b) {
				return a.position - b.position
			}
		}

		return this; 	
	}

	this.Reference.prototype = {
		// add a new category
		append: function(citation, override=false) {
			if (override) {
				citation.reference = this.id
			}
			this.citations.push(citation)
		
		},
		// sort categories
		sortCitations: function() {
			this.citations.sort(this.sortFunctions[kwic.prefs.sort]);
		}
	}

	this.Citation = function(quotesOrbib, options, type) {
		if (!options) options = {}         // fallback object for inizialization
		var bibrefs = bibrefs || []
		var prefix = "citation-" ;
	
		this.quotes = []
		this.bibrefs = []
		var reference = ""
		var label = ""
		var sort = ""
		var footnoteText = ""
		var footnoteID = ""
		this.position = Number.MAX_VALUE
		var inners = []

		switch (type) {
			case 'quote' :
				var quotes = quotesOrbib || []   // fallback object for inizialization
				this.id = quotes[0].citation;
			
				for (var i=0; i<quotes.length; i++) {
					quotes[i].citation = this.id
					reference = quotes[i].reference || reference
					label = quotes[i].label || label
					sort = quotes[i].sort || sort
					footnoteText = quotes[i].footnoteText || footnoteText
					footnoteID = quotes[i].footnoteID || footnoteID
					inners.push(quotes[i].inner)
					this.position = Math.min(this.position, quotes[i].position)
					this.quotes.push(quotes[i])
					}
				
					this.label = options.label || label //|| quotes[0].id
					break;
			case 'bibref' :
				var bibrefs = quotesOrbib || []   // fallback object for inizialization
				this.id = bibrefs[0].citation;

				for (var i=0; i<bibrefs.length; i++) {
					bibrefs[i].citation = this.id // exp-#
					reference = bibrefs[i].reference || reference
					label = bibrefs[i].label || label
					sort = bibrefs[i].sort || sort
					inners.push(bibrefs[i].inner)
					this.position = Math.min(this.position, bibrefs[i].position)
					this.bibrefs.push(bibrefs[i])
					}
				
				label = $(`meta[about="#${this.id}"][property='${rdfaBib.label}']`).length ? $(`meta[about="#${this.id}"][property='${rdfaBib.label}']`).attr('content') : label
				this.label = options.label || label //|| bibrefs[0].id				
				break;
		}

		this.reference = options.reference || reference || "scraps"
		this.sort = options.sort || sort		
		this.footnoteID = options.footnoteID || footnoteID || null
		this.footnoteText = options.footnoteText || footnoteText || $('#'+this.footnoteID).text() || ''

		if (!this.label) {
			var inn = {}
			var max = 0
			var el = ''
			for (var i in inners) {
				if (!inn[inners[i]]) inn[inners[i]] = 0
				inn[inners[i]]++
				if (inn[inners[i]] > max) {
					el = inners[i]
					max = inn[inners[i]]
				}
			}
			this.change('label',el, type)
			this.label = el
		}

		if(type == 'bibref'){
			this.prop('id', options.reference || rdfaBib.exp || "scraps", true)
			this.prop('label', options.label || this.label, options.force)
		}

		// Reduce label.
		// if(this.label){
		// 	console.log(this.label)
		// 	let words = this.label.split(' ');
		// 	let reduce_words = words.slice(0,6);

		// 	if(words.length > 6) reduce_words.push('...');
			
		// 	this.label = reduce_words.join(' ');
		// }		
		 
		return this; 	
	}

	this.Citation.prototype = {
	// adds a quote or bibref to this entity. If override, replace the info of the citation with the ones of the quote or bibref
	append: function(quoteOrbib, type, override=false) {
		if (override) {
			quoteOrbib.citation = this.id
			this.label = quoteOrbib.label || this.label
			this.sort = quoteOrbib.sort || this.sort
		}
		switch(type) {
			case 'quote' :
				this.quotes.push(quoteOrbib)
				break;
			case 'bibref' :
				this.bibrefs.push(quoteOrbib)
				break;
			case 'trash-quote' :
				this.quote.push(quoteOrbib)	
				break;
			case 'scraps-quote' :
				this.quote.push(quoteOrbib)		
				break;
			case 'trash-bibref' :
				this.bibrefs.push(quoteOrbib)	
				break;
			case 'scraps-bibref' :
				this.bibrefs.push(quoteOrbib)		
				break;
		}
	},
	// place all quotes oor bibref of a different citation into this one.
	mergeInto: function(target) {
		if(this.bibrefs.length > 0){
			for (var i=0; i<this.bibrefs.length; i++) {
				this.bibrefs[i].prop('citation',target.id, true)
				this.bibrefs[i].prop('sort','', true)
				this.bibrefs[i].prop('label','', true)
				target.bibrefs.push(this.bibrefs[i])
			}
			
			// cleaning source entity
			let all = false, force = true, names = ['id','label']
			this.clearMeta(names,all,force)

			kwic.allCitations[this.id] = null
		}
	},
	// change a property of this citation by changing the corresponding property of the first quote or bibref 
	change: function(field,value, type) {
		var done = false
		switch(type) {
			case 'quote' :
				for (var i=0; i<this.quotes.length; i++) {
					if (this.quotes[i][field]) {
						this.quotes[i].prop(field, value,true)
						done = true
					}
				}			
				if (!done) this.quotes[0].prop(field, value)
				break;
			
			case 'bibref' :
				for (var i=0; i<this.bibrefs.length; i++) {
					if (this.bibrefs[i][field]) {
						this.prop(field,value,true)

						this.bibrefs[i].prop(field, value,true)
						done = true
					}
				}			
				if (!done){
					this.prop(field,value)
					this.bibrefs[0].prop(field, value)
				} 
				break;
		}
	},
	prop: function(name,value,force = false){
		let id = uri+this.id;
		let prop = rdfaBib[name] || '';

		let metaTpl_type = `<meta about="{$id}" typeof="{$value}">`
		let metaTpl_prop = `<meta about="{$id}" property="{$prop}" content="{$value}">`

		switch(name) {
			case 'id':
				if(force || id == uri){
					if(value!=''){					
						let meta_type = metaTpl_type.tpl({id,value})

						if($(`#referenceMeta meta[about='${id}'][typeof]`).length)
							$(`#referenceMeta meta[about='${id}'][typeof]`).attr('typeof',value)
						else{
							$('#file #referenceMeta').append(meta_type);												
						}
					}else{
						$(`#file #referenceMeta meta[about='${id}'][typeof]`).remove()
					}
				}
				break;
			default :
				if(force || $(`#referenceMeta meta[about='${id}'][property='${prop}']`).length <= 0){
					//console.log('inside default prop',name,prop,value,force)
					if(value) {						
						let meta_prop = metaTpl_prop.tpl({id,prop,value})
						
						if($(`#referenceMeta meta[about='${id}'][property='${prop}']`).length){
							$(`#file #referenceMeta meta[about='${id}'][property='${prop}']`).attr('content',value)	
						}else{							
							if($(`#referenceMeta meta[about='${id}']`).length)
								$(`#referenceMeta meta[about='${id}']`).last().after(meta_prop); //append on the last element refered to resource
							else
								$('#file #referenceMeta').append(meta_prop);
						}
						this[name] = value
					}else{
						$(`#file #referenceMeta meta[about='${id}'][property='${prop}']`).remove()
						//delete this[name]
					}
				}
				break;				
		}
	},	
	//clear meta head tag
	clearMeta: function(names,all,force = false){
		if(!all){
			for(name of names){					
				this.prop(name,'',force)
			}
		}			
	},
	// assign this citation to a different references. 
	switchTo: function(reference,force) {
		if(this.quotes.length > 0){
			for (var i=0; i<this.quotes.length; i++) {
				this.quotes[i].prop('reference', reference,force)
			}
		}else{
			for (var i=0; i<this.bibrefs.length; i++) {
				this.bibrefs[i].prop('reference', reference,force)
			}
		}
		this.reference = reference;
		this.prop('id',this.reference);
		},
		// assign this citation to scraps. 
		putToScraps: function() {
			this.switchTo('scraps',true)
		},
		// assign this citation to trash. 
		putToTrash: function() {
			this.switchTo('trash',true)
		}
	}

	this.Quote = function(nodeOrRange, options) {
		if (!options) options = {}         // fallback object for inizialization
		var dataset = nodeOrRange.dataset || {}   // fallback object for inizialization		
		var prefix = "quote-" ;
		var mention = false;

		let uriRegExp = new RegExp(`^${uri}`)
		
		if (nodeOrRange.nodeType == Node.ELEMENT_NODE) { //if has already been created
			this.node = nodeOrRange	
		} else {
			let supNode = options.supNode;
			if (!compatibleExtremesRef(nodeOrRange,supNode)) return {}
			this.node = wrapQuote(nodeOrRange,document.createElement('span'), supNode);			
		}
		
		if(this.node.getElementsByClassName('quote-text')[0])
			this.inner = this.node.getElementsByClassName('quote-text')[0].innerText;
		else 
			this.inner = this.node.innerText;

		this.id = this.node.id || getNewQuoteId(prefix) 
		this.prop('id', this.id, false) ;		
		this.prop('reference', options.reference || "scraps", true)
		this.prop('citation', options.citation || options.id || `${prefix}${lastQuoteId}`, false)
		this.prop('property', options.footnoteID, options.force);
		//this.prop('footnoteText', options.footnoteText, options.force) ;
		this.prop('label', options.label, options.force) ;
		this.prop('sort', options.sort, options.force) ;

		this.reference = dataset.reference || options.reference 	// person, place, thing, etc. 
		this.footnoteNode = options.footnote || null;
		this.footnoteID = options.footnoteID || null;
		this.footnoteText = options.footnoteText || null;
		this.position = dataset.position || options.position || -1	// order in document, etc. 
		this.citation = this.node.attributes.about.value.replace(uriRegExp,'');
		this.quote_text = this.node.getElementsByClassName('quote-text')[0];

		if (dataset.label) this.label = dataset.label // this is the value used for displaying the entity this mention belongs to
		if (dataset.sort) this.sort = dataset.sort // this is the value used for sorting the entity this mention belongs to
		if (this.node.attributes.resource) this.footnoteID = this.node.attributes.resource.value
		if ($(this.footnoteID).length) this.footnoteText = $(this.footnoteID).text()		 
	}

	this.Quote.prototype = {
		prop: function(name,value, force=false) {
			switch (name) {
				case 'id':
					if (force || this.node.id== "") {
						if (value!=='')
							this.node.id = value
							this.node.setAttribute('about',uri+value);
							this.node.setAttribute('typeof',rdfaQuote.typeof);

					}
					break; 
				case 'reference':
					if (force) {
						if (value) {
							this.node.classList = []
							this.node.classList.add('quote')
							this.node.classList.add(value)
						} else {
							this.node.classList.remove(value)					
						}
					}
					break; 
				case 'citation':
					if (force || this.node.attributes.about == undefined) {
						if (value) {
							this.node.setAttribute('about',value)
						} else {
							this.node.removeAttribute('about')
						}
					}
					break;
				case 'property':
					if(force || this.node.attributes.property == undefined){
						if (value) {
							this.node.setAttribute(name,rdfaQuote.property);
							this.node.setAttribute('resource',uri+value);
						}
					}
					break;
				default:
					if (force || this.node.dataset[name]== undefined) {
						if (value) {
							this.node.dataset[name] = value
						} else {
							delete this.node.dataset[name]
						}
					}
					break;
			}
		},
		putToScraps: function() {
			this.prop('citation','scraps',true)
			this.prop('reference', 'scraps', true)
			this.prop('sort','',true)
			this.prop('label','Citazione scartata',true)
		},
		putToTrash: function() {
			this.prop('citation','trash',true)
			this.prop('reference', 'trash', true)
			this.prop('sort','',true)
			this.prop('label','Citazione cestinata',true)
		},
		unwrap: function() {
			//Double unwrap
			unwrap(this.quote_text);
			unwrap(this.node);
		}
	}

	this.BibRef = function(nodeOrRange,options) {
		if (!options) options = {}         // fallback object for inizialization
		var dataset = nodeOrRange.dataset || {}   // fallback object for inizialization		
		var prefix = "bibref-" ;
		var mention = false;
		
		let uriRegExp = new RegExp('^'+uri)
		let label = ''

		if (nodeOrRange.nodeType == Node.ELEMENT_NODE) { //if has already been created
			this.node = nodeOrRange	
		} else {
			if (!compatibleExtremesRef(nodeOrRange,mention)) return {}
			//this.node = wrap(nodeOrRange,document.createElement('span'),mention)
			this.node = wrapBib(nodeOrRange,document.createElement('span'));			
		}

		this.inner = this.node.innerText;

		this.property = rdfaBib.property;
		this.id = this.node.id || getNewBibId(prefix) 
		this.prop('id', this.id, false);
		this.prop('reference', options.reference || "scraps", true)
		this.prop('property', options.property || this.property, options.force)
		this.prop('citation', options.citation || options.id || 'exp-'+(lastBibId - 1))
		//this.prop('citation', options.citation || options.id || this.inner.replace(/([^a-zA-Z0-9]+)/g,"").replace(/(^\d+)/, "citation$1"), false)
		//this.prop('label', options.label, options.force) ;
		this.prop('sort', options.sort, options.force) ;

		this.reference = dataset.reference || options.reference 	// bibRef, quote
		this.position = dataset.position || options.position || -1	// order in document, etc. 
		this.citation = this.node.attributes.resource.value.match(uriRegExp) ? this.node.attributes.resource.value.replace(uriRegExp,'') : this.node.attributes.resource.value // Questa riga probabilmente va cambiata // Questa riga probabilmente va cambiata		

		if(this.reference == 'trash'){
			label = 'Riferimento bibliografico cestinato'
		}

		if(this.reference == 'scraps'){
			label = 'Riferimento bibliografico scartato'
		}

		this.label = $(`meta[about="#${this.citation}"][property='${rdfaBib.label}']`).length ? $(`meta[about="#${this.citation}"][property='${rdfaBib.label}']`).attr('content') : label || this.inner

		// this.label = options.label || label;
		// this.sort = options.sort;

		// if (dataset.label) this.label = dataset.label // this is the value used for displaying the entity this mention belongs to
		// if (dataset.sort) this.sort = dataset.sort // this is the value used for sorting the entity this mention belongs to
	}

	this.BibRef.prototype = {
		prop: function(name,value,force=false){			
			switch (name) {
				case 'id':
					if (force || this.node.id== "") {
						if (value!=='')						
							this.node.id = value
							this.node.setAttribute('typeof',rdfaBib.typeof)
							this.node.setAttribute('about',uri + value)
					}
					break; 
				case 'reference':
					if (force) {
						if (value) {
							this.node.classList = []
							this.node.classList.add('bibref')
							this.node.classList.add(value)
						} else {
							this.node.classList.remove(value)					
						}
					}
					break; 
				case 'property':
					if (force || this.node.attributes.property == undefined) {
						if (value) {
							this.node.setAttribute('property',value)
						} else {
							this.node.removeAttribute('property')
						}
					}
					break;
				case 'citation':					
					if (force || this.node.attributes.resource == undefined) {
						if (value) {
							this.node.setAttribute('resource',uri+value)
						} else {
							this.node.removeAttribute('resource')
						}
					}
					break;
				default:
					if (force || this.node.dataset[name]== undefined) {
						if (value) {
							//this.node.dataset[name] = value
							this[name] = value
						} else {
							delete this[name]
						}
					}
					break;
			}
		},
		switchTo: function(citation,force) {
			this.prop('citation',citation.id,force)
			this.prop('reference', citation.reference, force)
			this.prop('sort','',force)
			this.prop('label','',force)
		},
		putToScraps: function() {
			this.prop('citation','scraps',true)
			this.prop('reference', 'scraps', true)
			this.prop('sort','',true)
			this.prop('label','Rif. bibliografico scartato',true)
		},
		putToTrash: function() {
			this.prop('citation','trash',true)
			this.prop('reference', 'trash', true)
			this.prop('sort','',true)
			this.prop('label','Rif. bibliografico cestinato',true)
		},
		unwrap: function() {
			unwrap(this.node)
		}
	}

	// static methods

	// non complete versioning mechanism for editing mentions
	this.addToEditList = function(before,after) {
		this.editList.push({
			before: before,
			after: after,
			author: this.prefs.loggedUser,
			datetime: new Date().toLocaleString()
		})
	}

	// changes preferences
	this.setPrefs = function(type,value) {
		this.prefs[type] = value
	}

	//Mark all footnote with curator or author
	this.markFootnote = function(location,options) {
		let footnotes = [];
		var counter = 0;

		if(options){
			var node = options.node;
			var markChar = options.markChar;
			var attribute = options.attribute;
			var selector = options.selector;
			var author = options.author;
			var exception;
			if(exception === '') exception = options.exception;
		}

		let container = document.querySelector(`${location}`);
		exception ? footnotes = container.querySelectorAll(`${node}[${attribute}^='${selector}']:not([${node}$='${exception}'])`) : footnotes = container.querySelectorAll(`${node}[${attribute}^='${selector}']`);
		
		if(footnotes){
			let re = new RegExp(`^\\${markChar}`,'g');
			footnotes.forEach(footnote => {
				
				if(footnote.hasAttribute('data-owner')) return counter;

				let text = footnote.innerText; //gets just human readable text without styles
				text.trim();
				
				if(text.match(re) && !footnote.hasAttribute('data-owner')){
					footnote.setAttribute('data-owner',`${author.replace(/\s/g,'')}`)
					footnote.setAttribute('data-toggle','tooltip');
					footnote.setAttribute('data-html',true);
					footnote.setAttribute('title',`Nota di <em>${author}</em>`);
					counter++;
				}else{
					footnote.setAttribute('data-owner','curator')
				}
			});
		}

		$('[data-toggle="tooltip"]').tooltip({
			trigger: 'hover'
		});

		return counter;
	}
		
	// search for all elements of the 'mention' class (as specified by the selector parameter) 
	// and puts them in the allMention array
	this.findMentions = function(selector, location){
		var p = $(selector,location) 
		lastId = getLargestId(p.get()) +1
		for (i=0; i< p.length; i++) {
			var classes = Array.from(p[i].classList).filter( (j) => this.categoryList[j] !== undefined )
			var m = new this.Mention(p[i], {
				category: classes.length>0 ? classes[classes.length-1] : '',
				position: i
			})
			this.allMentions[m.id] = m
			
		}
		return this.allMentions
	};

	this.findQuotes = function(selector, location){
		var p = $(selector,location)
		lastQuoteId = getLargestId(p.get()) +1 
		for (i=0; i<p.length; i++){
			var classes = Array.from(p[i].classList).filter( (j) => this.referenceList[j] !== undefined )
			var q = new this.Quote(p[i], {
				reference: classes.length>0 ? classes[classes.length-1] : '',
				position: i
			})
			this.allQuotes[q.id] = q
		
		}

		return this.allQuotes;
	}

	this.findBibRef = function(selector, location){
		var p = $(selector,location)
		lastBibId = getLargestId(p.get()) +1 
		for (i=0; i<p.length; i++){

			var classes = Array.from(p[i].classList).filter( (j) => this.referenceList[j] !== undefined )
			var b = new this.BibRef(p[i], {
				reference: classes.length>0 ? classes[classes.length-1] : '',
				position: i
			})		
			this.allBibRef[b.id] = b
		}
		return this.allBibRef;
	}
	
	// organizes all mentions in a hierarchical array of arrays: categories containing entities containing mentions
	this.organize = function() {
		var mentions = this.allMentions
		var entities = this.allEntities
		var categories = this.allCategories

		for (var i in mentions) {
			var mention = mentions[i]
			// mention.entity is the about value ex. mention: Moro mention.entity: AldoMoro
			if(!entities[mention.entity]) {
				// this.Entity(mentions,options,type)
				entities[mention.entity] = new this.Entity([mention], {})
			} else {
				entities[mention.entity].append(mention, true)
			}
		}

		for (var i in entities) {
			var entity = entities[i]
			if(!categories[entity.category]) {
				categories[entity.category] = new this.Category([entity], {})
			} else {
				categories[entity.category].append(entity, false)
			}			
		}
		return categories
	}

	// organizes all quotes in a hierarchical array of arrays
	this.organizeQuotes = function() {
		var quotes = this.allQuotes;
		var bibrefs = this.allBibRef;
		var citations = this.allCitations;
		var references = this.allReferences;
		
		for (var i in quotes) {
			var quote = quotes[i];
			if(!citations[quote.citation]) {
				citations[quote.citation] = new this.Citation([quote], {}, "quote")
			} else {
				switch(quote.reference) {
					case 'bibref':
						citations[quote.citation].append(quote, quote.reference , true);
						break;
					default:
						let trash_scrap = quote.reference.concat('-quote');
						citations[quote.citation].append(quote, trash_scrap , true);
					}
				}
			}

		for (var i in bibrefs) {
			var bibref = bibrefs[i]
			if(!citations[bibref.citation]){
				citations[bibref.citation] = new this.Citation([bibref], {}, "bibref")
			} else {
				switch(bibref.reference) {
					case 'bibref':
						citations[bibref.citation].append(bibref, bibref.reference , true);
						break;
					default:
						let trash_scrap = bibref.reference.concat('-bibref');
						citations[bibref.citation].append(bibref, trash_scrap , true);
					}
				}
			}

		for (var i in citations) {
			var citation = citations[i];
			if(!references[citation.reference]) {
				references[citation.reference] = new this.Reference([citation], {})
			} else {
				references[citation.reference].append(citation, false)
			}
		}
		return references;
	}

	// Remove left metatag after organizing the mentions 
	this.clearHead = function(list) {
		let meta = $('#mentionMeta meta'); // list of all meta tag

		// Exit status
		if(meta.length <= 0){
			return null
		}
		// Search entities id
		for(cat in list){
			entities = list[cat].entities			
			for(ent in entities){		
				let id = '#' + entities[ent].id
				
				// Grep meta object from id no more included 
				meta = $.grep(meta,function(tag){										
					return tag.getAttribute('about') !== id
				})	
			}			
		}

		// Remove left metaTag 
		if(meta.length){
			for(metaTag of meta){
				metaTag.remove()
			}
		}

		return meta
	}

	// Remove left metatag after organizing the mentions 
	this.clearHeadRef = function(list) {
		let meta = $('#referenceMeta meta'); // list of all meta tag

		// Exit status
		if(meta.length <= 0){
			return null
		}
		
		// Search entities id			
		for(ref in list){		
			citations = list[ref].citations			
			for(cit in citations){
				let exp = '#' + citations[cit].id
				// Grep meta object from id no more included 
				meta = $.grep(meta,function(tag){										
					return tag.getAttribute('about') !== exp
				})	
			}			
		}			
		
		// Remove left metaTag 
		if(meta.length){
			for(metaTag of meta){
				metaTag.remove()
			}
		}

		return meta
	}
	
	// creates an HTML structure out of a series of templates and some data. 
	// HTMLstructures nests mention template within entity template within category template
	this.toHTML= function(data, tpl) {
		var content = ""
		if (!tpl.categories) tpl.categories = "{$content}"
		if (!tpl.entities) tpl.entities = "{$content}"
		var sortedCategories = this.sortCategories(data);
		for (var i=0; i<sortedCategories.length; i++) {
			data[sortedCategories[i]].sortEntities()
			var cat = {...data[sortedCategories[i]]}
			cat.content = ""
			cat.count = cat.entities.length; 
			for (var j=0; j<cat.entities.length; j++) {
				var ent = {...cat.entities[j]}
				ent.content = ""
				ent.count = ent.mentions.length				
				if(ent.wikidataId){
					ent.check = '<span class="badge badge-light"><span class="oi oi-check text-success align-middle"></span></span>'
					if(ent.treccaniId){ //Controlla se è presente anche il treccani Id
						ent.placeholderTreccani = ''
						ent.treccaniLink = 'treccaniLink' //treccani link class activate
					}else{
						ent.treccaniLink = 'popoverTreccani' //treccani link class activate
						ent.placeholderTreccani = 'Non rilevato' //treccani non presente all'interno dei Wikidata
					}
				}else{
					ent.check = ''
					ent.placeholderTreccani = ''
				}
				if (tpl.mentions) {
					for (var k=0; k<ent.mentions.length; k++) {
						var mention = {...ent.mentions[k]} ;
						mention.style = kwic.prefs.style; 
						mention.content = kwic.templates[kwic.prefs.style].tpl(mention)
						ent.content += tpl.mentions.tpl(mention)
					}
				}
				cat.content += tpl.entities.tpl(ent)
			}
			content += tpl.categories.tpl(cat)
		}
		return content; 
	}

	// HTML structures that nest quotes template within entity template within reference template
	this.toHTMLref = function(data,tpl){
		var content = "";
		if (!tpl.references) tpl.references = "{$content}"
		if (!tpl.citations) tpl.citations = "{$content}"
		var sortedReferences = this.sortReferences(data);
		for (var i=0; i<sortedReferences.length; i++) {
			data[sortedReferences[i]].sortCitations()
			var ref = {...data[sortedReferences[i]]}
			ref.content = ""
			ref.count = ref.citations.length;
			for (var j = 0; j<ref.citations.length; j++) {
				var cit = {...ref.citations[j]}
				cit.content = ""
				cit.count = cit.quotes.length || cit.bibrefs.length
				//WIKIDATA ID
				if (tpl.quotes){
					for (var k=0; k<cit.quotes.length; k++){
						var quote = {...cit.quotes[k]};
						quote.content = kwic.templates['none'].tpl(quote)
						cit.content += tpl.quotes.tpl(quote)
					}
				}
				if (tpl.bibrefs){
					for (var k=0; k<cit.bibrefs.length; k++){
						var bibref = {...cit.bibrefs[k]};
						bibref.content = kwic.templates['none'].tpl(bibref)
						cit.content += tpl.bibrefs.tpl(bibref)
					}
				}
				ref.content += tpl.citations.tpl(cit)
			}
			content += tpl.references.tpl(ref)
		}
		return content;

	}
	
	// associates an entity or a mention to another entity or to another category. 
	// also puts entity or mention in scraps or in trash
	this.mergeData = function (sourceData, targetData) {
		if (sourceData.id !== targetData.id) {
			if (sourceData.level == 'entity' && targetData.level == 'entity') {
				var source = this.allEntities[sourceData.id]
				var target = this.allEntities[targetData.id]
				source.mergeInto(target)
			} else if (sourceData.level=='entity' && targetData.level == 'category') {
				var source = this.allEntities[sourceData.id]
				var target = this.allCategories[targetData.id]
				if(source.id != "trash" && source.id != "scraps"){
					if (source.category !== target.id) {
						var ok = confirm(`Vuoi cambiare categoria dell'entità da "{$source}" a "{$target}"?`.tpl(
							{
								source: source.label,
								target: target.label || targetData.id
							}
						))
						if (ok) {
							source.switchTo(target.id,true)
						}
					}
				}				
			} else if (sourceData.level == 'entity' && targetData.level == 'scraps') {
				var source = this.allEntities[sourceData.id]
				source.putToScraps()
			} else if (sourceData.level == 'entity' && targetData.level == 'trash') {				
				var source = this.allEntities[sourceData.id]
				source.putToTrash()
			} else if (sourceData.level=='mention' && targetData.level == 'entity') {
				var source = this.allMentions[sourceData.id]
				var target = this.allEntities[targetData.id]
				source.switchTo(target,true)
			} else if (sourceData.level == 'mention' && targetData.level == 'scraps') {
				var source = this.allMentions[sourceData.id]
				source.putToScraps()
			} else if (sourceData.level == 'mention' && targetData.level == 'trash') {
				var source = this.allMentions[sourceData.id]
				source.putToTrash()
			}
		}
	}

	this.mergeDataRef = function (sourceData, targetData) {
		if (sourceData.id !== targetData.id) {
			if (sourceData.level == 'citation' && targetData.level == 'citation') {
				var source = this.allCitations[sourceData.id]
				var target = this.allCitations[targetData.id]
				source.mergeInto(target)
			} else if (sourceData.level=='citation' && targetData.level == 'reference') {
				var source = this.allCitations[sourceData.id]
				var target = this.allReferences[targetData.id]
				if (source.reference !== target.id) {
					var ok = confirm('Do you want to change reference of citation "{$source}" to "{$target}"?'.tpl(
						{
							source: source.label,
							target: target.label || targetData.id
						}
					))
					if (ok) {
						source.switchTo(target.id,true)
					}
				}
			} else if (sourceData.level == 'citation' && targetData.level == 'scraps') {
				var source = this.allCitations[sourceData.id]
				source.putToScraps()
			} else if (sourceData.level == 'citation' && targetData.level == 'trash') {
				var source = this.allCitations[sourceData.id]
				source.putToTrash()
			} else if (sourceData.level == 'quote' && targetData.level == 'citation') {
				var source = this.allQuotes[sourceData.id]
				var target = this.allCitations[targetData.id]
				source.switchTo(target,true)
			} else if (sourceData.level == 'quote' && targetData.level == 'scraps') {
				var source = this.allQuotes[sourceData.id]
				source.putToScraps()
			} else if (sourceData.level == 'quote' && targetData.level == 'trash') {
				var source = this.allQuotes[sourceData.id]
				source.putToTrash()
			} else if (sourceData.level == 'bibref' && targetData.level == 'citation') {
				var source = this.allBibRef[sourceData.id]
				var target = this.allCitations[targetData.id]
				source.switchTo(target,true)
			}  else if (sourceData.level == 'bibref' && targetData.level == 'scraps') {
				var source = this.allBibRef[sourceData.id]
				source.putToScraps()
			} else if (sourceData.level == 'bibref' && targetData.level == 'trash') {
				var source = this.allBibRef[sourceData.id]
				source.putToTrash()
			}
		}
	}
	
	// sorts categories according to the sort parameter in the categories.json file
	this.sortCategories = function(data) {
		return Object.keys(data).sort( (a,b) => data[a].sort - data[b].sort );
	}

	// sort references according to the sort parameter in the references.json file
	this.sortReferences = function(data) {
		return Object.keys(data).sort( (a,b) => data[a].sort - data[b].sort );
	}
	
	// generates the list of categories loaded from the categories.json file
	this.setCategories = function(data) {
		if (data.categories)
			data = data.categories
		this.categoryList = data
	}

	// generates the list of references loaded from the references.json file
	this.setReferences = function(data) {
		if(data.references)
			data = data.references
		this.referenceList = data
	}

	this.referencingString = function(id,value) {
		let m = this.allMentions[id];
		let entity = m.entity;

		if(value == true){
			m.referenceString(value); //delete if already true
		}else{
			m.referenceString(value,entity); //add rs
		}
	}

	// creates a mention from a text selection, taking care of extending the selection
	// to the word, if needed, and searching all identical text fragments in the rest of 
	// the document, if needed. 
	this.doAction = function(key, alt, shift) {
		var context = $(documentLocation)[0]
		var ret = false;
		for (var i in this.categoryList) {
			if (this.categoryList[i].letter == key) {
				var cat = this.categoryList[i]
				var sel = snapSelection(cat.type, this.prefs.extend, alt)
				if (sel) {
					if (xor(shift, this.prefs.markAll && cat.markAll)) { //if just one of them is true, but not both.
						var ranges = searchAll(context, sel, this.prefs.markWords)
						console.log(ranges, sel.getRangeAt(0));
						//console.log(STOP);
						if(this.prefs.markWords && (ranges.filter(range => range.startOffset === sel.getRangeAt(0).startOffset && range.startContainer === sel.getRangeAt(0).startContainer ).length == 0)) ranges.push(sel.getRangeAt(0))						
					} else {
						var ranges = [sel.getRangeAt(0)]
					}
					for (var i in ranges) {												
						if (cat.action=='wrap') {
							if(cat.mention){
								//this.Mentions(nodeorRange,options)
								var m = new this.Mention(ranges[i], {
									category: cat.entity
								})
								//m.id = node.id ex. mention-1
								if (m.id) this.allMentions[m.id] = m //a quella posizione associo la mention rispettiva
								ret = true
							}		
						}
					}					
				}
			}
		}
		return ret; 
	}

	// creates a reference from a text selection which behave differently if it's a quote, a bib ref
	// or a footnote. 
	this.doActionReference = function(key, alt, shift) {
		let context = $(documentLocation)[0]
		let ret = false;
		for (var i in this.referenceList) {
			if (this.referenceList[i].letter == key){
				let ref = this.referenceList[i]
				let selection = snapSelectionRef(ref.type, this.prefs.extend, alt)
				if(selection){
					var range;
					if(selection.footnoteNode){
						range = selection.range;
					} else {
						if (xor(shift, this.prefs.markAll && ref.markAll)) { //if just one of them is true, but not both.
							range = searchAll(context, selection.sel.toString(), false)
							if(range.length === 0){
								range = [selection.sel.getRangeAt(0)];
							}
						}else{
							range = [selection.sel.getRangeAt(0)];
						}
					}
					if(ref.action == 'wrap-quote') {
						var footnote,q;

						if(selection.footnoteNode){
							footnote = getFootnote(selection.footnoteNode);

							q = new this.Quote(range, {
								reference: ref.entity,
								supNode: selection.footnoteNode,
								footnote: footnote.footnoteNode,
								footnoteID: footnote.footnoteID,
								footnoteText: footnote.footnoteText
							})
						}else{
							q = new this.Quote(range[0], {
								reference: ref.entity,
							})
						} 

						if(q.id){
							this.allQuotes[q.id] = q;
						}
					}
					if(ref.action == 'wrap-bib'){
						//Search for every range
						let exp = 'exp-'+(lastBibId);
						for(let i in range){
							var b;

							b = new this.BibRef(range[i],{
								reference: ref.entity,
								citation: exp
							})
						}
					}
					ret = true;
				}
			}
		}
		return ret;
	}
		
	// creates a list of all entities ready to be exported as a JSON or CSV file
	this.compactEntities = function(type) {
		var list = []
		for (var i in this.allEntities) {
			var e = {
				id: i,
				label: this.allEntities[i].label,
				sort: this.allEntities[i].sort,
				category: this.allEntities[i].category,
				wikidataId: this.allEntities[i].wikidataId,
				treccaniId: this.allEntities[i].treccaniId,
				count: this.allEntities[i].mentions.length,
				variants: []
			}
			for (var j in this.allEntities[i].mentions) {
				if (e.variants.indexOf(this.allEntities[i].mentions[j].inner) == -1)
					e.variants.push(this.allEntities[i].mentions[j].inner)
			}
			list.push(e)
		}
		if (type=='JSON') 
			return JSON.stringify(list, null, 2)

		list.unshift({
			id: 'id',
			label: 'label',
			sort: 'sort',
			category: 'category',
			wikidataId: 'wikidataId',
			treccaniId: 'treccaniId',
			count: 'count',
			variants: ['variants']
		})
		for (var i in list) {
			list[i].variants = list[i].variants.join(',')
			list[i] = Object.values(list[i]).join(',')
		}
		list = list.join('\n')
		return list	
	}
	
	// after importing some entities, search the corresponding variant texts across 
	// the document and marks them correctly. 
	this.searchEntity = function(entityListItem) {
		var context = $(documentLocation)[0]
		entityListItem.variants.sort( (a,b) => a.length - b.length )
		data = {
			id: entityListItem.id,
			category: entityListItem.category,
			force: true   // force specification of attributes in markup elements				
		}
		for (var i=0; i<entityListItem.variants.length; i++) {
			var s = entityListItem.variants[i]
			var ranges = searchAll(context, s, false)
			var m0
			for (var j in ranges) {
				var m = new this.Mention(ranges[j], data)
				if (!m0 || !m0.node.parentElement) m0 = m
				if (m.id) this.allMentions[m.id] = m
				data.force = false
			}		
		}
		if (m0){
			m0.prop('sort',entityListItem.sort)
			m0.prop('label',entityListItem.label)
			m0.prop('wikidataId',entityListItem.wikidataId)
			m0.prop('treccaniId',entityListItem.treccaniId)
		}
	}

	this.toogleModifyOlderDocs = function() {
		modifyOlderDocuments = !modifyOlderDocuments;
		return modifyOlderDocuments;
	}	
	
	// resets all internal variables to empty
	this.cleanAll = function() {
		//CLEAR HEAD
		//if($('#file #mentionMeta').length) $('#file #mentionMeta').html('')

		this.allCategories = {}
		this.allEntities = {}
		this.allMentions = {}
		
		this.allReferences = {}
		this.allCitations = {}
		this.allQuotes = {}
		this.allBibRef = {}
	}


	this.cleanAll() ; 	
	return this	
})()