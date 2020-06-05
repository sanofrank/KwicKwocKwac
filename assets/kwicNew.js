/*!
 * Kwic Kwoc Kwac - main kwic.js 
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

/* ------------------------------------------------------------------------------ */
/*                                                                                */
/*                                MAIN CLASS                                      */
/*                                                                                */
/* ------------------------------------------------------------------------------ */
var kwic = new (function () {
	var lastId = -1;                  // last specified id for new mentions
	
	// generates the id for a mention
	function getNewId(prefix) {
		return prefix + (lastId++)
	}
	
	// if mentions are alreeady present in this file, find the largest one and set lastId to that+1
	function getLargestId(selection) {
		// https://stackoverflow.com/questions/15371102/get-highest-id-using-javascript
		return selection.reduce( (a, b) => {
			return Math.max(a, (b.id.match(/\w+\-(\d+)/)||[,a])[1])
		}, -1);
	}

	// is start and end anchors of a range are compatible the mention can be created. 
	// If one or both of them belong to an existing mention, no worries since the existing mention will be removed anyway. 
	function compatibleExtremes(range) {
		if (range.startContainer.parentElement == range.endContainer.parentElement) return true

		var start = range.startContainer.parentElement
		var end = range.endContainer.parentElement
		
		if (start.classList.contains('mention') )
			start = start.parentElement // will remove it anyway
		if (end.classList.contains('mention') )
			var end = end.parentElement // will remove it anyway
		
		return  start == end
	}

	// remove the tag wrapping a mention
	function unwrap(node) {
		var p = node.parentElement
		while (node.childNodes.length>0) {
			p.insertBefore(node.childNodes[0],node)		
		}
		p.removeChild(node)
	}

	// insert a range within an element. Make sure to remove the overlapping mentions if they exist. 
	function wrap(range, node, removeOverlaps) {
		// save range extrenes here, since unwrapping elements will affect them later
		var r = {
			sc: range.startContainer, 
			so: range.startOffset, 
			ec: range.endContainer, 
			eo: range.endOffset
		}
		if (range.startContainer.parentElement.classList.contains('mention')) 
			unwrap(range.startContainer.parentElement)
		if (range.endContainer.parentElement.classList.contains('mention')) 
			unwrap(range.endContainer.parentElement)
			
		// if range was unwrapped, its extremes are no longer reliable. Use the ones stored in r instead. 
		range.setStart(r.sc, r.so)
		range.setEnd(r.ec, r.eo)
		range.surroundContents(node); 
		node.parentElement.normalize()
		if (node.parentElement.classList.contains('mention')) unwrap(node)
		var inner = node.querySelectorAll('.mention')
		for (var i=0; i<inner.length; i++) {
			unwrap(inner[i]) 
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
			if (xor(alt, boundary && snap)) {
				console.log('Before: '+sel.toString() )
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
				console.log('After: '+sel.toString() )
			}
		} else if ( (sel = document.selection) && sel.type != "Control") {
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

	// search for a text and return the text node(s) containing the text (even across text nodes)
	function searchAll(context, text) {
		var ret = []
		var atn = context.allTextNodes()
		var all = allMatches(text, context.textContent)
		
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

	// preferences for this kwic. 
	this.prefs = {
		loggedUser: 'none',
		wordsAround: 5,
		style: "KWIC",
		sort: 'alpha',	
		extend: true,
		markAll: true
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
		var prefix = "entity-" ;

		var _mentions = mentions || []   // fallback object for inizialization

		Object.defineProperties(this, {
			"node": {
				"get": function() { return _node; },
				"set": function(nodeOrRange) { 
					if (!nodeOrRange) {
						_node = null; 
					} else if (nodeOrRange.nodeType == Node.ELEMENT_NODE) {
						_node = nodeOrRange	
					} else {
						if (!compatibleExtremes(nodeOrRange)) return {}
						_node = wrap(nodeOrRange,document.createElement('span'))
					}
				}
			},
			"id": {
				"get": function() { 
					return _node?.attributes?.about?.value ; 
				},
				"set": function(value) { 
					if (!value) value = getNewId(prefix)
					_node.setAttribute('about', value) 
				}
			},
			"category": {
				"get": function() { 
					return _links?.typeof?.attributes?.typeof?.value
				 },
				"set": function(value) { 
					if (value) {
						if (!_links.typeof) {
							var t = document.createElement('link')
							t.setAttribute('about', this.entity)
							_node.append(t)
							_links.typeof = t
						}
						_links.typeof.setAttribute('typeof', 'kwic:'+value)
					} else {
						value = "scraps"
						if (_links.typeof)
							_links.typeof.parentNode.removeChild(_links.typeof);
					}
					_node.classList = []
					_node.classList.add('mention')
					_node.classList.add(value)
				 }
			},
			"entity": {
				"get": function() { 
					var entityName = _node?.attributes?.resource?.value
					return kwic.allEntities[entityName]
				 },
				"set": function(value) { 
					if (value) {
						_entity = value
						_node.setAttribute('resource', _entity.id)
						_node.setAttribute('property', 'kwic:mentions')
					} else {
						_node.removeAttribute('resource')
						_node.removeAttribute('property')
					}
				 }
			},
			"label": {
				"get": function() { 
					return _links?.label?.attributes?.content?.value
				 },
				"set": function(value) { 
					if (value) {
						if (!_links.label) {
							var t = document.createElement('link')
							_node.append(t)
							_links.label = t
						}
						_links.label.setAttribute('about', this.entity)
						_links.label.setAttribute('content', value)
						_links.label.setAttribute('property', 'kwic:label')					
					} else {
						if (_links.label)
							_links.label.parentNode.removeChild(_links.label);					
					}
				 }
			},
			"sort": {
				"get": function() { 
					return _links?.sort?.attributes?.content?.value
				 },
				"set": function(value) { 
					if (value) {
						if (!_links.sort) {
							var t = document.createElement('link')
							_node.append(t)
							_links.sort = t
						}
						_links.sort.setAttribute('about', this.entity)
						_links.sort.setAttribute('content', value)
						_links.sort.setAttribute('property', 'kwic:sort')
					} else {
						if (_links.sort)
							_links.sort.parentNode.removeChild(_links.sort);										
					}
				 }
			},
			"wikidataId": {
				"get": function() { 
					return _links?.wiki?.attributes?.content?.value
				 },
				"set": function(value) { 
					if (value) {
						if (!_links.wiki) {
							var t = document.createElement('link')
							_node.append(t)
							_links.wiki = t
						}
						_links.wiki.setAttribute('about', this.entity)
						_links.wiki.setAttribute('content', value)
						_links.wiki.setAttribute('property', 'kwic:wiki')
					} else {
						if (_links.wiki)
							_links.wiki.parentNode.removeChild(_links.wiki);					
					}
				 }
			}
		});

		this.node = mentions[0].node
		this.category = 
		var category = ""
		var label = ""
		var sort = ""
		var wikidataId = ""
		this.id = mentions[0].entity
		this.position = Number.MAX_VALUE
		var inners = []
		for (var i=0; i<mentions.length; i++) {
			mentions[i].entity = this.id
			category = mentions[i].category || category
			label = mentions[i].label || label
			sort = mentions[i].sort || sort
			wikidataId = mentions[i].wikidataId || wikidataId
			inners.push(mentions[i].inner)
			this.position = Math.min(this.position, mentions[i].position)
			this.mentions.push(mentions[i])
		}
		this.category = options.category || category || "scraps"
		this.label = options.label || label
		this.sort = options.sort || sort
		this.wikidataId = options.wikidataId || wikidataId
		
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
			}
			this.mentions.push(mention)
		},
		// place all mentions of a different entity into this one.
		mergeInto: function(target) {
			for (var i=0; i<this.mentions.length; i++) {
				this.mentions[i].entity = target.id
				this.mentions[i].sort = ''
				this.mentions[i].wikidataId = ''
				this.mentions[i].label = ''
				target.mentions.push(this.mentions[i])
			}
			kwic.allEntities[this.id] = null
		},
		// change a property of this entity by changing thee corresponding property of the first mention 
		change: function(field,value) {
			var done = false
			for (var i=0; i<this.mentions.length; i++) {
				if (this.mentions[i][field]) {
					this.mentions[i][field] = value
					done = true
				}
			}			
			if (!done) this.mentions[0][field] = value
		},
		// assign this entity to a different category. 
		switchTo: function(category) {
			for (var i=0; i<this.mentions.length; i++) {
				this.mentions[i].category = category
			}
			this.category = category
		},
		// assign this entity to scraps. 
		putToScraps: function(category) {
			this.switchTo('scraps')
		},
		// assign this entity to trash. 
		putToTrash: function(category) {
			this.switchTo('trash')
		}
	}

	// mentions are places in the document where entities are mentioned
	// they end up as <span class="mention category">text</span>
	this.Mention = function(nodeOrRange, options) {
		var prefix = "mention-" ;
		var _node = null
		var _entity = null
		var _links = {}
		
		Object.defineProperties(this, {
			"node": {
				"get": function() { return _node; },
				"set": function(nodeOrRange) { 
					if (!nodeOrRange) {
						_node = null; 
					} else if (nodeOrRange.nodeType == Node.ELEMENT_NODE) {
						_node = nodeOrRange	
					} else {
						if (!compatibleExtremes(nodeOrRange)) return {}
						_node = wrap(nodeOrRange,document.createElement('span'))
					}
				}
			},
			"id": {
				"get": function() { 
					return _node?.attributes?.about?.value ; 
				},
				"set": function(value) { 
					if (!value) value = getNewId(prefix)
					_node.setAttribute('about', value) 
				}
			},
			"category": {
				"get": function() { 
					return _links?.typeof?.attributes?.typeof?.value
				 },
				"set": function(value) { 
					if (value) {
						if (!_links.typeof) {
							var t = document.createElement('link')
							t.setAttribute('about', this.entity)
							_node.append(t)
							_links.typeof = t
						}
						_links.typeof.setAttribute('typeof', 'kwic:'+value)
					} else {
						value = "scraps"
						if (_links.typeof)
							_links.typeof.parentNode.removeChild(_links.typeof);
					}
					_node.classList = []
					_node.classList.add('mention')
					_node.classList.add(value)
				 }
			},
			"entity": {
				"get": function() { 
					var entityName = _node?.attributes?.resource?.value
					return kwic.allEntities[entityName]
				 },
				"set": function(value) { 
					if (value) {
						_entity = value
						_node.setAttribute('resource', _entity.id)
						_node.setAttribute('property', 'kwic:mentions')
					} else {
						_node.removeAttribute('resource')
						_node.removeAttribute('property')
					}
				 }
			},
			"label": {
				"get": function() { 
					return _links?.label?.attributes?.content?.value
				 },
				"set": function(value) { 
					if (value) {
						if (!_links.label) {
							var t = document.createElement('link')
							_node.append(t)
							_links.label = t
						}
						_links.label.setAttribute('about', this.entity)
						_links.label.setAttribute('content', value)
						_links.label.setAttribute('property', 'kwic:label')					
					} else {
						if (_links.label)
							_links.label.parentNode.removeChild(_links.label);					
					}
				 }
			},
			"sort": {
				"get": function() { 
					return _links?.sort?.attributes?.content?.value
				 },
				"set": function(value) { 
					if (value) {
						if (!_links.sort) {
							var t = document.createElement('link')
							_node.append(t)
							_links.sort = t
						}
						_links.sort.setAttribute('about', this.entity)
						_links.sort.setAttribute('content', value)
						_links.sort.setAttribute('property', 'kwic:sort')
					} else {
						if (_links.sort)
							_links.sort.parentNode.removeChild(_links.sort);										
					}
				 }
			},
			"wikidataId": {
				"get": function() { 
					return _links?.wiki?.attributes?.content?.value
				 },
				"set": function(value) { 
					if (value) {
						if (!_links.wiki) {
							var t = document.createElement('link')
							_node.append(t)
							_links.wiki = t
						}
						_links.wiki.setAttribute('about', this.entity)
						_links.wiki.setAttribute('content', value)
						_links.wiki.setAttribute('property', 'kwic:wiki')
					} else {
						if (_links.wiki)
							_links.wiki.parentNode.removeChild(_links.wiki);					
					}
				 }
			}
		});
    
    
		if (!options) options = {}         // fallback object for inizialization
		this.node = nodeOrRange

		var t = this.surroundingContent(this.node)
		this.before = t.before || ""
		this.after = t.after || ""
		this.inner = t.inner  // this will remain the exact string in the document
		
		if (!this.id) this.id = options.id || getNewId(prefix) ;
		if (!this.entity || options.force) {
			var entity = options.entity || t.inner.replace(/([^a-zA-Z0-9]+)/g,"").replace(/(^\d+)/, "entity$1")
			if (!kwic.allEntities[entity])
				kwic.allEntities[entity] = new kwic.Entity([this])
			}	
			this.entity = kwic.allEntities[entity]
		}
		if (!this.position) this.position = options.position || -1
		this.category = this.entity.category
	}
	this.Mention.prototype = {
		// identify the text before and after the mention
		surroundingContent: function() {
			var blockElements = ['P', 'DIV', 'FIGCAPTION', 'LI', 'TR', 'DD', 'BODY']
			var thisAtn = this.node.allTextNodes()
			var container = this.node.parentElement 
			while (blockElements.indexOf(container.nodeName) == -1) container = container.parentElement
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
		switchTo: function(entity) {
			this.entity = entity.id
			this.sort = ''
			this.label = ''
		},
		putToScraps: function(category) {
			this.switchTo('scraps')
		},
		putToTrash: function(category) {
			this.switchTo('trash')
		},
		unwrap: function() {
			unwrap(this.node)
		}
		
	}
	
	// static methods
	
	this.addToEditList = function(before,after) {
		this.editList.push({
			before: before,
			after: after,
			author: this.prefs.loggedUser,
			datetime: new Date().toLocaleString()
		})
	}
	this.setPrefs = function(type,value) {
		this.prefs[type] = value
	}
		
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
	
	this.organize = function() {
		var mentions = this.allMentions
		var entities = this.allEntities
		var categories = this.allCategories
		for (var i in mentions) {
			var mention = mentions[i]
			if(!entities[mention.entity]) {
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
	
	this.toHTML= function(data, tpl) {
		var content = ""
		if (!tpl.categories) tpl.categories = "{$content}"
		if (!tpl.entities) tpl.entities ="{$content}"

		var sortedCategories = this.sortCategories(data) ;
		for (var i=0; i<sortedCategories.length; i++) {
			data[sortedCategories[i]].sortEntities()
			var cat = {...data[sortedCategories[i]]}
			cat.content = ""
			cat.count = cat.entities.length; 
			for (var j=0; j<cat.entities.length; j++) {
				var ent = {...cat.entities[j]}
				ent.content = ""
				ent.count = ent.mentions.length
				ent.check = ent.wikidataId ? 'oi-check' : ''
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
	
	this.mergeData = function (sourceData, targetData) {
		if (sourceData.id !== targetData.id) {
			if (sourceData.level == 'entity' && targetData.level == 'entity') {
				var source = this.allEntities[sourceData.id]
				var target = this.allEntities[targetData.id]
				source.mergeInto(target)
			} else if (sourceData.level=='entity' && targetData.level == 'category') {
				var source = this.allEntities[sourceData.id]
				var target = this.allCategories[targetData.id]
				if (source.category !== target.id) {
					var ok = confirm('Do you want to change category of entity "{$source}" to "{$target}"?'.tpl(
						{
							source: source.label,
							target: target.label || targetData.id
						}
					))
					if (ok) {
						source.switchTo(target.id)
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
				source.switchTo(target)
			} else if (sourceData.level == 'mention' && targetData.level == 'scraps') {
				var source = this.allMentions[sourceData.id]
				source.putToScraps()
			} else if (sourceData.level == 'mention' && targetData.level == 'trash') {
				var source = this.allMentions[sourceData.id]
				source.putToTrash()
			}
		}
	}
	
	this.sortCategories = function(data) {
		return Object.keys(data).sort( (a,b) => data[a].sort - data[b].sort );
	}
	
	this.setCategories = function(data) {
		if (data.categories)
			data = data.categories
		this.categoryList = data
	}

	this.doAction = function(key, alt, shift) {
		var context = $(documentLocation)[0]
		var ret = false;
		for (var i in this.categoryList) {
			if (this.categoryList[i].letter == key) {
				var cat = this.categoryList[i]
				var sel = snapSelection(cat.type, this.prefs.extend, alt)
				if (sel) {
					if (xor(shift, this.prefs.markAll && cat.markAll)) {
						var ranges = searchAll(context, sel.toString() )
					} else {
						var ranges = [sel.getRangeAt(0)]
					}
					for (var i in ranges) {
						if (cat.action=='wrap') {
							var m = new this.Mention(ranges[i], {
								category: cat.entity
							})
							if (m.id) this.allMentions[m.id] = m
							ret = true
						}
					}
				}
			}
		}
		return ret; 
	}
	
	this.compactEntities = function(type) {
		var list = []
		for (var i in this.allEntities) {
			var e = {
				id: i,
				label: this.allEntities[i].label,
				sort: this.allEntities[i].sort,
				category: this.allEntities[i].category,
				wikidataId: this.allEntities[i].wikidataId,
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
	
	this.searchEntity = function(entityListItem) {
		var context = $(documentLocation)[0]
		entityListItem.variants.sort( (a,b) => a.length - b.length )
		for (var i=0; i<entityListItem.variants.length; i++) {
			var s = entityListItem.variants[i]
			entityListItem.force = true   // force specification of attributes in markup elements
			var ranges = searchAll(context, s)
			for (var j in ranges) {
				var m = new this.Mention(ranges[j], entityListItem)
				if (m.id) this.allMentions[m.id] = m
				entityListItem.force = false
			}		
		}
	}
	
	this.cleanAll = function() {
		this.allCategories = {}
		this.allEntities = {}
		this.allMentions = {}
	}


	this.cleanAll() ; 	
	return this	
})()