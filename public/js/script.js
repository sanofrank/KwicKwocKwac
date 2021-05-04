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

var currKey = ""                           // what keyboard key is currently being pressed
var currentStyle = "KWIC"                 // the style of presentation of mentions in the left pane
var wordsAround = 5                      // the number of words before and after the mention shown in the left pane
var currentSort = 'alpha'                // the default sorting algorithm for mentions in the left pane (alpha, count and position)
var documentLocation = '#file'           // the name of the div containing the loaded document
var nullSelection = null                 // the element being selected after an action has been dealt with (i.e. a null selection)
var currentFilename = ""                 // the name of the file loaded at the moment from the "file" directory of the server
var entityList                           // the list of entities loaded from the local file through the "import entities" command
var uploadHTML = [];	                 // the information about a file ready to be uploaded throught the upload Document command
var uploadDOCX = new FormData;            // the information about docx file to be uploaded through the upload Document command
var scrapShown;		                     // whether the Scraps pane is currently shown in the bottom left pane
var trashShown;		                     // whether the trash pane is currently shown in the bottom left pane
var editMode;                           // whether the user can add or modify mentions in the document shown
var apply_filter = false;                // whether filter have been applyied on search documents
var referenceMode;             			 // whether the reference panel is shown
var currentMetadata = {};				 // the metadata of the current loaded file
var loadedDocument;
const spinner = document.getElementById("spinner"); 

var expandableSelector = '.treeExpand'   // selector for expandable items in the tree in the left pane
var draggableSelector = '.draggable'    // selector for elements that can be dragged in the left pane
var referencingString = '.dblclick'
var droppableSelector = '.dropPoint'    // selector for elements that can receive dreaggable elements in thee left pane
var trashbin = '.popoverTrash'

$(document).ready(main);

/* ------------------------------------------------------------------------------ */
/*                                                                                */
/*                                SETUP                                           */
/*                                                                                */
/* ------------------------------------------------------------------------------ */

async function main() {
	loadedDocument = false;
	editMode = false;
	nullSelection = $('#file')[0]
	/* Place the caret at the beginning of the #file element. */
	var a = window.getSelection() //returns a Selection object representing the range of text selected by the user or the current position of the caret.
	a.collapse(nullSelection, 0) //collapses the current selection to a single point. The document is not modified.
	kwic.setPrefs('loggedUser', 'Mario Rossi')  // fake login
	$('#extendSel').prop('checked',false)
	kwic.setPrefs('extend',false,false)

	//Setting width and height of left and bottom panel, setting active class on current style and current sort
	layoutSetup()

	fetch('/markup/api/list',{cache: "no-store"}).then((res) => res.json()).then((elements) => docList(elements)).catch(() => alert('No document to show'));
	fetch('/markup/categories.json').then((res) => res.json()).then((json) => categoriesList(json)).catch(() => alert('No category loaded'));
	fetch('/markup/references.json').then((res) => res.json()).then((json) => referencesList(json)).catch(() => alert('No reference loaded'));

	// setup event callbacks
	basicCallbacks()
	editCallbacks(editMode)
	editSetup(editMode)
	loadedDocumentSetup(loadedDocument)
}

function basicCallbacks() {
	$('input[name="labelData"]').off()
	$('#save').click(saveDoc)
	$('#entityFiles').change(uploadEntityFile);
	$('.fileParams').change(fileParams);
	$('input[name="inlineRadioOptions"]').change(emptyUpload);
	$('#docFile').change(uploadFileSetup);
	$('#user-filter').on('keypress',function(e) {
		if(e.which == 10) {
			applyFilter();
		}
	});
	$(document).on('click', '#file-filter', e => e.stopPropagation()); //prevent closing dropdown-menu on click
	$(document).on('click', expandableSelector, treeClick)
	$(document).on('dblclick', expandableSelector, treeClickAll)
	$(document).on('dragstart', '#ulFile .dropdown-item', dragDocStart);
	$(document).on('drop', '#trash-filter', dropDoc);
}

function editCallbacks(editMode) {
	if (editMode) {
		//on('event',where,function())
		$(document).on('keydown', document, onkeydown)             // keyboard event
		$(document).on('keyup', document, onkeyup)               // keyboard event
		$(document).on('mousedown', documentLocation, onmousedown)   // mouse event
		$(document).on('mouseup', documentLocation, onmouseup)     // mouse event
		$(document).on('dragstart', draggableSelector, dragstart)     // drag event
		$(document).on('drag', draggableSelector, drag)          // drag event
		$(document).on('dragover', droppableSelector, dragover)      // drag event
		$(document).on('dragleave', droppableSelector, dragleave)     // drag event
		$(document).on('drop', droppableSelector, drop)          // drag event
		$(document).on('dblclick', referencingString, dblclick)  // doubleclick event
		$(document).on('dblclick', trashbin, emptyTrash) // fire empty trash
		//$(document).on("click", "#metadata-toggle", uploadMetadata);
	} else {
		$(document).off('keydown', documentLocation, onkeydown)    // keyboard event
		$(document).off('keyup', documentLocation, onkeyup)      // keyboard event
		$(document).off('mousedown', documentLocation, onmousedown)  // mouse event
		$(document).off('mouseup', documentLocation, onmouseup)    // mouse event
		$(document).off('dragstart', draggableSelector, dragstart)    // drag event
		$(document).off('drag', draggableSelector, drag)         // drag event
		$(document).off('dragover', droppableSelector, dragover)     // drag event
		$(document).off('dragleave', droppableSelector, dragleave)    // drag event
		$(document).off('drop', droppableSelector, drop)		   // drag event
		$(document).off('dblclick', referencingString, dblclick)  // doubleclick event
		$(document).off('dblclick', trashbin, emptyTrash) // fire empty trash
	}
}

function editSetup(editMode) {
	if (editMode) {
		//$('.popoverTrash').popover('enable')
		$('.popoverTrash').popover({
			container: 'body',
			placement: 'top',
			template : `<div class="popover trashbinPopover" role="tooltip"><div class="arrow"></div><div class="popover-body"></div></div>`,
			//html: true,
			content: 'Clicca due volte per svuotare il cestino',
			trigger: 'hover'
		})

		let popoverTreccani = `
					<div class="d-flex">
						<span class="text-info">Dizionario Biografico degli italiani</span>
						<span class="button ml-auto p-1 pointer popoverHide flex-shrink-1">&times;</span>
					</div>`
					  
		$('.popoverTreccani').popover({
			container: 'body',
			placement: 'bottom',
			title: popoverTreccani,
			html: true,
			content: `Su Wikidata non è ancora presente un Treccani ID per questa entità`, //${kwic.allEntities[entity].label}
			trigger: 'click'
		})

		// popovers appear when searching wikidata for a term matching the entity
		var popoverTitle = `
                	<span class="text-info">Corrispondenze con Wikidata</span>
				  	<span class="button ml-auto p-1 pointer popoverHide">&times;</span>`

		$('.popoverToggle').popover({
			container: 'body',
			placement: 'bottom',
			html: true,
			title: popoverTitle,
			content: popoverWiki
		})
		$('.entityCard').on('hide.bs.collapse', function () {
			$('.popoverToggle').popover('hide');
		})
		$('.citationCard').on('hide.bs.collapse', function () {
			$('.popoverToggle').popover('hide');
		})
		$(document).on('click', '.popoverHide', function () {
			$('.popoverToggle').popover('hide');
			$('.popoverTreccani').popover('hide');
		})
		$(document).on('click', function (e) {
			$('.popoverToggle').each(function () {
				// hide any open popovers when the anywhere else in the body is clicked
				if (!$(this).is(e.target) && $(this).has(e.target).length === 0 && $('.popover').has(e.target).length === 0) {
					$(this).popover('hide');
				}
			});
			$('.popoverTreccani').each(function () {
				// hide any open popovers when the anywhere else in the body is clicked
				if (!$(this).is(e.target) && $(this).has(e.target).length === 0 && $('.popover').has(e.target).length === 0) {
					$(this).popover('hide');
				}
			});
		});		

		// allow drag & drop
		$(draggableSelector).attr('draggable', 'true')
		$(".rs").addClass('dblclick')

		//show elements that need to appear only when in edit Mode
		$('.editOnly').removeClass('d-none')
		$('#editButton').addClass('bg-primary')
		$('#file').addClass('showStyles')

	} else {
		// disallow drag & drop
		$(draggableSelector).removeAttr('draggable')
		$(".rs").removeClass('dblclick')

		$('.popoverTrash').popover('dispose')

		//hide elements that need to appear only when in edit Mode
		$('.editOnly').addClass('d-none')
		$('#editButton').removeClass('bg-primary')
		$('#file').removeClass('showStyles')
	}
}

function loadedDocumentSetup(loadedDocument){
	if(loadedDocument){
		$('.loadedDocumentOnly').removeClass('d-none')
	}else{
		$('.loadedDocumentOnly').addClass('d-none')

	}
}

function layoutSetup() {
	setLayout('width', 4);
	setLayout('height', 70);
	setTimeout(() => {
		$('#pref-' + currentStyle).addClass('active')
		$('#pref-' + currentSort).addClass('active')
	}, 200)
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
	$('#spinner').show(0)
	//spinner.className = "show";
}

function hideSpinner() {
	$('#spinner').hide(0)
	//spinner.className = spinner.className.replace("show", "");
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
		if (!scrapShown && e.x <= scraps.width / 2) {
			scrapShown = true
			trashShown = false
			$('#scraps-realtab').tab('show')
		} else if (!trashShown && e.x > scraps.width / 2) {
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

	var source = JSON.parse(e.dataTransfer.getData("text/plain")) //getData from dragstart
	var target = { ...tg.dataset }
	//source and target:
	//level: "object type", id="object-id"
	if (!referenceMode) {
		kwic.mergeData(source, target)
	} else {
		kwic.mergeDataRef(source, target)
	}
	setupKWIC(documentLocation, true)
	return true;
}

//Callbacks for draggable doclist items
function dragDocStart(event) {
	var e = event.originalEvent || event //drag
	var tg = e.target;
	let val = tg.querySelector('input[name="doc-checkbox"]').getAttribute('value');
	
	let data = JSON.stringify(val)
	e.dataTransfer.setDragImage(tg,0,0); //(customImage,x.cursor,y.cursor)
	e.dataTransfer.setData('text/plain',data);
}

function dragDocOver(event) {
	event.stopPropagation();
	event.preventDefault();
	var tg = event.target.parentElement;

	$(tg).addClass('dragOver');
};

function dragDocLeave(event){
	event.stopPropagation();
	event.preventDefault();
	var tg = event.target.parentElement;

	$(tg).removeClass('dragOver');
}

function dropDoc(event) {
	event.stopPropagation();
	event.preventDefault();

	let e = event.originalEvent || event
	var tg = event.target.parentElement;

	let source = JSON.parse(e.dataTransfer.getData("text/plain")) //getData from dragstart
	
	$(tg).removeClass('dragOver');
	deleteDocuments(source);
}



function dblclick(e) {
	e.preventDefault();
	e.stopImmediatePropagation();

	let parent = $(e.target).parent();
	let id = $(parent).data('id');
	let rs = parent.hasClass('rs-active') ? true : false;

	kwic.referencingString(id, rs);
	setupKWIC(documentLocation, true);
}


// callback for entity tree in left pane
function treeClick(e, callback) {
	// https://stackoverflow.com/questions/5636375/how-to-create-a-collapsing-tree-table-in-html-css-js
	e.stopPropagation();
	e.preventDefault();

	var parent = $(e.originalEvent.target).closest('.treeExpand')[0].parentElement;

	var classList = parent.classList;
	if (classList.contains("open")) {
		classList.remove('open');
		var opensubs = parent.querySelectorAll(':scope .open');
		for (var i = 0; i < opensubs.length; i++) {
			opensubs[i].classList.remove('open');
		}
		$('#infoPane').html("")
	} else {
		classList.add('open');
		showWikidataEntity(parent)
	}
}

function toggleInfo(e,target) {
	e.stopPropagation();
	//e.preventDefault();

	let parent = $(target)[0].parentElement;

	$(target).collapse({
		toggle: false
	})

	if($(target).hasClass('show')){
		$(target).collapse('hide')
		$('#infoPane').html("")
	}else{
		$(target).collapse('show')
		showWikidataEntity(parent)
	}
}

function treeClickAll(e){
	e.stopPropagation();
	e.preventDefault();
	
	let originalClassList = e.originalEvent.target.classList; 
	if(originalClassList.contains('oi-info') || originalClassList.contains('infoButton')){
		return null;
	}

	//currentTarget the element that activates the event
	let target = $(e.currentTarget).next('.entityCard')[0] ? "#"+$(e.currentTarget).next('.entityCard')[0].id : "#"+$(e.currentTarget).next('.citationCard')[0].id; //first entity card
	let parent = $(e.currentTarget).closest('.treeExpand')[0].parentElement; 
	let classList = parent.classList

	if(!xor(classList.contains("open"),$(target).hasClass('show'))){
		treeClick(e);
		toggleInfo(e,target);
		return true;
	}

	if(classList.contains("open")) return treeClick(e)
	if($(target).hasClass('show')) return toggleInfo(e,target)
}

//Toggle bg-light class
function overTreeExpand(infoButton) {
	let span = infoButton.parentElement
	let anchor = span.parentElement

	anchor.classList.remove('bg-light')
}

function offTreeExpand(infoButton) {
	let span = infoButton.parentElement
	let anchor = span.parentElement

	anchor.classList.add('bg-light')
}
// Filter document search by character
function searchDocuments(){
	// Declare variables
	var input, filter, container, files, i, txtValue, visible = 0;
	input = document.getElementById('fileList');
	filter = input.value.toUpperCase();
	container = document.getElementById("fileMenu");
	files = container.getElementsByTagName('a');
	 
	// Loop through all list items, and hide those who don't match the search query
	for (i = 0; i < files.length; i++) {
	  label = files[i].getElementsByTagName('div')[0]; // label div
	  txtValue = label.textContent || label.innerText;
	  // If apply_filter true search only on filter values
	  if(apply_filter){
		if (txtValue.toUpperCase().indexOf(filter) > -1 && files[i].classList.contains('filter')) {
			visible++;  
			files[i].classList.remove('d-none');
			files[i].classList.add('d-flex');
		  } else {
			files[i].classList.remove('d-flex');
			files[i].classList.add('d-none');
		  }
	  }else{
		if (txtValue.toUpperCase().indexOf(filter) > -1) {
			visible++;  
			files[i].classList.remove('d-none');
			files[i].classList.add('d-flex');
		  } else {
			files[i].classList.remove('d-flex');
			files[i].classList.add('d-none');
		  }
	  }
	}

	//Document Counter 
	$('#documentCounter').text(visible)

	//resize fileMenu
	if(visible > 10){
		$('#ulFile').css("height", "26em")
	}else{
		$('#ulFile').css("height", "");
	}
		

  }


/* ------------------------------------------------------------------------------ */
/*                                                                                */
/*                                VIEW-RELATED FUNCTIONS                          */
/*                                                                                */
/* ------------------------------------------------------------------------------ */

function setupKWIC(location, saveView) {
	if (saveView) var view = getCurrentView()
	kwic.cleanAll();
	if (referenceMode) {
		quotes = kwic.findQuotes('.quote', location);
		bibref = kwic.findBibRef('.bibref', location);
		list = kwic.organizeQuotes();
		console.log(list);
		kwic.clearHeadRef(list);
		var r0 = kwic.toHTMLref(
			kwic.allReferences,
			{
				references: $('#referenceTpl0').html(),
			}
		);
		var r1 = kwic.toHTMLref(
			kwic.allReferences,
			{
				bibrefs: $('#bibrefTpl').html(),
				quotes: $('#quoteTpl').html(),
				citations: $('#citationTpl').html(),
				references: $('#referenceTpl1').html()
			}
		);
		$('#categoryTab').html(r0);
		$('#categoryPane').html(r1);
		$('#categoryTab .nav-link').first().addClass('active')
		$('#categoryPane .tab-pane').first().addClass('active')
		$('#categoryTab').append(`
					<li class="nav-item ml-auto pointer">
						<a class="nav-link" id="help-tab" data-toggle="modal" data-target="#prefs">
							<span class="oi oi-cog" title="Apri le preferenze" aria-hidden="true"></span>
							<span class="sr-only">Preferences</span>
						</a>
					</li>`)
		$('#scraps-realpane').html("")
		//Scraps num from scraps-tab tpl
		let tmpScraps = $('#scraps-tab').text();
		let scrapsNum = tmpScraps.match(/\d/g) ? tmpScraps.match(/\d/g) : '0'
		$('#scraps-realtab').text(`Scarti (${scrapsNum})`)
		$('#scraps-realpane').html($('#scraps-pane').html())
		$('#scraps-tab').remove()
		$('#scraps-pane').remove()
		$('#trash-realpane').html("")
		//Trash num from Trash-tab tpl
		let tmpTrash = $('#trash-tab').text();
		let trashNum = tmpTrash.match(/\d/g) ? tmpTrash.match(/\d/g) : '0'
		$('#trash-realtab').text(`Cestino (${trashNum})`)
		$('#trash-realpane').html($('#trash-pane').html())
		$('#trash-tab').remove()
		$('#trash-pane').remove()
		editSetup(editMode)
		if (saveView) setCurrentView(view)

	} else {		
		mentions = kwic.findMentions('.mention', location); // When a KwicKKed document get loaded
		list = kwic.organize(mentions) //Estrapola entità e categorie dalle menzioni ordinandole in un array di array
		kwic.clearHead(list);

		var c0 = kwic.toHTML(
			kwic.allCategories,
			{
				categories: $('#categoryTpl0').html(),
			}
		);
		var c1 = kwic.toHTML(
			kwic.allCategories,
			{
				mentions: $('#mentionTpl').html(),
				entities: $('#entityTpl').html(),
				categories: $('#categoryTpl1').html(),
			}
		);
		console.log(list);
		$('#categoryTab').html(c0)
		$('#categoryPane').html(c1)
		$('#categoryTab .nav-link').first().addClass('active')
		$('#categoryPane .tab-pane').first().addClass('active')
		$('#categoryTab').append(`
					<li class="nav-item ml-auto pointer">
						<a class="nav-link" id="help-tab" data-toggle="modal" data-target="#prefs">
							<span class="oi oi-cog" title="Apri le preferenze" aria-hidden="true"></span>
							<span class="sr-only">Preferences</span>
						</a>
					</li>`)
		$('#scraps-realpane').html("")
		//Scraps num from scraps-tab tpl
		let tmpScraps = $('#scraps-tab').text();
		let scrapsNum = tmpScraps.match(/\d/g) ? tmpScraps.match(/\d/g) : '0'
		$('#scraps-realtab').text(`Scarti (${scrapsNum})`)
		$('#scraps-realpane').html($('#scraps-pane').html())
		$('#scraps-tab').remove()
		$('#scraps-pane').remove()
		$('#trash-realpane').html("")
		//Trash num from Trash-tab tpl
		let tmpTrash = $('#trash-tab').text();
		let trashNum = tmpTrash.match(/\d/g) ? tmpTrash.match(/\d/g) : '0'
		$('#trash-realtab').text(`Cestino (${trashNum})`)
		$('#trash-realpane').html($('#trash-pane').html())
		$('#trash-tab').remove()
		$('#trash-pane').remove()		
		editSetup(editMode)
		if (saveView) setCurrentView(view)
	}
}

function getCurrentView() {
	var view = {}
	if ($('#categoryTab .active').length > 0) {
		view.tab = $('#categoryTab .active')[0].id
		view.pane = $('#categoryPane .active')[0].id
		view.scroll = $('#categoryPane .active')[0].scrollTop
		view.openEls = $('.entityContainer.open').map(function () { return this.id; }).get()
		view.openCards = $('.entityContainer .card.collapse.show').map(function () { return this.id; }).get()
		view.openEls_cit = $('.citationContainer.open').map(function () { return this.id; }).get()
		view.openCards_cit = $('.citationContainer .card.collapse.show').map(function () { return this.id; }).get()
	}
	return view
}

function setCurrentView(view) {
	if (view.tab) {
		$('#categoryTab .active').removeClass('active')
		$('#categoryPane .active').removeClass('active')
		$('#' + view.tab).addClass('active')
		$('#' + view.pane).addClass('active')
		$('#categoryPane .active').animate({ scrollTop: view.scroll }, 10)
		view.openEls.forEach(function (i) { $('#' + i).addClass('open') })
		view.openCards.forEach(function (i) { $('#' + i).addClass('show') })
		view.openEls_cit.forEach(function (i) { $('#' + i).addClass('open') })
		view.openCards_cit.forEach(function (i) { $('#' + i).addClass('show') })	
	}
}

function docList(elements) {

	//remove filter if not superuser
	if(!elements.su) $('#file-filter')[0].innerHTML = `
		<div class="d-flex">
			<h6 class="w-100">Filtri di ricerca</h6>
			<div class="flex-shrink-1">
			<small>Elimina i documenti selezionati <span id="checked-doc"></span></small>
			<span id="trash-filter" class="oi oi-trash" title="delete files" aria-hidden="true" ondragover="dragDocOver(event)" ondragleave="dragDocLeave(event)" ondrop="dropDoc(event)" onclick="deleteDocuments()"></span>
		</div>
		</div>
		<div class="d-flex">
			<div id="state-filter"class="w-100 p-2">
			<span class="pr-2">Marcatura:</span>
			<div class="form-check form-check-inline">
				<input class="form-check-input" type="checkbox" id="inlineRadio_default" value="default">
				<label class="form-check-label" for="inlineRadio1">Da avviare</label>
			</div>
			<div class="form-check form-check-inline">
				<input class="form-check-input" type="checkbox" id="inlineRadio_working" value="working">
				<label class="form-check-label" for="inlineRadio2">In corso</label>
			</div>
			<div class="form-check form-check-inline">
				<input class="form-check-input" type="checkbox" id="inlineRadio_done" value="done">
				<label class="form-check-label" for="inlineRadio3">Terminata</label>
			</div>
			</div>
			<div class="flex-shrink-1 p-1">
			<button id="apply-filter" type="button" class="btn btn-secondary btn-sm" onclick="applyFilter()">applica</button>
			</div>
		</div>
		<hr>
		<div class="d-inline-flex">
			<h6>Documenti: <span id="documentCounter" class ="pl-1"></span></h6>
		</div>
	`
	//empty docList if already populated and add 
	if($('#ulFile').children()) $('#ulFile')[0].innerHTML = '' 

	var menuItemTpl =
		`<a class="dropdown-item pl-2 pr-3 d-none d-flex justify-content-between align-items-center" href="#" draggable="true" onclick="load(this,'{$url}')">
		<svg  height="2em" viewBox="0 0 16 16" class="justify-content-start bi bi-dot {$stat}" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
		<path fill-rule="evenodd" d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/>
		</svg>
		<div class="flex-grow-1 pr-3 fileLabel">
		{$label}
		</div>
		<input class="document-checkbox checkbox-lg" type="checkbox" name="doc-checkbox" onclick="event.stopPropagation();updateCheckedDoc()" value="{$url}">
		<label for="doc-checkbox"></label>
		</a>`
	var menuItemTplSu =
		`			
			<a class=" dropdown-item pl-2 pr-3 d-none d-flex flex-row justify-content-between align-items-center" href="#" draggable="true" onclick="load(this,'{$url}')">
			<svg height="2em" viewBox="0 0 16 16" class="justify-content-start bi bi-dot {$stat}" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
			<path fill-rule="evenodd" d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/>
			</svg>
			<div class="flex-grow-1 pr-3 fileLabel">
			{$label}
			</div>
			<div>
			<span class="badge  border border-primary rounded text-primary">{$user}</span>
			<input class="document-checkbox checkbox-lg" type="checkbox" name="doc-checkbox" onclick="event.stopPropagation();updateCheckedDoc()" value="{$url}">
			<label for="doc-checkbox"></label>
			</div>
			</a>
		`		
	//resize fileMenu
	if(elements.list.length > 10){
		$('#ulFile').css("height", "26em")
	}else{
		$('#ulFile').css("height", "");
	}
	
	if (elements.su) {
		for (var i = 0; i < elements.list.length; i++) {
			$('#ulFile').append(menuItemTplSu.tpl(elements.list[i]))
		}
	}
	if (!elements.su) {
		for (var i = 0; i < elements.list.length; i++) {
			$('#ulFile').append(menuItemTpl.tpl(elements.list[i]))
		}
	}

	//Document Counter 
	$('#documentCounter').text(elements.list.length)

	//superuser upload edit
	if(!elements.su){
		$('#user-upload').remove(); //remove user upload choice
	}
	
	//update checked document
	updateCheckedDoc();
}

function categoriesList(list) {
	var categoryItemTpl = `
				<button type="button" class="btn selectButton {$entity}" data-mark="{$entity}" onclick="doAction('{$letter}', event.altKey, event.shiftKey)">
					{$label} ({$letter})
				</button>`
	var categoryCssTpl = `
				.showStyles .mention.{$entity}, .selectButton.{$entity}, .rs-active.{$entity}{
					{$style}
				}
			`

	var css = ""
	for (var i in list) {
		if (list[i].action == "wrap") {
			$('#categoriesButton').append(categoryItemTpl.tpl(list[i]))
			css += categoryCssTpl.tpl(list[i])
		}
	}
	setStylesheet(css, 'mentionsStyles')
	kwic.setCategories(list)

}

//Add reference list style and right panel

function referencesList(list) {

	let referenceItemTpl = `
				<button type="button" style=" white-space: nowrap;"class="btn selectButton {$entity}" data-mark="{$entity}" onclick="doAction('{$letter}',event.altKey,event.shiftKey)">
					{$label} </br> ({$letter})
				</button> `

	let referenceCssTpl = `
				.showStyles .{$entity}:not(.scraps):not(.trash), .selectButton.{$entity} {
					{$style}
				} `

	var css = "";
	for (var i in list) {
		if (list[i].action == "wrap-bib" || list[i].action == "wrap-quote") {
			$('#referencesButton').append(referenceItemTpl.tpl(list[i]));
			css += referenceCssTpl.tpl(list[i]);
		}
	}
	setStylesheet(css, 'blocksStyle');
	kwic.setReferences(list);
}

function prefs(type, input, setup=true) {
	if (type == 'width') {
		setLayout('width', input)
	} else if (type == 'height') {
		setLayout('height', input)
	} else {
		kwic.setPrefs(type, input)
	}
	if(setup) setupKWIC(documentLocation, true)
}

function setLayout(type, value) {
	if (type == "width") {
		var v = { v: parseInt(value) };
		var iv = { iv: 12 - parseInt(value) };
		$('#left')
			.removeClass((i, c) => { return (c.match(/(col-|fs-)\S+/g)) })
			.addClass("col-{$v} fs-{$v}".tpl(v))
		$('#right')
			.removeClass((i, c) => { return (c.match(/(col-|fs-)\S+/g)) })
			.addClass("col-{$iv} fs-{$iv}".tpl(iv))
	} else {
		var v = { v: parseInt(value) };
		var iv = { iv: 100 - parseInt(value) };
		$('#topPane')
			.removeClass((i, c) => { return (c.match(/(h-)\S+/g)) })
			.addClass("h-{$v}".tpl(v))
		$('#bottomPane')
			.removeClass((i, c) => { return (c.match(/(h-)\S+/g)) })
			.addClass("h-{$iv}".tpl(iv))
	}
}


/* ------------------------------------------------------------------------------ */
/*                                                                                */
/*                                COMMAND ACTIONS - NORMAL VIEW                   */
/*                                                                                */
/* ------------------------------------------------------------------------------ */

// apply filter on document search

function applyFilter() {
	// Declare variables
	let users = [], status = [], su = true, input, container, files, i, visible = 0;
	
	// collect users
	if($('#user-filter')[0]){
		let user_string = $('#user-filter').val();
		let split = user_string.split(',');

		split.forEach(user => {
			if(user!=''){
				users.push(user.trim().toUpperCase());			
			}
		})
	}else{
		su = false;
	}
	//collect status
	if($('#state-filter')){
		let	check_input = $('#state-filter .form-check-input:checked');

		for(input of check_input){
			status.push(input.value);
		}
	}
	// get all files row
	container = document.getElementById("fileMenu");
	files = container.getElementsByTagName('a');

	// Loop through all list items, and hide those who don't match the search query
	for (i = 0; i < files.length; i++) {
		//clean filter
		if(status.length > 0 || users.length > 0){ 
			files[i].classList.remove('filter');
			files[i].classList.remove('d-flex');
			files[i].classList.add('d-none');
			apply_filter = true; 
		}else{
			//display all if no filter added 
			files[i].classList.remove('filter');
			files[i].classList.add('d-flex');
			files[i].classList.remove('d-none');
			apply_filter = false;
		}

		//filter user and state check
		let user_badge = su ? files[i].getElementsByClassName('badge')[0].textContent : null; //only if super-user
		let status_svg = files[i].getElementsByTagName('svg')[0].classList; //classlist containing "default,working,done"

		if(su && users.length > 0){
			for(j in users){
				// User filter === user from file row
				if(users[j] === user_badge.trim().toUpperCase()){
					if(status.length > 0){
						for(k in status){
							// Matched user also matches document status filter
							if(status_svg.contains(status[k])){
								files[i].classList.add('filter');
								files[i].classList.add('d-flex');
								files[i].classList.remove('d-none');
								visible++;
								break;			
							}
						}
					}else{
						// No query with status filter, only user
						files[i].classList.add('filter');
						files[i].classList.add('d-flex');
						files[i].classList.remove('d-none');
						visible++;
						break;
					}
				}
			}			
		}else{
			// Query with only status filter
			if(status.length > 0){
				for(j in status){
					//if status matches
					if(status_svg.contains(status[j])){
						files[i].classList.add('filter');
						files[i].classList.add('d-flex');
						files[i].classList.remove('d-none');
						visible++;			
						break;
					}
				}
			}
		}
	}

	//Document Counter 
	let count = $('#ulFile a').not(".d-none").length
	$('#documentCounter').text(count)

	//resize fileMenu
	if(count > 10){
		$('#ulFile').css("height", "26em")
	}else{
		$('#ulFile').css("height", "");
	}
}


// load and show a document
async function load(item,file) {
	console.log(file);
	showSpinner();
	let response = await fetch("/markup/api/load?file=" + file);
	if (!response.ok){
		let text = await response.text();
		alert(text);
	} 
	else {
		loadedDocument = true;
		let json = await response.json();

		currentFilename = file;
		currentMetadata = json.metadata;
		checkMetadata();

		split = file.split('_');
		let sezione = split[1].replace(/[^0-9]+/g, "");
		let volume = split[2].replace(/[^0-9]+/g, "");
		let tomo = split[3].replace(/[^0-9]+/g, "");
		status = split[5];

		let path = (`${sezione}_${volume}_${tomo}_`);

		// ADD data path here from file splitting
		toggleEdit();
		$('#file').html(json.html);
		formattingDoc(documentLocation);
		$('#file').attr("status", status);
		$('#file').attr('data-path', path);
		setStatus(status);
		$('#file').animate({ scrollTop: 0 }, 400);
		$('#commandList').removeClass('d-none');
		$('#fileList').val(''); // clear file input search
		searchDocuments(); // repopulate file list
		$('#ulFile .selected').removeClass('selected');
		$(item).addClass('selected');
		markFootnote(documentLocation, mark = true)
		anchorGoto(documentLocation);
		showFileName(currentFilename);

		loadedDocumentSetup(loadedDocument);
		setupKWIC(documentLocation, false);
	}
	hideSpinner();
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

// modify documents without the newer onthologies
function toogleModifyOlderDocs() {
	let modify = kwic.toogleModifyOlderDocs();	
	if(modify) $('#modifyOlderDocuments').addClass('selected')
	else $('#modifyOlderDocuments').removeClass('selected')
}

// increment ID of element
function incrementID(x, y) {
	var i = 0;
	$(x).each(function () {
		i++;
		var newID = y + i;
		$(this).attr('id', newID);
		$(this).val(i);
	});
}

// add a role of the author in the "Add metadata" form
function addRole() {
	$(".role-group").append('<div class="row added-role" id="added-role" style="margin-top:10px"><div class="col-md-10"><input name="role" list="roles" class="form-control role" aria-describedby="author-role-metadata"><datalist id="roles"><option class="role-option" value="Delegato Aspirante della Gioventù Cattolica" data-value="role.01"><option class="role-option" value="Studente" data-value="role.02"><option class="role-option" value="Membro della FUCI" data-value="role.03"><option class="role-option" value="Presidente del circolo di Bari della FUCI" data-value="role.04"><option class="role-option" value="Assistente volontario alla cattedra di diritto e procedura penale" data-value="role.05"><option class="role-option" value="Presidente nazionale della FUCI" data-value="role.06"><option class="role-option" value="Professore di Filosofia del Diritto" data-value="role.07"><option class="role-option" value="Membro del Movimento Laureati dell\'Azione Cattolica" data-value="role.08"><option class="role-option" value="Membro dell\'Ufficio stampa del governo Badoglio" data-value="role.09"><option class="role-option" value="Giornalista e commentatore politico" data-value="role.10"><option class="role-option" value="Presidente del Comitato direttivo provvisorio per la FUCI meridionale" data-value="role.11"><option class="role-option" value="Segretario Centrale del Movimento Laureati dell\'Azione Cattolica" data-value="role.12"><option class="role-option" value="Direttore di "Studium"" data-value="role.13"><option class="role-option" value="Membro dell\'Assemblea Costituente" data-value="role.14"><option class="role-option" value="Vicepresidente del gruppo democristiano alla Costituente" data-value="role.15"><option class="role-option" value="Membro della Camera dei Deputati" data-value="role.16"><option class="role-option" value="Sottosegretario al ministero degli Affari Esteri con delega per l\'Emigrazione" data-value="role.17"><option class="role-option" value="Membro dell\'Unione Giuristi Cattolici" data-value="role.18"><option class="role-option" value="Membro di Iniziativa Democratica" data-value="role.19"><option class="role-option" value="Professore di diritto penale" data-value="role.20"><option class="role-option" value="Professore di diritto e procedura penale" data-value="role.21"><option class="role-option" value="Membro della Comissione parlamentare di esame del disegno di legge relativo" data-value="role.22"><option class="role-option" value="Presidente del gruppo DC alla Camera" data-value="role.23"><option class="role-option" value="Ministro di Grazia e Giustizia" data-value="role.24"><option class="role-option" value="Consigliere nazionale della DC" data-value="role.25"><option class="role-option" value="Ministro della Pubblica Istruzione" data-value="role.26"><option class="role-option" value="Segretario politico della DC" data-value="role.27"><option class="role-option" value="Presidente del Consiglio" data-value="role.28"><option class="role-option" value="Titolare ad interim del ministero degli Esteri" data-value="role.29"><option class="role-option" value="Ministero degli Esteri" data-value="role.30"><option class="role-option" value="Presidente della Commissione Affari Esteri della Camera" data-value="role.31"><option class="role-option" value="Presidente di turno della Comunità Europea" data-value="role.32"><option class="role-option" value="Presidente del Consiglio Nazionale della DC" data-value="role.33"></datalist></div><div class="col-md-2"><button style="float:right" type="button" class="btn btn-danger btn-sm" onclick="deleteAdded(this)"><i class="fa fa-minus" aria-hidden="true"></i></button></div></div>');
	incrementID(".added-role", "added-role");
}

// add a doctype section in the "Add metadata" form
function addDoctype() {
	$(".doctype-group").append('<div class="row added-doctype" id="added-doctype" style="margin-top:10px"><div class="col-md-10"><select name="doctype" class="form-control doctype" aria-describedby="doctype-metadata"><option hidden disabled selected value>Scegli una tipologia...</option><option class="doctype-option" value="doctype.01">Articolo su periodico</option><option class="doctype-option" value="doctype.02">Articolo su quotidiano</option><option class="doctype-option" value="doctype.03">Comunicato stampa</option><option class="doctype-option" value="doctype.04">Discorso in sede pubblica / Comizio</option><option class="doctype-option" value="doctype.05">Documento interno</option><option class="doctype-option" value="doctype.06">Intervento di partito</option><option class="doctype-option" value="doctype.07">Intervento in sede parlamentare</option><option class="doctype-option" value="doctype.08">Intervento istituzionale</option><option class="doctype-option" value="doctype.09">Intervento radiofonico/televisivo</option><option class="doctype-option" value="doctype.10">Intervista</option><option class="doctype-option" value="doctype.11">Lezione universitaria</option><option class="doctype-option" value="doctype.12">Libro/intervento in libro</option><option class="doctype-option" value="doctype.13">Opuscolo</option></select></div><div class="col-md-2"><button style="float:right" type="button" class="btn btn-danger btn-sm" onclick="deleteAdded(this)"><i class="fa fa-minus" aria-hidden="true"></i></button></div></div>');
	incrementID(".added-doctype", "added-doctype");
}

// add a doctype section in the "Add metadata" form
function addDoctopic() {
	$(".doctopic-group").append('<div class="row added-doctopic" id="added-doctopic" style="margin-top:10px"><div class="col-md-10"><select name="doctopic" class="form-control doctopic" aria-describedby="doctopic-metadata"><option hidden disabled selected value>Scegli una tematica...</option><option class="doctopic-option" value="doctopic.01">Chiesa</option><option class="doctopic-option" value="doctopic.02">Cultura/Istruzione</option><option class="doctopic-option" value="doctopic.03">Diritto</option><option class="doctopic-option" value="doctopic.04">Partito</option><option class="doctopic-option" value="doctopic.05">Politica interna</option><option class="doctopic-option" value="doctopic.06">Politica internazionale</option><option class="doctopic-option" value="doctopic.07">Religione</option><option class="doctopic-option" value="doctopic.08">Società</option><option class="doctopic-option" value="doctopic.09">Stato</option><option class="doctopic-option" value="doctopic.10">Vita locale</option></select></div><div class="col-md-2"><button style="float:right" type="button" class="btn btn-danger btn-sm" onclick="deleteAdded(this)"><i class="fa fa-minus" aria-hidden="true"></i></button></div></div>');
	incrementID(".added-doctopic", "added-doctopic");
}

// add a bibref source in the "Add metadata" form
function addBibsource() {
	$(".bibsource-group").append('<div class="row added-bibsource" id="added-bibsource" style="margin-top:10px"><div class="col-md-10"><input name="bibsource" class="form-control bibsource provenance" aria-describedby="bibsource-metadata"></div><div class="col-md-2"><button style="float:right" type="button" class="btn btn-danger btn-sm" onclick="deleteAdded(this)"><i class="fa fa-minus" aria-hidden="true"></i></button></div></div>');
	incrementID(".added-bibsource", "added-bibsource");
}

// add a arch source in the "Add metadata" form
function addArchsource() {
	$(".archsource-group").append('<div class="row added-archsource" id="added-archsource" style="margin-top:10px"><div class="col-md-10"><input name="archsource" class="form-control archsource provenance" aria-describedby="archsource-metadata"></div><div class="col-md-2"><button style="float:right" type="button" class="btn btn-danger btn-sm" onclick="deleteAdded(this)"><i class="fa fa-minus" aria-hidden="true"></i></button></div></div>');
	incrementID(".added-archsource", "added-archsource");
}

// delete a section in the "Add metadata" form
function deleteAdded(x) {
	var added = x.parentElement.parentElement.id;
	document.getElementById(added).remove();
}

// add an event place in the "Add metadata" form
function addEventPlace() {
	$(".event-place-group").append('<div class="row added-event-place" style="margin-top:10px"><div class="col-md-10"><input type="text" class="form-control" id="event-place" aria-describedby="event-place-metadata"></div><div class="col-md-2"><button style="float:right" type="button" class="btn btn-danger btn-sm" onclick="deleteEventPlace()"><i class="fa fa-minus" aria-hidden="true"></i></button></div></div>');
	document.getElementById("ep-button").setAttribute("hidden", true);
}

// delete an event place in the "Add metadata" form
function deleteEventPlace() {
	$(".added-event-place").remove();
	document.getElementById("ep-button").removeAttribute("hidden");
}

// add an event date in the "Add metadata" form
function addEventDate() {
	$(".event-date-group").append('<div class="row added-event-date" style="margin-top:10px"><div class="col-md-3"><input type="text" list="days" class="form-control" id="event-day" aria-describedby="event-date-metadata" placeholder="GG"><datalist id="days"><option value="1"><option value="2"><option value="3"><option value="4"><option value="5"><option value="6"><option value="7"><option value="8"><option value="9"><option value="10"><option value="11"><option value="12"><option value="13"><option value="14"><option value="15"><option value="16"><option value="17"><option value="18"><option value="19"><option value="20"><option value="21"><option value="22"><option value="23"><option value="24"><option value="25"><option value="26"><option value="27"><option value="28"><option value="29"><option value="30"><option value="31"></datalist></div><div class="col-md-3"><input type="text" list="months" class="form-control" id="event-month" aria-describedby="event-date-metadata" placeholder="MM"><datalist id="months"><option value="1">Gennaio</option><option value="2">Febbraio</option><option value="3">Marzo</option><option value="4">Aprile</option><option value="5">Maggio</option><option value="6">Giugno</option><option value="7">Luglio</option><option value="8">Agosto</option><option value="9">Settembre</option><option value="10">Ottobre</option><option value="11">Novembre</option><option value="12">Dicembre</option></datalist></div><div class="col-md-3"><input type="text" list="years" class="form-control" id="event-year" aria-describedby="event-date-metadata" placeholder="AAAA"><datalist id="years"><option value="1978"><option value="1977"><option value="1976"><option value="1975"><option value="1974"><option value="1973"><option value="1972"><option value="1971"><option value="1970"><option value="1969"><option value="1968"><option value="1967"><option value="1966"><option value="1965"><option value="1964"><option value="1963"><option value="1962"><option value="1961"><option value="1960"><option value="1959"><option value="1958"><option value="1957"><option value="1956"><option value="1955"><option value="1954"><option value="1953"><option value="1952"><option value="1951"><option value="1950"><option value="1949"><option value="1948"><option value="1947"><option value="1946"><option value="1945"><option value="1944"><option value="1943"><option value="1942"><option value="1941"><option value="1940"><option value="1939"><option value="1938"><option value="1937"><option value="1936"><option value="1935"><option value="1934"><option value="1933"><option value="1932"><option value="1931"><option value="1930"><option value="1929"><option value="1928"><option value="1927"><option value="1926"><option value="1925"><option value="1924"><option value="1923"><option value="1922"><option value="1921"><option value="1920"><option value="1919"><option value="1918"><option value="1917"><option value="1916"></datalist></div><div class="col-md-3"><button style="float:right" type="button" class="btn btn-danger btn-sm" onclick="deleteEventDate()"><i class="fa fa-minus" aria-hidden="true"></i></button></div></div>');
	document.getElementById("ed-button").setAttribute("hidden", true);
}

// delete an event date in the "Add metadata" form
function deleteEventDate() {
	$(".added-event-date").remove();
	document.getElementById("ed-button").removeAttribute("hidden");
}

// swith the place and date metadata to published/unpublished mode
function hidePublished(x) {
	if (x.checked) {
		document.getElementById("pubMetadata").setAttribute("hidden", true);
		document.getElementById("unpubMetadata").removeAttribute("hidden");
	}
}

function hideUnpublished(x) {
	if (x.checked) {
		document.getElementById("unpubMetadata").setAttribute("hidden", true);
		document.getElementById("pubMetadata").removeAttribute("hidden");
	}
}

// show references hide mentions
function showReferences() {
	if ($('#referencesButton').is(':hidden')) {
		referenceMode = true;

		$('#referencesButton').show();
		$('#categoriesButton').hide();
		setupKWIC(documentLocation, true);
	}
}

// show mentions hide references
function showMentions() {
	if ($('#categoriesButton').is(':hidden')) {
		referenceMode = false;

		$('#categoriesButton').show();
		$('#referencesButton').hide();
		setupKWIC(documentLocation, true);
	}
}

// scroll main document to position of a mention (when clicking on a mention in the left pane)
function goto(id) {
	let element = $(id)[0];

	//footnote A tag with href reference inside SUP element
	if(element.tagName == 'A') element = element.parentElement 
			
	var t = element.offsetTop - 100;
	$('#file').animate({ scrollTop: t }, 400);

	$(id).addClass('animate');
	setTimeout(function () {
		$(id).removeClass('animate');
	}, 5000);
}

// download the currently loaded document to the local disk
async function downloadDoc(type) {
	var publicationTpl = `Converted into {$type} by "{$software}" on {$date} from the original source at "{$src}". `;
	let title = splitFilename(currentFilename,"work");
	
	var options = {
		title,
		publication: publicationTpl.tpl({
			type: type.toUpperCase(),
			software: softwareName,
			date: new Date().toLocaleString(),
			src: $('[data-src]').data('src')
		})
	}
	if (type == 'html') {			
		let container = document.createElement('div')

		rdfaFormatting(container);
		enumerateParagraph(container);

		const html = container.innerHTML

		download(currentFilename, html , "text/html", options)

		// Clear container
		container.remove()

	} else if (type == 'tei') {
		let objId = splitFilename(currentFilename,'objId')

		if(!objId || objId==='undefined'){
			if (confirm('Sei sicuro di voler esportare il file in TEI senza aver aggiunto i Metadati?')) {
				saveAsXML(title, $('#file')[0], '/TEI.xsl', options)
			  }
		}else{
			//Get id for filename.xml 
			//TODO change the parameter to get all metadata and pass it through saveAsXML and then getMetadata
			//Too many server call
			let response = await fetch('/markup/api/check_metadata?objId='+objId);
			let id = await response.text();

			let filename = `${id}_${title}`;
			saveAsXML(filename, $('#file')[0], '/TEI.xsl', options)
		}
	} else {
		alert('Download as ' + type + ' not implemented yet')
	}
}

// export all entities in the currently loaded document to the local disk
function exportEntities(type) {
	var t = kwic.compactEntities(type)
	// compactCitation(type);
	if (type == 'JSON') {
		download('ent-' + currentFilename + '.json', t, "application/json")
	} else {
		download('ent-' + currentFilename + '.csv', t, "text/plain")
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

	if (rangeAcceptable(sel, documentLocation)) {
		let action = referenceMode ? kwic.doActionReference(key, alt, shift) : kwic.doAction(key, alt, shift); // If reference mode is active change action options

		if (action) {					
			setupKWIC(documentLocation, true)
			sel.collapse(nullSelection, 0)
		}
	}
}

// selection completely belongs to the loaded document and is NOT the null selection
function rangeAcceptable(sel, selector) {
	if (sel.anchorNode == nullSelection && sel.focusNode == nullSelection && sel.anchorOffset == 0 && sel.focusOffset == 0) return false
	return $(sel.anchorNode).parents(selector).length == 1 && $(sel.focusNode).parents(selector).length == 1
}

// save the currently shown document on the remote server
async function saveDoc() {

	var data = {
		filename: currentFilename,
		content: $('#file').html(),
		editList: kwic.editList,
		type: 'html'
	}

	var saveOptions = {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(data)
	};
	showSpinner();
	const response = await fetch('/markup/api/save', saveOptions)
	const text = await response.text();
	hideSpinner();
	if (text) alert(text);
}

// save a loaded document on the remote server
async function uploadDoc(dataHTML,dataDOCX) {
	// Alert box
	let msg = $('#msg-upload')

	// docx files or html files
	let format_radio = $('input[name="inlineRadioOptions"]:checked').val();

	let requestOptions;

	// User name
	let user = $('#userUpload') ? $('#userUpload').val() : '';
	// Unique sez_vol_tom path
	let sez = $('#sezNumber').val();
	let vol = $('#volNumber').val();
	let tom = $('#tomNumber').val();

	// Opera values
	let operaName = document.querySelectorAll("[id^='operaName-']")

	//Initialize filenames
	dataDOCX.set('filenames', [])

	// Get titles, if empty return error message
	for(i in operaName){
		if(operaName[i] instanceof HTMLElement){ // to avoid last loop for length element in operaName
			let title = operaName[i].value
			
			if(!title || title === ''){ 
				msg.css('display','block');
				msg.addClass('alert-danger').removeClass('alert-success');
			
				return msg.text('Tutte le opere devono avere un titolo.');
			}
			
			if(operaName.length == 1){
				dataDOCX.set('filenames',title)
				if(format_radio === "html" && dataHTML) dataHTML[i].filename = title;
			}else{
				if(format_radio === "docx" && dataDOCX) dataDOCX.append('filenames',title); //append to dataDOCX.filenames all the titles
				if(format_radio === "html" && dataHTML) dataHTML[i].filename = title; // Change title in case of changes / opera[0] index
			} 
		}
	};	

	if(format_radio === 'docx'){
		// append data info
		dataDOCX.set('type', format_radio);
		dataDOCX.set('user',user)
		dataDOCX.set("sez", sez);
		dataDOCX.set("vol", vol);
		dataDOCX.set("tom", tom);
		requestOptions = {
			method: 'POST',
			body: dataDOCX
		};	
	}
	if(format_radio === 'html'){
		// json object with store information
		let files = {};

		files.type = format_radio;
		files.user = user;
		files.sez = sez;
		files.vol = vol;
		files.tom = tom;
		files.data = dataHTML;

		requestOptions = {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(files)
		};
	}

	showSpinner();
	const response = await fetch('/markup/api/upload', requestOptions);
	const text = await response.text();
	hideSpinner();

	if(!response.ok){
		msg.css('display','block');
		msg.addClass('alert-danger').removeClass('alert-success');
			
		return msg.text(text);
	}else{
		msg.css('display','block');
		msg.addClass('alert-success').removeClass('alert-danger');
		
		fetch('/markup/api/list', {cache: "no-store"}).then((res) => res.json()).then((elements) => docList(elements)).catch(() => alert('No document to show'));

		return msg.text(text);
	}
}

function setStatus(status) {

	switch (status) {
		case "default":
			removeStatus("status");
			$("#status").addClass("default");
			$("#status").html("Da avviare");
			break
		case "working":
			removeStatus("status");
			$("#status").addClass("working");
			$("#status").html("In corso");
			break
		case "done":
			removeStatus("status");
			$("#status").addClass("done");
			$("#status").html("Terminato");
			break
	}

}

function removeStatus(status) {
	if ($(`#${status}`).hasClass("default")) $(`#${status}`).removeClass("default");
	if ($(`#${status}`).hasClass("working")) $(`#${status}`).removeClass("working");
	if ($(`#${status}`).hasClass("done")) $(`#${status}`).removeClass("done");
}

async function changeStatus() {

	let status;

	if ($("#status").hasClass("default")) status = 'working';
	if ($("#status").hasClass("working")) status = 'done';
	if ($("#status").hasClass("done")) status = 'default';

	let data = {
		file: currentFilename,
		status: status
	}

	const statusOptions = {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(data)
	}

	const response = await fetch('/markup/api/change', statusOptions);
	const text = await response.text();

	currentFilename = text;

	switch (status) {
		case 'default':
			$("#status").removeClass("done");
			$("#status").addClass("default");
			$("#status").html("Da avviare");
			break
		case 'working':
			$("#status").removeClass("default");
			$("#status").addClass("working");
			$("#status").html("In corso");
			break
		case 'done':
			$("#status").removeClass("working");
			$("#status").addClass("done");
			$("#status").html("Terminato");
			break
	}

	return fetch('/markup/api/list').then((res) => res.json()).then((elements) => docList(elements)).catch(() => alert('No document to show'));
}

// user is changing label, sort or wikidata Id
function changeValue(field, id, value) {
	var pp;

	console.log(field,id,value);
	if (!referenceMode) {		
		//if(kwic.allEntities[id]){
			pp = kwic.allEntities[id];
		//}		
		// else{
		// 	pp = kwic.allEntities.filter(entity => entity.id.formattingEntity().replace(/(^\d+)/, "entity$1").toLowerCase() == id)[0]
		// }
		console.log('PP',pp);
	} else {
		pp = kwic.allCitations[id]
		var ref = pp.reference;
	}
	pp.change(field, value, ref);
	setupKWIC(documentLocation, true)
}

// user is creating a sort value by inverting the first and the second words (e.g., SurnameFirstname)
function invertValue(id, type, place) {
	var pp = kwic.allEntities[id]
	var sort = pp.label.split(" ")
	sort.splice(0, 0, sort.pop())
	var value = sort.join("")
	$(place).val(value)
	pp.change('sort', value);
	setupKWIC(documentLocation, true)
}

function openTreccani(value){

	if(!value || value == "Non rilevato") return null

	if(value !== "{$treccaniId}"){
		window.open(`https://www.treccani.it/enciclopedia/${value}_(Dizionario-Biografico)`);
	}
}

// show the popover where the searched items from wikidata are shown
function popoverWiki() {
	// http://jsfiddle.net/wormmd/sb7bx5e4/
	var popoverTpl = `
				<li class="wikidataItem mb-1 bg-light" onclick="wikidataChoose('{$entity}','{$id}')">
					<span class="wikidataDesc"<b>{$label}</b>:
					{$description} <br>
					<a class="wikidataLink" href="{$concepturi}" target="_blank">{$concepturi}</a>
				</li>
			`
	var tmpId = 'popover-id-' + $.now();

	var label = this.dataset.label
	var id = this.dataset.id
	$.get("https://www.wikidata.org/w/api.php?action=wbsearchentities&origin=*&format=json&language=it&uselang=it&search=" + label)
		.then((data) => {
			if (data.search.length > 0) {
				var q = "<ul class='pl-3'>"
				for (var i = 0; i < data.search.length; i++) {
					var d = { ...data.search[i], entity: id }
					q += popoverTpl.tpl(d, true);
				}
				q += "</ul>"
			} else {
				var q = `<i>Nessun elemento rilevante trovato</i>`
			}
			$('#' + tmpId).removeClass('loading spinner').html(q);
		})
	return `<div id='{$tmpId}' class='loading spinner scroll-col'></div>`.tpl({ tmpId: tmpId })
}

//Treccani request https://www.wikidata.org/w/api.php?action=wbgetclaims&format=json&requestid=P854&entity=Q171834&property=P1986&callback=
// wikidata matching entities have arrived and are shown in the popover
function showWikidataEntity(element) {
	var infoTpl = `
				<h3 class="wikiInfo">{$title}</h3>
				<p class="wikiInfo">{$extract}</p>`

	var entity = $(element).closest('[data-id]').attr('data-id')
	var e = kwic.allEntities[entity]
	if (e && e.wikidataId) {
		$.get("https://www.wikidata.org/w/api.php?action=wbgetentities&origin=*&format=json&props=sitelinks&sitefilter=itwiki&ids=" + e.wikidataId).
			then((data) => {
				var lang = 'it'
				var title = encodeURI(data.entities[e.wikidataId].sitelinks[lang + 'wiki'].title)	
				$.get("https://it.wikipedia.org/w/api.php?format=json&action=query&origin=*&prop=extracts&exintro&explaintext&redirects=1&titles=" + title)
					.then((data) => {
						var keys = Object.keys(data.query.pages)
						var info = {
							title: data.query.pages[keys[0]].title,
							extract: data.query.pages[keys[0]].extract.split('\n').join('</p>\n<p class="wikiInfo">')
						}
						$('#infoPane').html(infoTpl.tpl(info))
						$('#info-tab').tab('show')
					});
			});
	} else {
		$('#infoPane').html("")
	}

}

// user has chosen a specific entity from the list of matching entities from wikidata
async function wikidataChoose(entity, uri) {
	const treccaniProp = 'P1986'

	$('.popoverToggle').popover('hide')
	changeValue('wikidataId', entity, uri)
	
	//Check for Treccani ID here
	const value = await getPropWikidata(uri,treccaniProp);
	if(!value){
		changeValue('treccaniId', entity, '')
		//$('#'+entity+' .popoverTreccani').popover('toggle')
	}else{
		changeValue('treccaniId', entity, value)
	}
}

//Check if the Wikidata item has a Treccani - Dizionario bibliografico ID
async function getPropWikidata(value,prop) {
	
	if(!value || !prop) return null;

	const response = await fetch(`https://www.wikidata.org/w/api.php?action=wbgetclaims&format=json&property=${prop}&entity=${value}&origin=*`)
	
	if(!response.ok){
		const text = response.text();
		return alert(text);
	}

	const json = await response.json();

	if(!jQuery.isEmptyObject(json.claims)){		
		const value = json.claims[prop][0].mainsnak.datavalue.value;
		return value;
	}else{
		return null
	}
}

// Load a file containing entities and show the five most important ones. Allow importing of said entities.
function uploadEntityFile(evt) {
	var entityListTpl = `Found {$count} entities such as {$example}`
	var f = evt.target.files[0];
	if (f.type.match('json|text')) {
		var reader = new FileReader();
		reader.onloadend = function (e) {
			var d = e.target.result
			if (f.type.match('json')) {
				entityList = JSON.parse(d)
			} else {
				entityList = []
				var data = d.split('\n')
				var header = data.shift().split(",");
				var last = header.length - 1
				for (var i in data) {
					var line = data[i].split(',')
					var item = {}
					for (var j = 0; j < last; j++) {
						item[header[j]] = line.shift()
					}
					item[header[last]] = line
					entityList.push(item)
				}
			}
			entityList.sort((a, b) => b.count - a.count)
			var example = []
			for (var i = 0; i < 5; i++) {
				example.push(entityList[i].label + " (<i>" + entityList[i].category + "</i>)")
			}
			$('#entityList').html(entityListTpl.tpl({
				count: entityList.length,
				example: example.join(", ") + ", etc."
			}))
			$('#importEntities').prop('disabled', false)
		};
		reader.readAsText(f);
	}
}

// import entities and look for mentions of them
function addEntities() {
	for (var i = 0; i < entityList.length; i++) {
		var entity = kwic.searchEntity(entityList[i])
	}
	setupKWIC(documentLocation, true)
}

// empty trash, i.e., look for all mentions of category "trash" and remove the span around them
function emptyTrash() {
	if (confirm("Stai per svuotare il cestino. Vuoi continuare?")) {
		for (i in kwic.allMentions) {
			if (kwic.allMentions[i].category == 'trash')
				kwic.allMentions[i].unwrap()
		}
		for (i in kwic.allQuotes) {
			if (kwic.allQuotes[i].reference == 'trash')
				kwic.allQuotes[i].unwrap()
		}
		for (i in kwic.allBibRef) {
			if (kwic.allBibRef[i].reference == 'trash')
				kwic.allBibRef[i].unwrap()
		}
		setupKWIC(documentLocation, true)
	}
}

// Enable file selection when sez,tom,vol and format are selected
function fileParams() {

	var vol = $('#volNumber').val();
	var tom = $('#tomNumber').val();
	var sez = $('#sezNumber').val();
	let format_radio = $('input[name="inlineRadioOptions"]:checked').val();
	
	if (sez != '' && vol != '' && tom != '' && format_radio) {
		if(format_radio === "html") $('#docFile').prop('accept', ".html")
		if(format_radio === "docx") $('#docFile').prop('accept', ".docx")

		$('#docFile').prop('disabled', false)
	}
}

// Update checked document number
function updateCheckedDoc() {

	let checked = 0;

	let checkbox = $('#ulFile input[name="doc-checkbox"]:checked');
	checked = checkbox.length;

	$('#checked-doc').text(checked);
}

// Delete documents

async function deleteDocuments(value = null) {
	
	let val = [];

	if(value == null){

		let checkboxes = $('#ulFile input[name="doc-checkbox"]:checked');

		for(checkbox of checkboxes){
			val.push(checkbox.getAttribute('value'))
			}
		}else{
			val.push(value);
		}
	
	if(val.length <= 0){
		return null			
		}

	if(confirm(`Sicuro di voler eliminare i file selezionati?\nRicordati prima di salvare le modifiche se hai un file aperto.`)){
		const deleteOptions = {
			method: 'POST',
			headers: {
				'Content-Type' : 'application/json'
			},
			body: JSON.stringify(val)
		}
		
		const response = await fetch('/markup/api/delete',deleteOptions);
		const text = await response.text();
		alert(text);
		if(response.ok){
			location.reload();
		}
	}else{
		return null
	}
}

// Empty list when the format is changed
function emptyUpload(){
	
	let doc_list = $('#doc-list');
	let list = $('#doc-list li');

	// Empty every data if there have been some changes
	if(list.length != 0){
		doc_list[0].innerHTML = '' //remove all files
		uploadHTML = []; // empty html array
		uploadDOCX = new FormData(); // empty docx formdata
		$('#docFile').val(''); //empty docFile input
		doc_list[0].style.height = '' //resize ul list

	}
}

// Load a file containing HTML to become a new document on the server.
function uploadFileSetup(evt) {
	
	var f;
	let doc_list = $('#doc-list');
	let list = $('#doc-list li');
	
	// Empty every data if there have been some changes
	if(list.length != 0 || evt.target.files.length == 0){
		doc_list[0].innerHTML = '' //remove all files
		uploadHTML = []; // empty html array
		uploadDOCX = new FormData(); // empty docx formdata		
		//$('#docFile').val(''); //empty docFile input
	}

	doc_list[0].innerText = 'Inserisci un titolo per ogni documento' // TODO Da spostare all'interno del DIV

	// Resize ul list if too many documents
	if(evt.target.files.length > 6){
		doc_list[0].style.height = '20em'; 
	}else{
		doc_list[0].style.height = '';
	}

	for(let i = 0; i < evt.target.files.length; i++){
		let file = evt.target.files[i]
		
		//Populate HTML list
		let li = document.createElement('li');
		let label = document.createElement('label');
		let input = document.createElement('input');

		li.classList.add('list-group-item')

		label.setAttribute('for',`operaName-${i}`)
		label.style.marginRight = '1em'
		label.innerText = 'Titolo';
		
		input.setAttribute('type','text');
		input.style.width = '85%';
		input.setAttribute('id',`operaName-${i}`);
		input.setAttribute('name',`operaName-${i}`)
		input.value = file.name.replace(/\.[^/.]+$/, "");
		input.required = true;
		
		li.appendChild(label);
		li.appendChild(input);

		doc_list.append(li);
		
		//File information
		if (file.type.match('html|text')) {
			var reader = new FileReader();
			reader.onloadend = function (e) {
				var d = e.target.result; //content
				if (validate(d)) {
					f = {
						filename: file.name.replace(/\.[^/.]+$/, ""), // removes the filename extension
						size: file.size,
						content: d,
						type: 'html'
					}
					uploadHTML.push(f);
				}
			};
			reader.readAsText(file);
		};

		if (file.type.match('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
			var reader = new FileReader();
			reader.onloadend = function (e) {
				var d = e.target.result; //content
				if (validate(d)) {
					uploadDOCX.append('file', file, file.name.replace(/\.[^/.]+$/, "") ); //Append file to formdata
				}				
			};
			reader.readAsText(file);
		};
	}

	$('#uploadFile').prop('disabled', false)
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

// Formatting document adding style elements
async function formattingDoc(location){
	
	//Format abstract
	let file = $('#bodyFile').length ? $('#bodyFile')[0] : $(location)[0];
	let child = file.childNodes[1];

	if(!child || !child.firstElementChild) return null;

	if(child.firstElementChild.tagName === 'EM'){
		if(!child.classList.contains('no-abstract')){
			let abstract = child.innerText;

			if(window.confirm(`È stata rilevata l'introduzione:\n${abstract}\nSi desidera spostarla all'interno dell'abstract dei metadati?`)){
				//Add abstract to metadata field
				$('#abstract')[0].innerText = abstract;
				//Add default saved filename as title
				let title = splitFilename(currentFilename,'work');

				let data = {
					file : currentFilename,
					abstract,
					title
				}

				const requestOptions = {
					method: 'POST',
					headers: {
						'Content-Type' : 'application/json'
					},
					body: JSON.stringify(data)
				}
				//Save only abstract without other options
				let metadata = await fetch('/markup/api/save_abstract',requestOptions);
				let json = await metadata.json();
				currentFilename = json.fileName;
				//Remove abstract from file and save document
				file.removeChild(child);
				saveDoc()
				//Reload doclist
				let update = await fetch('/markup/api/list').then((res) => res.json()).then((elements) => docList(elements)).catch(() => alert('No document to show'));
				//Change save button behaviour 
				$('#save-metadata').text('Aggiorna');
				$('#save-metadata').attr('onclick','saveMetadata(true)')
			}else{
				child.classList.add('no-abstract')
			}
		}
	}

}

// Changes href animation scrolling
function anchorGoto(location){

	document.querySelectorAll(`${location} a[href^="#"]`).forEach(anchor => {
		anchor.addEventListener('click', (e) => {
			e.preventDefault();

			let id = anchor.getAttribute('href');
			goto(id);
			
		})
	});
}

// Show current file name on navbar
function showFileName(fileName) {

	let sez = splitFilename(fileName,'section');
	let vol = splitFilename(fileName,'volume');
	let tom = splitFilename(fileName,'tome');
	let work = splitFilename(fileName,'work');

	let newTitle = `S${sez} V${vol} T${tom} "${work}"`;

	$('#fileNameNav span').prop('title',newTitle);

	if(work.length > 23){
		work = work.substring(0,23).concat('...');
		newTitle = `S${sez} V${vol} T${tom} "${work}"`
	} 
	
	$('#fileNameNav span').text(newTitle);
}

// Mark curator note and author note
function markFootnote(location, mark){

	if($('#moroNotes').length && $('#moroNotes').attr('data-alert') == 'true'){
		$('[data-toggle="tooltip"]').tooltip();
		$('#moroNotes').attr('data-alert','false')
		let moroNotes_length = $('#moroNotes').children().length

		let alert_footnote = `<p id="alert-count">Sono state marcate automaticamente ${moroNotes_length} note di Aldo Moro</p>`
		$('#footnote-alert').prepend(alert_footnote);
		$("#footnote-alert").fadeTo(3500, 500).slideUp(500, function () {
			$("#footnote-alert").slideUp(500, function(){
				$("#alert-count").remove();
			});
		});
	}
}

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
		var fragmentWithMeta = await getMetadata(fragment, doc)
		var xmls = new XMLSerializer()
		var content = xmls.serializeToString(fragmentWithMeta.firstElementChild)
		download(filename + '.xml', content, 'text/xml')
	}).catch((err) => console.log("ERROR on get(styleName)",err));
}

async function getMetadata(fragment, doc) {

	let id = splitFilename(currentFilename,'objId');
	
	//if empty object.
	if(!id || id === "undefined"){
		return fragment;
	}
	
	const getIdOptions = {
		headers: { 'Content-type': 'application/json' }
	}

	let response = await fetch("/markup/api/getId?id=" + id, getIdOptions);
	const json = await response.json();

	fragment.querySelector('idno').textContent = json.ident
	fragment.querySelector('author').textContent = json.author
	fragment.querySelector('author').setAttribute('role', (json.roleList).toString().replace(/,/g, ' '))
	fragment.querySelector('principal').textContent = json.curator
	fragment.querySelector('abstract').textContent = json.abstract

	fragment.querySelectorAll('catRef')[0].setAttribute('target', (json.doctypeList).toString().replace(/,/g, ' '))
	doctypes = fragment.querySelectorAll('catRef')[0].getAttribute('target')
	referred_doctypes = []
	split_doctypes = doctypes.split(' ')
	split_doctypes.forEach((doctype) => {
		doctype = "#" + doctype
		referred_doctypes.push(doctype)
	})
	fragment.querySelectorAll('catRef')[0].setAttribute('target', referred_doctypes.join(" "))

	fragment.querySelectorAll('catRef')[1].setAttribute('target', (json.doctopicList).toString().replace(/,/g, ' '))
	doctopics = fragment.querySelectorAll('catRef')[1].getAttribute('target')
	referred_doctopics = []
	split_doctopics = doctopics.split(' ')
	split_doctopics.forEach((doctopic) => {
		doctopic = "#" + doctopic
		referred_doctopics.push(doctopic)
	})
	
	fragment.querySelectorAll('catRef')[1].setAttribute('target', referred_doctopics.join(" "))
	fragment.querySelector('revisionDesc').setAttribute('status', json.docstatus)

	if (json.provenance.length > 0) {
		json.provenance.forEach((prov) => {
			let p = doc.createElementNS("http://www.tei-c.org/ns/1.0", "p");
			let textNode = doc.createTextNode(prov)
			p.appendChild(textNode);
			let list = fragment.querySelector('list')
			list.appendChild(p)
		})
	} 

	if (json.eventDate != undefined && json.eventPlace != undefined) {
		let evDate = doc.createElementNS("http://www.tei-c.org/ns/1.0", "date");
		let evPlace = doc.createElementNS("http://www.tei-c.org/ns/1.0", "placeName")
		let textNoteDate = doc.createTextNode(json.eventDate)
		let textNotePlace = doc.createTextNode(json.eventPlace)
		evDate.appendChild(textNoteDate)
		evPlace.appendChild(textNotePlace)
		fragment.querySelector('creation').appendChild(evPlace)
		fragment.querySelector('creation').appendChild(evDate)
	} else if (json.eventDate != undefined) {
		let evDate = doc.createElementNS("http://www.tei-c.org/ns/1.0", "date");
		let textNoteDate = doc.createTextNode(json.eventDate)
		evDate.appendChild(textNoteDate)
		fragment.querySelector('creation').appendChild(evDate)
	} else if (json.eventPlace != undefined) {
		let evPlace = doc.createElementNS("http://www.tei-c.org/ns/1.0", "placeName")
		let textNotePlace = doc.createTextNode(json.eventPlace)
		evPlace.appendChild(textNotePlace)
		fragment.querySelector('creation').appendChild(evPlace)
	}

	return fragment
}

// Append mention in "head" and check if exist any altLabel for every mentionable entities if true create meta and append
function appendMeta(head,meta,property) {
	
	meta.each(function () {
		let newLabel = []
		head.appendChild(this);					

		if(property && this.attributes.item(1).value == property){
			let about = this.attributes.getNamedItem('about').value	// get reference property, sort of 'id'
			let label = this.attributes.getNamedItem('content').value // get property content

			$(`#bodyFile span[resource='${about}']`).each( function () {
				if(this.innerText.toUpperCase() != label.toUpperCase() && !newLabel.includes(this.innerText)){
					let newMeta = document.createElement('meta');

					newMeta.setAttribute('about',about)
					newMeta.setAttribute('property','moro:altLabel') // new property to define different attribute
					newMeta.setAttribute('content',this.innerText)

					head.appendChild(newMeta)
					newLabel.push(this.innerText)
				} 
			})
		}
	})

}

// Replace div haedFile and bodyFIle with "head" and "body" pushing entities inside "head"
function rdfaFormatting(container) {	
	// CREATE STRUCTURE
	let fileFragment = new DocumentFragment();	
	let html = document.createElement('html')
	let head = document.createElement('head')
	let body = document.createElement('body')

	// HEAD
	let mentionMeta = $('#mentionMeta').clone().children()
	let referenceMeta = $('#referenceMeta').clone().children()
	let footnoteMeta = $('#footnoteMeta').clone().children()

	if(mentionMeta) 	appendMeta(head,mentionMeta,'rdfs:label')	
	if(referenceMeta)	appendMeta(head,referenceMeta)
	if(footnoteMeta)	appendMeta(head,footnoteMeta)

	// BODY
	let bodyDocument = $('#bodyFile').html()

	if(bodyDocument) 
		body.innerHTML = bodyDocument			
	else
		body.innerHTML = $('#file').html()

	// APPEND TO DOCUMENT FRAGMENT
	fileFragment.appendChild(html)
	fileFragment.firstElementChild.appendChild(head);
	fileFragment.firstElementChild.appendChild(body);
	
	// APPEND TO CONTAINER 
	container.appendChild(fileFragment);

}

function enumerateParagraph(container) {
	// Get each paragraph that are directly child of the body
	let counter = 1

	container.querySelectorAll('body > p').forEach( p => {		
		if(p.childNodes.length > 1 || p.firstChild.nodeType == Node.TEXT_NODE){
			if(p.innerText.trim() !== 'ALDO MORO'){
				p.setAttribute('id',`p-${counter}`)
				p.setAttribute('class','paragraph')
				p.setAttribute(`data-counter`,counter)

				counter += 1 // increment counter
			}			
		}		
	})
}

// save a file in the local download folder
function download(filename, content, format) {
	// https://ourcodeworld.com/articles/read/189/how-to-create-a-file-and-generate-a-download-with-javascript-in-the-browser-without-a-server
	var element = document.createElement('a');
	element.setAttribute('href', 'data:' + format + ';charset=utf-8,' + encodeURIComponent(content));
	element.setAttribute('download', filename);
	
	element.style.display = 'none';
	document.body.appendChild(element);

	element.click();
	document.body.removeChild(element);
}

/* ------------------------------------------------------------------------------ */
/*                                                                                */
/*                                METADATA                                        */
/*                                                                                */
/* ------------------------------------------------------------------------------ */

function fillForm(data,id,addFunction, value, datalist = false){
	//value field
	if(value){
		//array of values 
		if(typeof data === 'object'){
			for(let i = 0; i < data.length; i++){
				if(i == 0){
					//class input selector
					let selector = `.${id}`;
					let input = document.querySelector(selector);
					input.setAttribute('value',data[i]);
				}else{
					addFunction();
					//added ID input
					let added_selector = `#added-${id}${i} input`
					let added_inputs = document.querySelector(added_selector);
					added_inputs.setAttribute('value',data[i]);
				}
			}
		}else{ //single value e.g. date metadata
			if(addFunction) addFunction();
			let value_selector = `#${id}`
			let input = document.querySelector(value_selector);
			input.setAttribute('value',data);
		}
	}else{
		// datalist options
		if(datalist){
			for(let i = 0; i < data.length; i++){
				if(i == 0){
					let selector = `.${id}-option`;
					let options = document.querySelectorAll(selector); //datalist options

					options.forEach(option => {
						if(data[i] === option.getAttribute('data-value')){	//check option data-value e.g. role.01,role.02,role.03,... equal to saved data
							let input = document.querySelector(`input[name='${id}']`);
							let value = option.getAttribute('value');
							
							input.setAttribute('value',value); //set input value attribute equal to option matched value 
						}
					})
				}else{
					//data.length > 1
					addFunction();
					let added_selector = `#added-${id}${i} option`;
					let added_options = document.querySelectorAll(added_selector);

					added_options.forEach(added_option => {
						if(data[i] === added_option.getAttribute('data-value')){
							let input = document.querySelector(`#added-${id}${i} input`);
							let value = added_option.getAttribute('value');
							
							input.setAttribute('value',value);
						}
					})
				}
			}
		}else{
			//select option HTML element 
			for(let i = 0; i < data.length; i++){
				if(i == 0){
					let selector = `#${id} option`;
					let inputs = document.querySelectorAll(selector);
					inputs.forEach(input => {
						if(data[i] === input.getAttribute('value')) input.setAttribute('selected','select');
					})
				}else{
					addFunction();
					let added_selector = `#added-${id}${i} option`
					let added_inputs = document.querySelectorAll(added_selector);
					added_inputs.forEach(added_input => {
						if(data[i] === added_input.getAttribute('value')) added_input.setAttribute('selected','select');
					})
				}			
			}
		}
	}
}

async function checkMetadata(){
	//Remove previous metadata form if exist
	if($('#add-metadata .modal-dialog')){
		$('#add-metadata .modal-dialog').remove()
	}
	
	let fileName = splitFilename(currentFilename,'work');
	let user = splitFilename(currentFilename,'user');

	let header = `Metadati del documento "${fileName}"`;

	if(isEmptyObject(currentMetadata)){
		//Passing empty object to tpl function and remove all {$} variables
		let form = $('#metadataTpl').html();
		let newForm = form.tpl(currentMetadata,true);

		
		//Append new empty form
		$('#add-metadata').append(newForm);
		$('#add-metadata #addMetadata-sub').text(header);
		$('#add-metadata #work-title').val(fileName);
		$('#add-metadata #curator').val(user);
	}else{
		//Extract ident
		let ident = currentMetadata.ident;
		let split = ident.split('_');
		currentMetadata.ident = split[3];
		
		
		//Create new form from template and add single value field parsing
		let string = $('#metadataTpl').html();
		let newForm = string.tpl(currentMetadata);

		//Append new form
		$('#add-metadata').append(newForm);
		$('#add-metadata #addMetadata-sub').text(header);

		//Required fields array
		if(currentMetadata.roleList.length > 0) fillForm(currentMetadata.roleList,"role",addRole,false,true);
		if(currentMetadata.doctypeList.length > 0) fillForm(currentMetadata.doctypeList,"doctype",addDoctype,false);
		if(currentMetadata.doctopicList.length > 0) fillForm(currentMetadata.doctopicList,"doctopic",addDoctopic,false);
		if(currentMetadata.eventPlace) fillForm(currentMetadata.eventPlace,"event-place",addEventPlace,true);
		if(currentMetadata.eventDate) {
			//split date and manage single field
			let split_date = currentMetadata.eventDate.split('-');
			let year = split_date[0];
			let month = split_date[1];
			let day = split_date[2];
			
			addEventDate();
			if(year) fillForm(year,'event-year',null,true)
			if(month) fillForm(month,'event-month',null,true)
			if(day) fillForm(day,'event-day',null,true)
		}
		
		//Provenance value object
		switch (currentMetadata.docstatus) {
			case "published":
				let pub = $('#inlineRadio1');
				pub.prop("checked", true);
				hideUnpublished(pub[0]);

				fillForm(currentMetadata.provenance,"bibsource",addBibsource,true)
				break;
			case "unpublished":
				let unpub = $('#inlineRadio2');
				unpub.prop("checked", true);
				hidePublished(unpub[0]);

				fillForm(currentMetadata.provenance,"archsource",addArchsource,true)
				break;
			default:
				break;
		}

		$('#save-metadata').text('Aggiorna');
		$('#save-metadata').attr('onclick','saveMetadata(true)')
	}
}

async function saveMetadata(update = false) {

	let objId = ""
	if(update) objId = splitFilename(currentFilename,"objId");

	let file = currentFilename;
	let n = $('#ident').val();
	let ident = $('div#file').attr('data-path') + n
	let author = "Aldo Moro";

	var role = [];
	let value = $('input.role').map((_, el) => el.value).get();
	value.forEach(val => {
		let r = $('.role-option').filter(function() {return this.value == val}).data('value');
		role.push(r)
	})

	let title = $('#work-title').val();
	let curator = $('#curator').val();
	let abstract = $('#abstract').val();
	let doctype = $('select.doctype').map((_, el) => el.value).get();
	let doctopic = $('select.doctopic').map((_, el) => el.value).get();
	let docstatus = $('input[type=radio][name=docstatus]:checked').val();
	
	let provenance;
	switch(docstatus) {
		case "unpublished" :
			provenance = $('.archsource').map((_, el) => el.value).get();
			break;
		case "published":
			provenance = $('.bibsource').map((_, el) => el.value).get();
			break;
		default:
			provenance = undefined; 
	}

	let eventPlace = $('#event-place').val();

	let year = $("#event-year").val()
	let month = $("#event-month").val()
	let day = $("#event-day").val()
	let eventDate;
	if(year || month || day) eventDate = `${year}-${month}-${day}`;

	let additionalNotes = $('#additional-notes').val();

	let data = { 
		objId, file, title, ident, author, role, curator, abstract, doctype, doctopic, docstatus, provenance, eventPlace, year, month, day, eventDate, additionalNotes 
	};

	const requestOptions = {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(data),
	};

	//showSpinner();
	let response, text, json;
	let msg = $('#msg');

	if(update){
		response = await fetch("/markup/api/update_metadata",requestOptions);
		text = await response.text();
		msg.text(text);
	}else{
		response = await fetch("/markup/api/save_metadata", requestOptions);
		json = await response.json();
		msg.text(json.msg);
	}

	if(!response.ok){		
		msg.css('display','block');
		msg.addClass('alert-danger').removeClass('alert-success');
		$('#add-metadata').animate({ scrollTop: msg }, 400);
	} else{
		if(!update) currentFilename = json.fileName;

		msg.css('display','block');
		msg.addClass('alert-success').removeClass('alert-danger');
		$('#add-metadata').animate({ scrollTop: msg }, 400);
		}

}

