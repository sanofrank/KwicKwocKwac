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
var uploadData;	                         // the information about a file ready to be uploaded throught the upload Document command	
var scrapShown;		                     // whether the Scraps pane is currently shown in the bottom left pane
var trashShown;		                     // whether the trash pane is currently shown in the bottom left pane
var editMode;                           // whether the user can add or modify mentions in the document shown
var referenceMode;             			 // whether the reference panel is shown
const spinner = document.getElementById("spinner");

var expandableSelector = '.treeExpand'   // selector for expandable items in the tree in the left pane
var draggableSelector = '.draggable'    // selector for elements that can be dragged in the left pane
var referencingString = '.dblclick'
var droppableSelector = '.dropPoint'    // selector for elements that can receive dreaggable elements in thee left pane

$(document).ready(main);

/* ------------------------------------------------------------------------------ */
/*                                                                                */
/*                                SETUP                                           */
/*                                                                                */
/* ------------------------------------------------------------------------------ */

async function main() {
	editMode = false;
	nullSelection = $('#file')[0]
	/* Place the caret at the beginning of the #file element. */
	var a = window.getSelection() //returns a Selection object representing the range of text selected by the user or the current position of the caret.
	a.collapse(nullSelection, 0) //collapses the current selection to a single point. The document is not modified.
	kwic.setPrefs('loggedUser', 'Mario Rossi')  // fake login

	//Setting width and height of left and bottom panel, setting active class on current style and current sort
	layoutSetup()

	//Onload authentication
	const loginOptions = {
		headers: {
			'Content-Type': 'application/json'
		},
		credentials: 'include'
	};

	const response = await fetch('/api/verify', loginOptions);
	const json = await response.json();
	const aut = json.editmode;

	if (aut) {
		$('#Login').modal('hide'); //close modal

		//remove modal attributes
		$('#edit-mode').removeAttr('data-toggle');
		$('#edit-mode').removeAttr('data-target');

		$("#edit-mode").attr("onclick", "toggleEdit()"); //togleEdit() insted of login()

		toggleEdit();
	}

	fetch('/api/list').then((res) => res.json()).then((elements) => docList(elements)).catch(() => alert('No document to show'));
	fetch('/categories.json').then((res) => res.json()).then((json) => categoriesList(json)).catch(() => alert('No category loaded'));
	fetch('/references.json').then((res) => res.json()).then((json) => referencesList(json)).catch(() => alert('No reference loaded'));

	// setup event callbacks
	basicCallbacks()
	editCallbacks(editMode)
	editSetup(editMode)
}

function basicCallbacks() {
	$('#save').click(saveDoc)
	$('#entityFile').change(uploadEntityFile);
	$('#fileParams').change(fileParams);
	$('#docFile').change(uploadFileSetup);
	$(document).on('click', expandableSelector, treeClick)
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
		})

		// $('.popoverToggle-mentions').popover({
		// 	container: 'body',
		// 	placement: 'right',
		// 	html: true,
		// 	title: `<span class="text-info">{$label}</span>`,
		// 	content: popoverMention
		// })

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

		//hide elements that need to appear only when in edit Mode
		$('.editOnly').addClass('d-none')
		$('#editButton').removeClass('bg-primary')
		$('#file').removeClass('showStyles')
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
	console.log("source,target", source, target);
	if (!referenceMode) {
		kwic.mergeData(source, target)
	} else {
		kwic.mergeDataRef(source, target)
	}
	setupKWIC(documentLocation, true)
	return true;
}

function dblclick(e) {
	e.preventDefault();
	e.stopImmediatePropagation();

	let parent = $(e.target).parent();
	let id = $(parent).data('id');
	let rs;

	parent.hasClass('rs-active') ? rs = true : rs = false;

	kwic.referencingString(id, rs);
	setupKWIC(documentLocation, true);
}


// callback for entity tree in left pane
function treeClick(e, callback) {
	// https://stackoverflow.com/questions/5636375/how-to-create-a-collapsing-tree-table-in-html-css-js	
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
		console.log("LISt", list);
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

	} else {
		mentions = kwic.findMentions('.mention', location);
		//blocks = kwic.findBlocks('.block',location); //FIND ALL BLOCKS
		list = kwic.organize(mentions) //Estrapola entità e categorie dalle menzioni ordinandole in un array di array
		console.log(list);
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
}

function getCurrentView() {
	var view = {}
	if ($('#categoryTab .active').length > 0) {
		view.tab = $('#categoryTab .active')[0].id
		view.pane = $('#categoryPane .active')[0].id
		view.scroll = $('#categoryPane .active')[0].scrollTop
		view.openEls = $('.entityContainer.open').map(function () { return this.id; }).get()
		view.openCards = $('.entityContainer .card.collapse.show').map(function () { return this.id; }).get()
		view.openEls = $('.citationContainer.open').map(function () { return this.id; }).get()
		view.openCards = $('.citationContainer .card.collapse.show').map(function () { return this.id; }).get()

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
	}
}

function docList(elements) {
	var menuItemTpl =
		`<a class="dropdown-item" href="#" onclick='load("{$url}")'>
					{$label}
					<svg width="3em" height="3em" viewBox="0 0 16 16" class="bi bi-dot {$stat}" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
  						<path fill-rule="evenodd" d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/>
					</svg>
				</a>`
	var menuItemTplSu =
		`<a class="dropdown-item" href="#" onclick='load("{$url}")'>
				{$label} <span class=" border border-primary rounded text-primary">{$user}</span>
				<svg width="3em" height="3em" viewBox="0 0 16 16" class="bi bi-dot {$stat}" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
					<path fill-rule="evenodd" d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/>
				</svg>				
			</a>`

	if (elements.su) {
		for (var i = 0; i < elements.list.length; i++) {
			$('#fileMenu').append(menuItemTplSu.tpl(elements.list[i]))
		}
	}
	if (!elements.su) {
		for (var i = 0; i < elements.list.length; i++) {
			$('#fileMenu').append(menuItemTpl.tpl(elements.list[i]))
		}
	}

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
				<button type="button" class="btn selectButton {$entity}" data-mark="{$entity}" onclick="doAction('{$letter}',event.altKey,event.shiftKey)">
					{$label} ({$letter})
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

function prefs(type, input) {
	if (type == 'width') {
		setLayout('width', input)
	} else if (type == 'height') {
		setLayout('height', input)
	} else {
		kwic.setPrefs(type, input)
	}
	setupKWIC(documentLocation, true)
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

// load and show a document
async function load(file) {
	showSpinner();
	let response = await fetch('/api/load?file=' + file);
	if (!response.ok) alert('Non ho potuto caricare il file ' + file);
	else {
		let content = await response.text();


		currentFilename = file;
		split = file.split('_');
		let sezione = split[1].replace(/[^0-9]+/g, "");
		let volume = split[2].replace(/[^0-9]+/g, "");
		let tomo = split[3].replace(/[^0-9]+/g, "");
		status = split[5];

		let path = (`${sezione}_${volume}_${tomo}_`);

		// ADD data path here from file splitting
		editMode = true;
		$('#file').html(content);
		$('#file').attr("status", status);
		$('#file').attr('data-path', path);
		setStatus(status);
		$('#file').animate({ scrollTop: 0 }, 400);
		$('#commandList').removeClass('d-none');
		markFootnote(documentLocation, mark = true)
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
	$(".role-group").append('<div class="row added-role" id="added-role" style="margin-top:10px"><div class="col-md-10"><select name="role" class="form-control role" aria-describedby="author-role-metadata"><option hidden disabled selected value>Scegli un ruolo...</option><option class="role-option" value="role.01">Delegato Aspirante della Gioventù Cattolica</option><option class="role-option" value="role.02">Studente</option><option class="role-option" value="role.03">Membro della FUCI</option><option class="role-option" value="role.04">Presidente del circolo di Bari della FUCI</option><option class="role-option" value="role.05">Assistente volontario alla cattedra di diritto e procedura penale</option><option class="role-option" value="role.06">Presidente nazionale della FUCI</option><option class="role-option" value="role.07">Professore di Filosofia del Diritto</option><option class="role-option" value="role.08">Membro del Movimento Laureati dell\'Azione Cattolica</option><option class="role-option" value="role.09">Membro dell\'Ufficio stampa del governo Badoglio</option><option class="role-option" value="role.10">Giornalista e commentatore politico</option><option class="role-option" value="role.11">Presidente del Comitato direttivo provvisorio per la FUCI meridionale</option><option class="role-option" value="role.12">Segretario Centrale del Movimento Laureati dell\'Azione Cattolica</option><option class="role-option" value="role.13">Direttore di "Studium"</option><option class="role-option" value="role.14">Membro dell\'Assemblea Costituente</option><option class="role-option" value="role.15">Vicepresidente del gruppo democristiano alla Costituente</option><option class="role-option" value="role.16">Membro della Camera dei Deputati</option><option class="role-option" value="role.17">Sottosegretario al ministero degli Affari Esteri con delega per l\'Emigrazione</option><option class="role-option" value="role.18">Membro dell\'Unione Giuristi Cattolici</option><option class="role-option" value="role.19">Membro di Iniziativa Democratica</option><option class="role-option" value="role.20">Professore di diritto penale</option><option class="role-option" value="role.21">Professore di diritto e procedura penale</option><option class="role-option" value="role.22">Membro della Comissione parlamentare di esame del disegno di legge relativo alla costituzione e al funzionamento della Corte Costituzionale</option><option class="role-option" value="role.23">Presidente del gruppo DC alla Camera</option><option class="role-option" value="role.24">Ministro di Grazia e Giustizia</option><option class="role-option" value="role.25">Consigliere nazionale della DC</option><option class="role-option" value="role.26">Ministro della Pubblica Istruzione</option><option class="role-option" value="role.27">Segretario politico della DC</option><option class="role-option" value="role.28">Presidente del Consiglio</option><option class="role-option" value="role.29">Titolare ad interim del ministero degli Esteri</option><option class="role-option" value="role.30">Ministero degli Esteri</option><option class="role-option" value="role.31">Presidente della Commissione Affari Esteri della Camera</option><option class="role-option" value="role.32">Presidente di turno della Comunità Europea</option><option class="role-option" value="role.33">Presidente del Consiglio Nazionale della DC</option></select></div><div class="col-md-2"><button style="float:right" type="button" class="btn btn-danger btn-sm" onclick="deleteAdded(this)"><i class="fa fa-minus" aria-hidden="true"></i></button></div></div>');
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
	$(".event-date-group").append('<div class="row added-event-date" style="margin-top:10px"><div class="col-md-10"><input type="text" class="form-control" id="event-date" aria-describedby="event-date-metadata"></div><div class="col-md-2"><button style="float:right" type="button" class="btn btn-danger btn-sm" onclick="deleteEventDate()"><i class="fa fa-minus" aria-hidden="true"></i></button></div></div>');
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
	var t = $(id)[0].offsetTop - 100;
	$('#file').animate({ scrollTop: t }, 400);
	$(id).addClass('animate');
	setTimeout(function () {
		$(id).removeClass('animate');
	}, 5000);
}

//Extract work title from the current file name
function getTitle(fileName) {

	let split = fileName.split('_');
	let title = split[4];

	return title;
}

// download the currently loaded document to the local disk
function downloadDoc(type) {
	var publicationTpl = `Converted into {$type} by "{$software}" on {$date} from the original source at "{$src}". `;
	var options = {
		title: getTitle(currentFilename),
		publication: publicationTpl.tpl({
			type: type.toUpperCase(),
			software: softwareName,
			date: new Date().toLocaleString(),
			src: $('[data-src]').data('src')
		})
	}
	if (type == 'html') {
		download(currentFilename, $('#file').html(), "text/html", options)
	} else if (type == 'tei') {
		saveAsXML(currentFilename, $('#file')[0], '/TEI.xsl', options)
	} else {
		alert('Download as ' + type + ' not implemented yet')
	}
}

// export all entities in the currently loaded document to the local disk
function exportEntities(type) {
	var t = kwic.compactEntities(type)
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
		let action;

		referenceMode ? action = kwic.doActionReference(key, alt, shift) : action = kwic.doAction(key, alt, shift); // If reference mode is active change action options

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
	const response = await fetch('/api/save', saveOptions);
	const text = await response.text();
	hideSpinner();
	if (text) alert(text);
}

// save a loaded document on the remote server
async function uploadDoc(data) {

	sez = $('#sezNumber').val();
	vol = $('#volNumber').val();
	tom = $('#tomNumber').val();
	opera = $('#operaName').val();

	let requestOptions;

	if (data.type === 'html') {
		data.sez = sez;
		data.vol = vol;
		data.tom = tom;
		data.opera = opera;

		requestOptions = {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data)
		};
	} else {
		data.append("sez", sez);
		data.append("vol", vol);
		data.append("tom", tom);
		data.append("opera", opera);

		requestOptions = {
			method: 'POST',
			body: data
		};
	};

	showSpinner();
	const response = await fetch('/api/upload', requestOptions);
	const text = await response.text();
	hideSpinner();

	if (text) alert(text);
}

function setStatus(status) {

	switch (status) {
		case "default":
			removeStatus("status");
			$("#status").addClass("default");
			$("#status").html("Default");
			break
		case "working":
			removeStatus("status");
			$("#status").addClass("working");
			$("#status").html("Working");
			break
		case "done":
			removeStatus("status");
			$("#status").addClass("done");
			$("#status").html("Done");
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

	const response = await fetch('/api/change', statusOptions);
	const text = await response.text();

	currentFilename = text;

	switch (status) {
		case 'default':
			$("#status").removeClass("done");
			$("#status").addClass("default");
			$("#status").html("Default");
			break
		case 'working':
			$("#status").removeClass("default");
			$("#status").addClass("working");
			$("#status").html("Working");
			break
		case 'done':
			$("#status").removeClass("working");
			$("#status").addClass("done");
			$("#status").html("Done");
			break
	}

}

// user is changing label, sort or wikidata Id
function changeValue(field, id, value) {
	var pp;

	if (!referenceMode) {
		pp = kwic.allEntities[id]
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

// show the popover where the searched items from wikidata are shown		
function popoverWiki() {
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
	$.get("https://www.wikidata.org/w/api.php?action=wbsearchentities&origin=*&format=json&language=en&search=" + label)
		.then((data) => {
			if (data.search.length > 0) {
				var q = "<ul class='pl-3'>"
				for (var i = 0; i < data.search.length; i++) {
					var d = { ...data.search[i], entity: id }
					q += popoverTpl.tpl(d, true);
				}
				q += "</ul>"
			} else {
				var q = `<i>No relevant items found</i>`
			}
			$('#' + tmpId).removeClass('loading spinner').html(q);
		})
	return `<div id='{$tmpId}' class='loading spinner scroll-col'></div>`.tpl({ tmpId: tmpId })
}

function popoverMention() {

}

// wikidata matching entities have arrived and are shown in the popover
function showWikidataEntity(element) {
	var infoTpl = `
				<h3 class="wikiInfo">{$title}</h3>
				<p class="wikiInfo">{$extract}</p>`

	var entity = $(element).closest('[data-id]').attr('data-id')
	var e = kwic.allEntities[entity]
	if (e && e.wikidataId) {
		$.get("https://www.wikidata.org/w/api.php?action=wbgetentities&origin=*&format=json&props=sitelinks&sitefilter=enwiki&ids=" + e.wikidataId).
			then((data) => {
				var lang = 'en'
				var title = encodeURI(data.entities[e.wikidataId].sitelinks[lang + 'wiki'].title)
				$.get("https://en.wikipedia.org/w/api.php?format=json&action=query&origin=*&prop=extracts&exintro&explaintext&redirects=1&titles=" + title)
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
function wikidataChoose(entity, uri) {
	$('.popoverToggle').popover('hide')
	changeValue('wikidataId', entity, uri)
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
	if (confirm("You are about to empty the trash. Continue?")) {
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

function fileParams() {

	var vol = $('#volNumber').val();
	var tom = $('#tomNumber').val();
	var opera = $('#operaName').val();

	if (vol != '' && tom != '' && opera != '') {
		$('#docFile').prop('disabled', false)
	}
}

// Load a file containing HTML to become a new document on the server. 
function uploadFileSetup(evt) {
	var f = evt.target.files[0];

	if (f.type.match('html|text')) {
		var reader = new FileReader();
		reader.onloadend = function (e) {
			var d = e.target.result; //content
			if (validate(d)) {
				uploadData = {
					filename: f.name.replace(/\.[^/.]+$/, ""), // removes the filename extension
					size: f.size,
					content: d,
					type: 'html'
				}
				$('#uploadFile').prop('disabled', false)
			}
		};
		reader.readAsText(f);
	};
	if (f.type.match('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
		var reader = new FileReader();
		reader.onloadend = function (e) {
			var d = e.target.result; //content
			if (validate(d)) {

				uploadData = new FormData();
				uploadData.append('filename', f.name.replace(/\.[^/.]+$/, ""));
				uploadData.append('file', f);
				uploadData.append('type', 'docx');

				$('#uploadFile').prop('disabled', false)
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

// Mark curator note and author note
function markFootnote(location, mark){
	
	let markOptions = {
		author: 'Aldo Moro',
		markChar: '[',
		node: 'li',
		attribute: "id",
		selector: 'footnote-',
		exception: ''
	};
	
	let authorNotes = kwic.markFootnote(location, markOptions);
	if (authorNotes > 0) {
	
		let alert_footnote = `<p id="alert-count">Sono state marcate automaticamente ${authorNotes} note di ${markOptions.author}</p>`
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
	})
}

async function getMetadata(fragment, doc) {
	let file = currentFilename;
	split = file.split('_');
	let id = split[6];
	const getIdOptions = {
		headers: { 'Content-type': 'application/json' }
	}
	let response = await fetch("/api/getId?id=" + id, getIdOptions);
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

	if (json.provenanceP[0] == "") {
		json.provenanceP.pop()
	} else if (json.provenanceU[0] == "") {
		json.provenanceU.pop()
	}

	if (json.provenanceP.length != 0 && json.provenanceU.length == 0) {
		json.provenanceP.forEach((prov) => {
			let p = doc.createElementNS("http://www.tei-c.org/ns/1.0", "p");
			let textNode = doc.createTextNode(prov)
			p.appendChild(textNode);
			let list = fragment.querySelector('list')
			list.appendChild(p)
		})
	} else if (json.provenanceP.length == 0 && json.provenanceU.length != 0) {
		json.provenanceU.forEach((prov) => {
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

//  save a file in the local download folder
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

async function saveMetadata(event) {

	let file = currentFilename;
	let n = $('#ident').val();
	let ident = $('div#file').attr('data-path') + n
	let author = $('#author').val();
	let role = $('select.role').map((_, el) => el.value).get();
	let curator = $('#curator').val();
	let abstract = $('#abstract').val();
	let doctype = $('select.doctype').map((_, el) => el.value).get();
	let doctopic = $('select.doctopic').map((_, el) => el.value).get();
	let docstatus = $('input[type=radio][name=docstatus]:checked').val();
	let provenanceP = $('.bibsource').map((_, el) => el.value).get();
	let provenanceU = $('.archsource').map((_, el) => el.value).get();
	let eventPlace = $('#event-place').val();
	let eventDate = $('#event-date').val();
	let additionalNotes = $('#additional-notes').val();

	let data = { file, ident, author, role, curator, abstract, doctype, doctopic, docstatus, provenanceP, provenanceU, eventPlace, eventDate, additionalNotes };

	const requestOptions = {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(data),
	};
	//showSpinner();
	const response = await fetch("/api/metadata", requestOptions);
	const text = await response.text();

	if (!response.ok) {
		let err = $('#errors');
		err.text(text);
		$('#add-metadata').animate({ scrollTop: err }, 400);
	} else {
		$('#add-metadata').modal('toggle')
		currentFilename = text;
	}

}

