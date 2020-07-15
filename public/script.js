/*!
 * Kwic Kwoc Kwac - interface script.js 
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

// Globals

var softwareName = "Kwic Kwoc Kwac 1.0"  // the name of this release of the application

var currKey=""                           // what keyboard key is currently being pressed
var currentStyle ="KWIC"                 // the style of presentation of mentions in the left pane
var wordsAround = 5                      // the number of words before and after the mention shown in the left pane
var currentSort = 'alpha'                // the default sorting algorithm for mentions in the left pane (alpha, count and position)
var documentLocation = '#file'           // the name of the div containing the loaded document
var nullSelection = null                 // the element being selected after an action has been dealt with (i.e. a null selection)
var currentFilename = ""                 // the name of the file loaded at the moment from the "file" directory of the server
var entityList                           // the list of entities loaded from the local file through the "import entities" command
var uploadData;	                         // the information about a file ready to be uploaded throught the upload Document command	
var scrapShown;		                     // whether the Scraps pane is currently shown in the bottom left pane
var trashShown;		                     // whether the trash pane is currently shown in the bottom left pane
var editMode ;                           // whether the user can add or modify mentions in the document shown
const spinner = document.getElementById("spinner");

var expandableSelector = '.treeExpand'   // selector for expandable items in the tree in the left pane
var draggableSelector  = '.draggable'    // selector for elements that can be dragged in the left pane
var droppableSelector  = '.dropPoint'    // selector for elements that can receive dreaggable elements in thee left pane

$(document).ready(main);

/* ------------------------------------------------------------------------------ */
/*                                                                                */
/*                                SETUP                                           */
/*                                                                                */
/* ------------------------------------------------------------------------------ */

		async function main() {
			editMode = false ; 
			nullSelection = $('#file')[0]
			/* Place the caret at the beginning of the #file element. */
			var a = window.getSelection() //returns a Selection object representing the range of text selected by the user or the current position of the caret.
			a.collapse(nullSelection,0) //collapses the current selection to a single point. The document is not modified.
			kwic.setPrefs('loggedUser','Mario Rossi')  // fake login
			
			//Setting width and height of left and bottom panel, setting active class on current style and current sort
			layoutSetup() 
			
			//Onload authentication
			const loginOptions = {
				headers: {
					'Content-Type': 'application/json'
				},
				credentials: 'include'
			};

			const response = await fetch('/api/verify',loginOptions);
			const json = await response.json();
			const aut = json.editmode;

			if(aut){
				$('#Login').modal('hide'); //close modal
				
				//remove modal attributes
				$('#edit-mode').removeAttr('data-toggle'); 
				$('#edit-mode').removeAttr('data-target');

				$("#edit-mode").attr("onclick","toggleEdit()"); //togleEdit() insted of login()

				toggleEdit();
			}

			fetch('/api/list').then((res) => res.json()).then((elements) => docList(elements)).catch( () => alert('No document to show'));
			fetch('/categories.json').then((res) => res.json()).then((json) => categoriesList(json)).catch( () => alert('No category loaded'));

			// setup event callbacks
			basicCallbacks()
			editCallbacks(editMode) 
			editSetup(editMode)
		}
		
		function basicCallbacks() {
			$('#save').click(saveDoc)
			$('#entityFile').change(uploadEntityFile);			
			$('#docFile').change(uploadFileSetup);			
			$(document).on('click',              expandableSelector, treeClick)
		}

		function editCallbacks(editMode) {
			if (editMode) {     
				//on('event',where,function())
				$(document).on('keydown',   document,   onkeydown)             // keyboard event
				$(document).on('keyup',     document,   onkeyup)               // keyboard event
				$(document).on('mousedown', documentLocation,   onmousedown)   // mouse event
				$(document).on('mouseup',   documentLocation,   onmouseup)     // mouse event
				$(document).on('dragstart', draggableSelector,  dragstart)     // drag event
				$(document).on('drag',      draggableSelector,  drag)          // drag event
				$(document).on('dragover',  droppableSelector,  dragover)      // drag event
				$(document).on('dragleave', droppableSelector,  dragleave)     // drag event
				$(document).on('drop',      droppableSelector,  drop)          // drag event
			} else {
				$(document).off('keydown',   documentLocation,   onkeydown)    // keyboard event
				$(document).off('keyup',     documentLocation,   onkeyup)      // keyboard event
				$(document).off('mousedown', documentLocation,   onmousedown)  // mouse event
				$(document).off('mouseup',   documentLocation,   onmouseup)    // mouse event
				$(document).off('dragstart', draggableSelector,  dragstart)    // drag event
				$(document).off('drag',      draggableSelector,  drag)         // drag event
				$(document).off('dragover',  droppableSelector,  dragover)     // drag event
				$(document).off('dragleave', droppableSelector,  dragleave)    // drag event
				$(document).off('drop',      droppableSelector,  drop)		   // drag event
			}
		}
		
		function editSetup(editMode) {
			if (editMode) {
				// popovers appear when searching wikidata for a term matching the entity
				var popoverTitle = `
                	<span class="text-info">Matching Wikidata entries</span>
				  	<span class="button ml-auto p-1 pointer popoverHide">&times;</span>`

				$('.popoverToggle').popover({ 
					container: 'body', 
					placement: 'bottom', 
					html: true, 
					title: popoverTitle,
					content: popover
				})
				$('.entityCard').on('hide.bs.collapse',     function () {
					$('.popoverToggle').popover('hide') ;
				})
				$(document).on('click', '.popoverHide',   function () {
					$('.popoverToggle').popover('hide') ;
				})
				
				// allow drag & drop
				$(draggableSelector).attr('draggable', 'true')
				
				//show elements that need to appear only when in edit Mode
				$('.editOnly').removeClass('d-none')	
				$('#editButton').addClass('bg-primary')
				$('#file').addClass('showStyles')

			} else {
				// disallow drag & drop
				$(draggableSelector).removeAttr('draggable')			

				//hide elements that need to appear only when in edit Mode
				$('.editOnly').addClass('d-none')			
				$('#editButton').removeClass('bg-primary')
				$('#file').removeClass('showStyles')
			}
		}

		function layoutSetup() {
			setLayout('width', 4) ;
			setLayout('height', 70) ;
			setTimeout(() => {
				$('#pref-'+currentStyle).addClass('active')
				$('#pref-'+currentSort).addClass('active')		
			},200)
		}

/* ------------------------------------------------------------------------------ */
/*                                                                                */
/*                                EVENTS                                          */
/*                                                                                */
/* ------------------------------------------------------------------------------ */

		function onkeydown(event) {
			if (event.which >= 32) {
				var l = String.fromCharCode(event.which)
				currKey = l
			}
		}	
		function onkeyup(event) {
			var e = event.originalEvent || event
			doAction(currKey, e.altKey, e.shiftKey)
			currKey = "";
		}	
		function onmousedown(event) {
		}	

		function onmouseup(event) {
			var e = event.originalEvent || event
			doAction(currKey, e.altKey, e.shiftKey)
		}
		
		function showSpinner() {
			spinner.className = "show";
		  }

		function hideSpinner() {
			spinner.className = spinner.className.replace("show", "");
		}

		// Callbacks for draggable elements
		function dragstart(event) {
			var e = event.originalEvent || event //drag
			var tg = e.target.dataset.id ? e.target : e.target.parentElement
			var data = JSON.stringify(tg.dataset) 
			scrapShown = false // Irrelevant whether the scrap tab is actually shown or not. Only set to force drag handler to show it only once
			trashShown = false // Irrelevant whether the trash tab is actually shown or not. Only set to force drag handler to show it only once
			e.dataTransfer.setData("text/plain", data)
		}
		function drag(event) {
			var e = event.originalEvent || event
			var scraps = $('#bottomPane')[0].getBoundingClientRect()
			if (scraps.y - e.y < 100) {
				if (!scrapShown && e.x <= scraps.width/2) {
					scrapShown = true
					trashShown = false
					$('#scraps-realtab').tab('show')			
				} else if (!trashShown && e.x > scraps.width/2){
					trashShown = true
					scrapShown = false
					$('#trash-realtab').tab('show')							
				}
			}
			
		}
		
		// Callbacks for droppable elements
		function dragover(event) {
			event.preventDefault();
			event.stopImmediatePropagation()

			var e = event.originalEvent || event
			e.dataTransfer.dropEffect = "move"
			$(e.target).addClass('dragOver')
		}
		function dragleave(e) {
			$(e.target).removeClass('dragOver')
		}
		function drop(event) {
			event.preventDefault();
			event.stopImmediatePropagation()

			var e = event.originalEvent || event
			var tg = $(e.target).closest('[data-id]')[0];
			$(e.target).removeClass('dragEnd')
			$(e.target).removeClass('dragOver')

			var source = JSON.parse(e.dataTransfer.getData("text/plain"))
			var target = {...tg.dataset}
			kwic.mergeData(source, target)
			setupKWIC(documentLocation, true)					
			return true; 
		}
		
		
		// callback for entity tree in left pane
		function treeClick(e, callback) {
			// https://stackoverflow.com/questions/5636375/how-to-create-a-collapsing-tree-table-in-html-css-js	
			var parent = $(e.originalEvent.target).closest('.treeExpand')[0].parentElement;
			var classList = parent.classList;
			if(classList.contains("open")) {
				classList.remove('open');
				var opensubs = parent.querySelectorAll(':scope .open');
				for(var i = 0; i < opensubs.length; i++){
					opensubs[i].classList.remove('open');
				}
				$('#infoPane').html( "" )
			} else {
				classList.add('open');
				showWikidataEntity(parent)			
			}
		}

/* ------------------------------------------------------------------------------ */
/*                                                                                */
/*                                VIEW-RELATED FUNCTIONS                          */
/*                                                                                */
/* ------------------------------------------------------------------------------ */

		function setupKWIC(location, saveView) {
			if (saveView) var view = getCurrentView()
			kwic.cleanAll() 
			mentions = kwic.findMentions('.mention',location); 
			blocks = kwic.findBlocks('.block',location); //FIND ALL BLOCKS
			list = kwic.organize(mentions,blocks) //Estrapola entità e categorie dalle menzioni ordinandole in un array di array
			var c0 = kwic.toHTML(
				kwic.allCategories, 
				{
					categories: $('#categoryTpl0').html(),
				}
			) ;
			var c1 = kwic.toHTML(
				kwic.allCategories, 
				{
					mentions: $('#mentionTpl').html(),
					entities: $('#entityTpl').html(),
					categories: $('#categoryTpl1').html(),
				}
			) ;
			$('#categoryTab').html(c0)
			$('#categoryPane').html(c1)
			$('#categoryTab .nav-link').first().addClass('active')
			$('#categoryPane .tab-pane').first().addClass('active')
			$('#categoryTab').append(`
				<li class="nav-item ml-auto pointer">
					<a class="nav-link" id="help-tab" data-toggle="modal" data-target="#prefs">
						<span class="oi oi-cog" title="Open the Preferences panel" aria-hidden="true"></span> 
						<span class="sr-only">Preferences</span>
					</a>
				</li>`)
			$('#scraps-realpane').html("")
			$('#scraps-realpane').html($('#scraps-pane').html())
			$('#scraps-tab').remove()
			$('#scraps-pane').remove()
			$('#trash-realpane').html("")
			$('#trash-realpane').html($('#trash-pane').html())
			$('#trash-tab').remove()
			$('#trash-pane').remove()
			editSetup(editMode)
			if (saveView) setCurrentView(view)
		}
		
		function getCurrentView() {
			var view = {}
			if ($('#categoryTab .active').length >0) {
				view.tab = $('#categoryTab .active')[0].id
				view.pane = $('#categoryPane .active')[0].id
				view.scroll = $('#categoryPane .active')[0].scrollTop
				view.openEls = $('.entityContainer.open' ).map(function() { return this.id; }).get()
				view.openCards = $('.entityContainer .card.collapse.show' ).map(function() { return this.id; }).get()
			}
			return view
		}
		
		function setCurrentView(view) {
			if (view.tab) {
				$('#categoryTab .active').removeClass('active')
				$('#categoryPane .active').removeClass('active')
				$('#'+view.tab).addClass('active')
				$('#'+view.pane).addClass('active')
				$('#categoryPane .active').animate({ scrollTop: view.scroll }, 10) 
				view.openEls.forEach(function(i) { $('#'+i).addClass('open')})
				view.openCards.forEach(function(i) { $('#'+i).addClass('show')})
			}
		}

		function docList(list) {
			var menuItemTpl = 
				`<a class="dropdown-item" href="#" onclick='load("{$url}")'>
					{$label}
				</a>`	

			// if($('#fileMenu').children()){
			// 	$('#fileMenu').empty();
			// }

			for (var i=0; i<list.length; i++) {
				$('#fileMenu').append(  menuItemTpl.tpl(list[i]) )
			}			
		}
		
		function categoriesList(list) {
			var categoryItemTpl = `
				<button type="button" class="btn selectButton {$entity}" data-mark="{$entity}" onclick="doAction('{$letter}', event.altKey, event.shiftKey)">
					{$label} ({$letter})
				</button>`
			var categoryCssTpl = `
				.showStyles .mention.{$entity}, .selectButton.{$entity} {
					{$style}
				}
			`
			// Temporary block class to manage bibref, quote and footnote styles
			var categoryCssTpl_block = `
			.showStyles .block.{$entity}, .selectButton.{$entity} {
				{$style}
			}
		`
	
			var css = ""
			for (var i in list) {
				if (list[i].action=="wrap") {
					$('#categoriesButton').append(  categoryItemTpl.tpl(list[i]) )
					if(list[i].mention){
						css += categoryCssTpl.tpl(list[i])
					}else{
						css += categoryCssTpl_block.tpl(list[i])
					}
				}
			}			
			setStylesheet(css, 'mentionsStyles')
			kwic.setCategories(list)
			
		}

		function prefs(type, input) {
			if (type=='width') {
				setLayout('width', input)			
			} else if (type=='height') {
				setLayout('height', input)			
			} else {
				kwic.setPrefs(type,input)			
			}
			setupKWIC(documentLocation, true)
		}

		function setLayout(type, value) {
			if (type=="width") {
				var v  = {  v:    parseInt(value)} ;
				var iv = { iv: 12-parseInt(value)} ;
				$('#left')
					.removeClass( (i,c) => { return (c.match (/(col-|fs-)\S+/g)) })
					.addClass( "col-{$v} fs-{$v}".tpl(v))
				$('#right')
					.removeClass( (i,c) => { return (c.match (/(col-|fs-)\S+/g))  })
					.addClass("col-{$iv} fs-{$iv}".tpl(iv))	
			} else {
				var v  = {  v:    parseInt(value)} ;
				var iv = { iv: 100-parseInt(value)} ;
				$('#topPane')
					.removeClass( (i,c) => { return (c.match (/(h-)\S+/g)) })
					.addClass( "h-{$v}".tpl(v))
				$('#bottomPane')
					.removeClass( (i,c) => { return (c.match (/(h-)\S+/g))  })
					.addClass("h-{$iv}".tpl(iv))				
			}
		}	
		
/* ------------------------------------------------------------------------------ */
/*                                                                                */
/*                                COMMAND ACTIONS - NORMAL VIEW                   */
/*                                                                                */
/* ------------------------------------------------------------------------------ */
		
		// load and show a document
		async function load(file){
			showSpinner();
			let response = await fetch('/api/load?file='+file);
			if(!response.ok) alert('Non ho potuto caricare il file '+file);
			else {
				let content = await response.text();
				hideSpinner();

				currentFilename = file; 
				editMode = false; 
				$('#file').html(content)
				$('#file').animate({ scrollTop: 0 }, 400);			
				$('#commandList').removeClass('d-none');
				setupKWIC(documentLocation, false);
			}
		}

		// login user
		async function login(){
			
			event.preventDefault();

			let username = $('#usernameForm').val();
			let password = $('#defaultForm-pass').val();

			let data = {username,password};

			const requestOptions = {
				method: 'POST',
            	headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(data),
				credentials: 'include'
			};
			showSpinner();
			const response = await fetch("/api/login",requestOptions);
			const text = await response.text();

			if(!response.ok) $('#error').text(text);
			else{
				$('#Login').modal('hide'); //close modal

				$('#edit-mode').removeAttr('data-toggle'); //remove modal attributes
				$('#edit-mode').removeAttr('data-target');

				$("#edit-mode").attr("onclick","toggleEdit()"); //togleEdit() insted of login()

				toggleEdit();
				hideSpinner();
			}
		}

		// switch to edit Mode and back
		function toggleEdit() {
			editMode = !editMode
			editCallbacks(editMode)
			editSetup(editMode)
		}

		// switch or hide the colored display of mentions 
		function toggleStyles() {
			$('#file').toggleClass('showStyles')
			$('#styleButton').toggleClass('bg-primary')
		}

		// scroll main document to position of a mention (when clicking on a mention in the left pane)
		function goto(id) {
			var t = $(id)[0].offsetTop - 100;
			$('#file').animate({ scrollTop: t }, 400);
			$(id).addClass('animate');
			setTimeout(function(){
				$(id).removeClass('animate');
			},5000);
		}


		// download the currently loaded document to the local disk
		function downloadDoc(type) {
			var publicationTpl = `Converted into {$type} by "{$software}" on {$date} from the original source at "{$src}". ` ;
			var options = {
				title: $('#file h1').text(),
				publication: publicationTpl.tpl({
					type: type.toUpperCase(), 
					software: softwareName,
					date: new Date().toLocaleString(),
					src: $('[data-src]').data('src')
				})
			}
			if (type=='html') {
				download(currentFilename, $('#file').html(), "text/html", options)
			} else if (type=='tei') {
				saveAsXML(currentFilename, $('#file')[0], '/TEI.xsl', options)
			} else {
				alert('Download as '+type+' not implemented yet')
			}
		}

		// export all entities in the currently loaded document to the local disk
		function exportEntities(type) {
			var t = kwic.compactEntities(type)
			if (type=='JSON'){
				download('ent-'+currentFilename+'.json', t , "application/json")
			} else {
				download('ent-'+currentFilename+'.csv', t , "text/plain")
			}
		}
		
		

/* ------------------------------------------------------------------------------ */
/*                                                                                */
/*                                COMMAND ACTIONS - EDIT VIEW                     */
/*                                                                                */
/* ------------------------------------------------------------------------------ */
		// create a mention out of a selection
		function doAction(key, alt, shift) {
			sel = document.getSelection()

			if(rangeAcceptable(sel,documentLocation) ) {
				var action = kwic.doAction(key, alt, shift)

				if (action) {
					setupKWIC(documentLocation, true)
					sel.collapse(nullSelection,0)
				}
			} 
		}

		// selection completely belongs to the loaded document and is NOT the null selection
		function rangeAcceptable(sel,selector) {
			if (sel.anchorNode == nullSelection && sel.focusNode == nullSelection && sel.anchorOffset == 0 && sel.focusOffset==0) return false
			return $(sel.anchorNode).parents(selector).length == 1 && $(sel.focusNode).parents(selector).length == 1
		}

		// save the currently shown document on the remote server
		function saveDoc() {
			var data = {
				filename: currentFilename,
				content: $('#file').html(),
				editList: kwic.editList,
				type: 'html'
			}
			uploadDoc(data)
		}
		
		// save a loaded document on the remote server
		async function uploadDoc(data) {

			let requestOptions;
						
			if(data.type === 'html'){
				requestOptions = {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(data)
				};
			}else{
				requestOptions = {
					method: 'POST',
					body: data
				};
			};

			showSpinner();
			const response = await fetch('/api/upload',requestOptions);
			const text = await response.text();
			hideSpinner();

			if(text) alert(text);
		}

		// user is changing label, sort or wikidata Id
		function changeValue(field,id,value) {
			var pp = kwic.allEntities[id]
			pp.change(field,value);
			setupKWIC(documentLocation, true)			
		}
		
		// user is creating a sort value by inverting the first and the second words (e.g., SurnameFirstname)
		function invertValue(id,type,place) {
			var pp = kwic.allEntities[id]
			var sort = pp.label.split(" ")
			sort.splice(0, 0, sort.pop())
			var value = sort.join("")
			$(place).val(value)
			pp.change('sort',value);
			setupKWIC(documentLocation, true)			
		}

		// show the popover where the searched items from wikidata are shown		
		function popover() {
			// http://jsfiddle.net/wormmd/sb7bx5e4/
			var popoverTpl = `
				<li class="wikidataItem mb-1 bg-light">
					<span class="wikidataDesc" onclick="wikidataChoose('{$entity}','{$id}')"<b>{$label}</b>: 
					{$description} <br>
					<a class="wikidataLink" href="{$concepturi}" target="_blank">{$concepturi}</a>
				</li>
			`
	        var tmpId = 'popover-id-' + $.now();

			var label = this.dataset.label
			var id = this.dataset.id
			$.get("https://www.wikidata.org/w/api.php?action=wbsearchentities&origin=*&format=json&language=en&search="+label)
			 .then( (data) => {
				if (data.search.length>0) {
					var q = "<ul class='pl-3'>"
					for (var i=0; i< data.search.length; i++) {
						var d = {...data.search[i], entity	:id}
						q += popoverTpl.tpl(d,true);
					}			
					q+="</ul>"	
				} else {
					var q = `<i>No relevant items found</i>`
				}
				$('#' + tmpId).removeClass('loading spinner').html(q);
			})
			return `<div id='{$tmpId}' class='loading spinner scroll-col'></div>`.tpl({tmpId:tmpId})
		}
		
		// wikidata matching entities have arrived and are shown in the popover
		function showWikidataEntity(element) {
			var infoTpl = `
				<h3 class="wikiInfo">{$title}</h3>
				<p class="wikiInfo">{$extract}</p>`
				
			var entity = $(element).closest('[data-id]').attr('data-id')
			var e = kwic.allEntities[entity]
			if (e && e.wikidataId) {		
				$.get("https://www.wikidata.org/w/api.php?action=wbgetentities&origin=*&format=json&props=sitelinks&sitefilter=enwiki&ids="+e.wikidataId).
				then( (data) =>{
					var lang = 'en'
					var title = encodeURI(data.entities[e.wikidataId].sitelinks[lang+'wiki'].title)
					$.get("https://en.wikipedia.org/w/api.php?format=json&action=query&origin=*&prop=extracts&exintro&explaintext&redirects=1&titles="+title)
					.then((data) => {
						var keys = Object.keys(data.query.pages)
						var info = {
							title: data.query.pages[keys[0]].title,
							extract: data.query.pages[keys[0]].extract.split('\n').join('</p>\n<p class="wikiInfo">')
						}
						$('#infoPane').html( infoTpl.tpl(info) )
						$('#info-tab').tab('show')
					});
				});
			} else {
						$('#infoPane').html( "" )
			}
		
		}

		// user has chosen a specific entity from the list of matching entities from wikidata
		function wikidataChoose(entity,uri) {
			$('.popoverToggle').popover('hide')
			changeValue('wikidataId', entity, uri)
		}
		
		// Load a file containing entities and show the five most important ones. Allow importing of said entities. 
		function uploadEntityFile(evt) {
			var entityListTpl = `Found {$count} entities such as {$example}`
			var f = evt.target.files[0];
			if (f.type.match('json|text')) {
				var reader = new FileReader();
				reader.onloadend = function(e) {
					var d = e.target.result
					if (f.type.match('json')) {
						entityList = JSON.parse(d)
					} else {
						entityList = []
						var data = d.split('\n')
						var header = data.shift().split(",") ;
						var last = header.length-1
						for (var i in data) {
							var line = data[i].split(',')
							var item = {}
							for (var j=0; j<last; j++) {
								item[header[j]] = line.shift()
							}
							item[header[last]] = line
							entityList.push(item)					
						}
					}
					entityList.sort( (a,b) => b.count - a.count )
					var example = []
					for (var i=0; i<5; i++) {
						example.push(entityList[i].label + " (<i>" + entityList[i].category + "</i>)" )
					}
					$('#entityList').html( entityListTpl.tpl({
						count: entityList.length,
						example: example.join(", ")+", etc."
					}))
					$('#importEntities').prop('disabled',false)
				};
				reader.readAsText(f);
			}
		}
		
		// import entities and look for mentions of them
		function addEntities() {
			for (var i=0; i<entityList.length; i++) {
				var entity = kwic.searchEntity(entityList[i])
			}
			setupKWIC(documentLocation, true)			
		}

		// empty trash, i.e., look for all mentions of category "trash" and remove the span around them
		function emptyTrash() {
			if (confirm("You are about to empty the trash. Continue?")) {
				console.log(kwic.allMentions);
				console.log(kwic.allBlock);
				for (i in kwic.allMentions) { 
					console.log(i);
					if (kwic.allMentions[i].category == 'trash') 
						kwic.allMentions[i].unwrap()
				}
				for (i in kwic.allBlock) { 
					console.log(i);
					if (kwic.allBlock[i].category == 'trash') 
						kwic.allBlock[i].unwrap()
				}
				setupKWIC(documentLocation, true)			
			}
		}

		// Load a file containing HTML to become a new document on the server. 
		function uploadFileSetup(evt) {
			var f = evt.target.files[0];
			if (f.type.match('html|text')){
				var reader = new FileReader();
				reader.onloadend = function(e) {
					var d = e.target.result; //content
					if (validate(d)) {
						uploadData = {
							filename: f.name.replace(/\.[^/.]+$/, ""), // removes the filename extension
 							size: f.size,
							content: d,
							type: 'html'
						}
						$('#uploadFile').prop('disabled',false)
					}
				};
				reader.readAsText(f);
			};
			if (f.type.match('application/vnd.openxmlformats-officedocument.wordprocessingml.document')){
				var reader = new FileReader();
				reader.onloadend = function(e) {
					var d = e.target.result; //content
					if (validate(d)) {

						uploadData = new FormData();
						uploadData.append('filename',f.name.replace(/\.[^/.]+$/, ""));
						uploadData.append('file',f);
						uploadData.append('type','docx');

						$('#uploadFile').prop('disabled',false)
					}
				};
				reader.readAsText(f);
		};
	};

		function validate(t) {
			// Qui ci si può mettere un po' di roba per verificare che il documento sia completo, corretto, ecc. 
			// Io controllo solo che sia non vuoto
			var check = t !== ""
			return check
		}
/* ------------------------------------------------------------------------------ */
/*                                                                                */
/*                                UTILITIES                                       */
/*                                                                                */
/* ------------------------------------------------------------------------------ */
		// look for an XSLT stylesheet and convert the document into XML according to this XSLT. 
		async function saveAsXML(filename, content, styleName, options) {
			var xmlDoc = document.implementation.createDocument("", "", null);
			var clonedNode = xmlDoc.importNode(content, true);
			xmlDoc.appendChild(clonedNode);
			$.get(styleName).then(async (xsl) => {
				var domparser = new DOMParser(); 
				var doc = domparser.parseFromString('', 'text/xml')
				var xsltProcessor = new XSLTProcessor();
				xsltProcessor.importStylesheet(xsl);
				for (var i in options) {
					xsltProcessor.setParameter("", i, options[i])
				}
				var fragment = xsltProcessor.transformToFragment(clonedNode, doc);
				var xmls = new XMLSerializer()
				var content = xmls.serializeToString(fragment.firstElementChild)
				download(filename+'.xml',content,'text/xml')
			})
		}

		//  save a file in the local download folder
		function download(filename, content, format) {
			// https://ourcodeworld.com/articles/read/189/how-to-create-a-file-and-generate-a-download-with-javascript-in-the-browser-without-a-server
			var element = document.createElement('a');
			element.setAttribute('href', 'data:'+format+';charset=utf-8,' + encodeURIComponent(content));
			element.setAttribute('download', filename);

			element.style.display = 'none';
			document.body.appendChild(element);

			element.click();
			document.body.removeChild(element);
		}
	















