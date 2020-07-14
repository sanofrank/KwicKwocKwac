/*!
 * Patterned DOM Extensions (PDX)- behavior
 * Version 0.4 - 05/12/2018
 * based on the jQuery plugin boilerplate at https://github.com/jquery-boilerplate/jquery-patterns
 * Ideation and first prototype: Fabio Vitali, Â© 2017
 * Author: Fabio Vitali, October 2016 - February 2017
 * All rights reserved. This software is NOT open source at the moment. Permission to use and modify this 
   file is granted to all people working on the Alstom SSE editor only. This may change in the future.
   
   Rules to edit this file: 
   * Change and modify and reshuffle and refactor and throw away as you see fit. 
   * Never remove this comment
   * Never change the line "Ideation and first prototype"
   * If you fixed some bugs or did some minor refactoring, add a line "Contributor" with your name. 
   * If you did some major reshuffling or refactoring, add your name to the authors' list. 
   * Switching to ES2015 is NOT major refactoring.
   * If my code has basically disappeared, remove my name from the authors' list. 
   * Do NOT inform me of this. 
 */
 
//injectCss('bootstrap', "//maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css");
//injectCss('fontawesome', "//maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css");
var entities = {};
var templates = {};
var MinionRegistry = {
   countable: {
      include: '[data-pdx-role~="countable"]',
       exclude: '[data-pdx-role~="non-countable"]',
       related: 'countable',
       delay: 0,
       setup: function (node, search, options, pdxObject) {
         this.update(node, search, options, pdxObject);
      },
       update: function (node, search, options, pdxObject) {
         var family = $(node).attr(pdxObject.attributeNames.family)
         var id = node.nodeName.toLowerCase() + '-';
         id += family ? family + '-' : '';
         var allNodes = $(node).parents(pdxObject.options.context).find(search);
         var c = $.inArray(node, allNodes)+1;
         $(node).attr('id', id+c);
      }
   },
    collapsable: {
		include: '[data-pdx-role~="collapsable"], [data-pdx-role~="collapsed"]',
		exclude: '[data-pdx-role~="tabler"], [data-pdx-role~="htabler"], [data-pdx-role~="non-collapsable"]', 
		related: 'hcountable', 
		delay: 1, 
		setup: function(node, search, options, pdxObject) {
			 this.update(node,search, options, pdxObject); 
		},
		update: function(node,search, options, pdxObject) {
			var collapse = function() {
				var sect = $(this).closest('[data-pdx-role~="collapsable"], [data-pdx-role~="collapsed"]')
				var content = $("> *:not(:first-child)", sect)
				$(this).toggleClass('fa-caret-down').toggleClass('fa-caret-right') ; 
				content.fadeToggle(300)
				return false; 
			}
			var collapsed = $(node).attr('data-pdx-role').indexOf('pdx-collapsed') !== -1 ;
			var caretAfter = $(node).attr('data-pdx-role').indexOf('pdx-caretAfter') !== -1 ;
			var collapseTag = $('  <span style="padding-right: 0.5em;" class="fa fa-caret-down fw" aria-hidden="true"></span>  ')
			if (caretAfter) {
				$(node.children[0]).append(collapseTag); 
			} else {
				$(node.children[0]).prepend(collapseTag); 
			}
			$(node).on('click','.fa',collapse) ; 
			if (collapsed) collapse.apply(collapseTag) ; 
		}
   },
    hcountable: {
      include: 'section, [data-pdx-role~="hcountable"]',
       exclude: '[data-pdx-role~="tabler"], [data-pdx-role~="htabler"], [data-pdx-role~="non-hcountable"]',
       related: 'hcountable',
       delay: 0,
       setup: function (node, search, options, pdxObject) {
         this.update(node, search, options, pdxObject);
      },
       update: function (node, search, options, pdxObject) {
         var family = $(node).attr(pdxObject.attributeNames.family)
         var id = node.nodeName.toLowerCase() + '-';
         id += family ? family + '-' : '';
         var parent = $(node).parents(search).filter(pdxObject.options.context+' *')
         if (parent.length) {
            var pid = parent.attr('id').split('-').pop().split('.')
		} else {
            var pid = []
         }
         if ($(node).parent('section[data-pdx-role~="non-hcountable"]').length > 0) {
            var prevAllCount = $(node).prevAll(search).length + 1;
            prevAllCount += $(node).parent('section').prevAll(search).length;
            $.each($(node).parent('section').prevAll('section[data-pdx-role~="non-hcountable"]'), function (idx, nonCountableSection) {
               prevAllCount += $(nonCountableSection).children(search).length;
            });
         }
         else {
            var prevAllCount = $(node).prevAll(search).length + 1;
            $.each($(node).prevAll('section[data-pdx-role~="non-hcountable"]'), function (idx, nonCountableSection) {
               prevAllCount += $(nonCountableSection).children(search).length;
            });
         }

         pid.push(prevAllCount)
         id += pid.join('.')
         $(node).attr('id', id)
      }
   },
    referenceable: {
      include: '[data-pdx-role~="referenceable"], [typeof="BibliographicItem"]',
       related: 'referenceable',
       delay: 0,
       setup: function (node, search, options, pdxObject) {
         this.update(node, search, options, pdxObject);
      },
       update: function (node, search, options, pdxObject) {
         var val = $(node).attr('resource')
         if (!val) val = $(node).attr(pdxObject.attributeNames.family)
         $(node).attr('id', val.substr(0, 1) !== '#' ? val : val.substr(1))
      }
   },
    summable: {
      include: '.pdx-summable, [data-pdx-role~="summable"]',
   },
    referencer: {
      include: '[data-pdx-role~="referencer"]',
       related: 'referenceable',
       delay: 4,
       preserveOriginalDOM: false,
       setup: function (node, search, options, pdxObject) {
         this.update(node, search, options, pdxObject);
      },
       update: function (node, search, options, pdxObject) {
         var id = $(node).attr('href');
         if (entities[id] && entities[id].shortref) {
            var val = entities[id].shortref.join(', ')
		} else {
            var val = $(id).clone();
         }
         if (val.length) {
            $(node).html(val);
            $('*', node).addClass('pdx-inactive')
         }
      }
   },
    hcounter: {
      include: '[data-pdx-role~="hcounter"]',
       related: 'hcountable',
       delay: 1,
       preserveOriginalDOM: false,
       setup: function (node, search, options, pdxObject) {
         this.update(node, search, options, pdxObject);
      },
       update: function (node, search, options, pdxObject) {
         var hc = $(node).parents(':pdx(hcountable)')
         if (hc.length) {
            var id = $(hc[0]).attr('id').split('-').pop();
            $(node).html(id + '. ');
         }
      }
   },
    counter: {
      include: '[data-pdx-role~="counter"]',
       related: 'countable',
       delay: 1,
       preserveOriginalDOM: false,
       setup: function (node, search, options, pdxObject) {
         this.update(node, search, options, pdxObject);
      },
       update: function (node, search, options, pdxObject) {
         var c = $(search).length
         if (c) $(node).html(pdxObject.marker.format(c, node));
      }
   },
    incrementer: {
      include: '[data-pdx-role~="incrementer"]',
       related: 'incrementer',
       delay: 1,
       preserveOriginalDOM: false,
       setup: function (node, search, options, pdxObject) {
         this.update(node, search, options, pdxObject);
      },
       update: function (node, search, options, pdxObject) {
         var c = $(node).index(search);
         if (pdxObject.options.context) {
            var allNodes = $(node).parents(pdxObject.options.context).find(search);
            var c = $.inArray(node, allNodes);
         } else {         
            var c = $(node).index(search) ;
         }
         if (c != -1) {
            $(node).html(pdxObject.marker.format(c + 1, node));
         }
      }
   },
    summer: {
      include: '[data-pdx-role~="summer"]',
       related: 'summable',
       delay: 1,
       preserveOriginalDOM: false,
       setup: function (node, search, options, pdxObject) {
         this.update(node, search, options, pdxObject);
       },
       update: function (node, search, options, pdxObject) {
         var c = 0;
         $(search).each(function () {
            c += parseFloat($(this).text())
         })
         $(node).html(c);
      }
   },
    htabler: {
      include: '[data-pdx-role~="htabler"]',
       related: 'hcountable',
       delay: 2,
       preserveOriginalDOM: false,
       setup: function (node, search, options, pdxObject) {
         this.update(node, search, options, pdxObject);
      },
       update: function (node, search, options, pdxObject) {
         var c = [];
         var allNodes = $(search).filter(pdxObject.options.context+' *');
         allNodes.each(function () {
            var dest = "#" + $(this).attr('id')
            var h1 = $('h1', this)
            if (h1.length > 0) {
               var val = h1.clone()
               $('span', val).remove('.fa')
               var data = {
                  dest: dest,
                   cont: $(val).html(),
                   page: pdxObject.getPageNum(this)
               };
               //c.push('<p class="tocItem"><a href="$dest">$cont</a> <span class="pageNum">pag. $page</span></p>'.tpl(data));
               c.push('<p class="tocItem"><a href="$dest">$cont</a></p>'.tpl(data));
            }
         });
         if (c.length > 0) {
            $(node).html(c);
            $('*', node).addClass('pdx-inactive')
         }
      }
   },
    tabler: {
      include: '[data-pdx-role~="tabler"]',
       related: 'countable',
       delay: 2,
       preserveOriginalDOM: false,
       setup: function (node, search, options, pdxObject) {
         this.update(node, search, options, pdxObject);
      },
       update: function (node, search, options, pdxObject) {
         var c = []
         var allNodes = $(search).filter(pdxObject.options.context+' *');
         allNodes.each(function () {
            var dest = "#" + $(this).attr('id')
            var data = {
               dest: dest,
                cont: $('figcaption', this).html(),
                page: pdxObject.getPageNum(this)
            }
            //c.push('<p class="tocItem"><a href="$dest">$cont</a> <span class="pageNum">pag. $page</span></p></p>'.tpl(data));
            c.push('<p class="tocItem"><a href="$dest">$cont</a></p></p>'.tpl(data));
         });
         if (c.length > 0) {
            $(node).html(c);
            $('*', node).addClass('pdx-inactive')
         }
      }
   },
    formatter: {
      include: '[data-pdx-role~="formatter"]',
       delay: 2,
       preserveOriginalDOM: false,
       setup: function (node, search, options, pdxObject) {
         this.update(node, search, options, pdxObject);
      },
       update: function (node, search, options, pdxObject) {
         var entityId = $(node).attr('about') || $(node).closest('*[resource]').attr('resource') || "#"
         var entity = entities[entityId]
         var formatterName = options.formatter || $(node).attr('data-pdx-type')
         var value = formatterName && formatters[formatterName] ? formatters[formatterName](entity, node) : "";
         $(node).html(value);
         if (value && $(node).attr('property')) {
            var name = $(node).attr('property')
            if (!entity[name]) entity[name] = []
            entity[name].push(value)
         }
      },
       prepare: function (node, entity, formatter) { }
   },
    property: {
      include: '[property]',
       delay: 0,
       setup: function (node, search, options, pdxObject) {
         this.assignToClass(node);
      },
       update: function (node, search, options, pdxObject) {
         this.assignToClass(node);
      },
       assignToClass: function (node) {
         var entityId = $(node).attr('about') || $(node).closest('*[resource]').attr('resource') || "#";
         if (!entities[entityId]) entities[entityId] = {}
         var entity = entities[entityId]
         var name = $(node).attr('property')
         var value = $(node).attr('content') || $(node).html()
         if (value) {
            // if value is not empty or undefined, add to relevant property in relevant entity
            if (!entity[name]) entity[name] = []
            entity[name].push(value)
		} else {
            // if value is empty or undefined, search for value in entities and replace node's content with it
            value = entity[name] ? entity[name].join(" ") : ""
            $(node).html(value);
         }
      }
   },
    typeof: {
      include: '[type="application/ld+json"], [typeof]',
       delay: 0,
       setup: function (node, search, options, pdxObject) {
         if ($(node).is('[type="application/ld+json"]')) {
            var s = $(node).text();
            var data = JSON.parse(s);
            this.collectEntities(data)
         } else {
            this.defineEntity(node);
         }
      },
       update: function (node, search, options, pdxObject) {
         var selectedVersion = options.version || "latest"
         var about = $(node).attr('resource') || 'this'
         var entity = entities[about]
         var url = entity['tpl:source'][0]
         if (typeof entity['tpl:version'] != 'undefined') {
            var currentVersion = entity['tpl:version'][0]
            var defineEntity = this.defineEntity
            return new Promise(function (resolve, reject) {
               $.ajax({
                  url: url,
                   success: function (data) {
                     var c = entity;
                     var destinationVersion = selectedVersion == 'latest' ? data.latest : selectedVersion
                     if (destinationVersion !== currentVersion) {
                        var destinationVersionData = data.versions[destinationVersion]
                        $.ajax({
                           url: destinationVersionData.src,
                            success: function (data) {
                              var newEntity = $.extend(true, {}, entities[about])
                              if (!entities['tpl:archive']) entities['tpl:archive'] = {}
                              if (!entities['tpl:archive'][about]) entities['tpl:archive'][about] = []
                              entities['tpl:archive'][about].push(newEntity);
                              delete entities[about]
                              var iframe = $('#main_ifr')[0];
                              if (iframe) {
                                 var vars = $(node).parents('.mce-content-body').find(':pdx(property)[about="$about"]'.tpl({ about: about })).clone()
                                 data = data.replace('<div role="section-placeholder" class="section-placeholder"></div>', '');
                                 tinymce.activeEditor.undoManager.transact(function () {
                                    var templateData = $('<div/>', { html: data }).children('section[typeof="Template"]');
                                    $(node).html(templateData.html());
                                    for (var i = 0; i < vars.length; i++) {
                                       var variableName = $(vars[i]).attr('property');
                                       var newVar = $('[property="$name"]'.tpl({
                                          name: variableName
                                       }), node)
                                       if (newVar.length > 0) newVar[0].replaceWith(vars[i])
                                    }
                                 });
                              }
                              else {
                                 var vars = $(':pdx(property)[about="$about"]'.tpl({
                                    about: about
                                 })).clone()
                                 $(node).html(data)
                                 for (var i = 0; i < vars.length; i++) {
                                    var variableName = $(vars[i]).attr('property');
                                    var newVar = $('[property="$name"]'.tpl({
                                       name: variableName
                                    }), node)
                                    if (newVar.length > 0) newVar[0].replaceWith(vars[i])
                                 }
                                 $('*', node).pdx('setup')
                              }
                              resolve();
                           }
                        });
                     }
                  }
               });
            });
         }
      },
       defineEntity: function (node) {
         var entityId = $(node).attr('resource') || uniqueId()
         if (!entities[entityId]) entities[entityId] = {}
         var entity = entities[entityId]
         var name = 'tpl:typeof'
         var value = $(node).attr('typeof')
         if (!entity[name]) entity[name] = []
         entity[name].push(value)
         entity['tpl:node'] = node
      },
       collectEntities: function (data) {
         function addToEntities(name, value) {
            if (isScalar(value)) {
               return value
            } else if ($.isArray(value)) {
               var ret = [];
               for (var i = 0; i < value.length; i++) {
                  ret.push(addToEntities(name, value[i]))
               }
               return ret;
            } else {
               var id = value['@id'] !== undefined ? value['@id'] : uniqueId()
               if (id == "") id = "this";
               // if (id.substr(0, 3) == 'doc') debugger;
               var object = entities[id] || {}
               for (var i in value) {
                  if (!object[i]) object[i] = [];
                  object[i].push(addToEntities(i, value[i]))
               }
               entities[id] = object
               return object
            }
         }
         var baseId = "this"
         for (var i in data) {
            if (i !== '@context') {
               if (!entities[baseId]) entities[baseId] = {};
               if (!entities[baseId][i]) entities[baseId][i] = [];
               entities[baseId][i].push(addToEntities(i, data[i]))
            }
         }
      }
   }
}
var formatters = {};
(function (defaults, $, window, document, undefined) {
   'use strict';
   var prefixAttr = "data-pdx-"
   var pdxObject = {
      options : {
      	context: 'body'
      }, 
      attributeNames: {
         originalDOM: prefixAttr + 'original',
         family: prefixAttr + 'family',
         delay: prefixAttr + 'delay',
         marker: prefixAttr + 'marker', 
      }, 
      // checks if node has quality 
      DoesItHaveQuality: function (node, quality) {
         // first specify explicit causes for rejection			
         // reject non-element
         if (node.nodeType != Node.ELEMENT_NODE) return false
         var minion = MinionRegistry[quality]
         if (minion) {
            // find all include and exclude selectors in the minion def
            var include = (minion.include || "").split(/,\s+/)
            var exclude = (minion.exclude || "").split(/,\s+/)
            // add class '.pdx-inactive' tp exclude list
            exclude.push(".pdx-inactive")
            // start with exclusion reasons: if selector from exclude list matches with node, reject quality 
            for (var i = 0; i < exclude.length; i++) {
               if ($(node).is(exclude[i])) return false
            }
            // next go to inclusion reasons: if selector from include list matches with node, approve quality 
            for (var i = 0; i < include.length; i++) {
               if ($(node).is(include[i])) return true
            }
            // finally check if there is a connected quality to evaluate and check with it, too
            var includeQualities = minion.includeQualities ? minion.includeQualities.split(", ") : [];
            for (var i = 0; i < includeQualities.length; i++) {
               if (this.DoesItHaveQuality(node, includeQualities[i])) return true
            }
         }
         // otherwise it does not have the quqlity. 
         return false
      }, 
      // perform action (e.g., setup or update) on node
      perform: function (node, action, options) {
         var originalDOM = this.attributeNames.originalDOM;
         for (var minionName in MinionRegistry) {
            var minion = MinionRegistry[minionName];
            if (minion[action] && this.DoesItHaveQuality(node, minionName)) {
               // REMOVE THIS BLOCK FROM FINAL CODE
               // if attribute "debug" then break here
               if ($(node).attr('debug') !== undefined) {
                  debugger
                  this.DoesItHaveQuality(node, minionName)
               }
               // add attribute original to node with originalDOM if minion requires to preserve the original DOM
               if (minion.preserveOriginalDOM && !$(node).attr(originalDOM)) {
                  $(node).attr(originalDOM, btoa(node.outerHTML));
               }
               // generate search string looking for related qualities (e.g.; countable for counting) and family
				var related = minion.related ? ':pdx($related)' : '' ;
				if ($(node).attr(this.attributeNames.family) ) {
					var search = ("[$familyAttr='$family']"+related).tpl({
						familyAttr:this.attributeNames.family, 
						family:$(node).attr(this.attributeNames.family),
						related: minion.related
					});
				} else {
					var search = (related+":not([$familyAttr])").tpl({
						familyAttr:this.attributeNames.family,
						related: minion.related
					});
				}
               // verify if there should be a delay in execution
               var delay = parseInt($(node).attr(this.attributeNames.delay)) || minion.delay || 0
               if (!pdxObject.tasklist) pdxObject.tasklist = []
               if (!pdxObject.tasklist[delay]) pdxObject.tasklist[delay] = []
               pdxObject.tasklist[delay].push({
                  action: action,
                   minion: minion,
                   node: node,
                   options: options,
                   search: search
               });
            }
         }
      },
       destroy: function (node) {
         var original = this.attributeNames.originalDOM;
         if ($(node).attr(original)) {
            $(node).replaceWith(atob($(node).attr(original)));
            $(node).removeAttr(original);
         }
      },
       getPageNum: function (node) {
         //			var pageNums = $(node).closest(":has([data-pdx-family='page'])").find("[data-pdx-family='page']")
         var pageNum = $(node).xpath('preceding::span[@data-pdx-family="page"][1]').text()
         return pageNum ? parseInt(pageNum) + 1 : 1
      },
       marker: {
         roman: function (num, lowercase) {
            if (!+num) return NaN;
            var digits = String(+num).split("")
            var upper = ["", "C", "CC", "CCC", "CD", "D", "DC", "DCC", "DCCC", "CM",
                "", "X", "XX", "XXX", "XL", "L", "LX", "LXX", "LXXX", "XC",
                "", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"]
            var lower = ["", "c", "cc", "ccc", "cd", "d", "dc", "dcc", "dccc", "cm",
                "", "x", "xx", "xxx", "xl", "l", "lx", "lxx", "lxxx", "xc",
                "", "i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix"]
            var key = lowercase ? lower : upper
            var roman = ""
            var i = 3;
            while (i--) roman = (key[+digits.pop() + (i * 10)] || "") + roman;
            return Array(+digits.join("") + 1).join(lowercase ? 'm' : 'M') + roman;
         },
          letter: function (n, lowercase) {
            if (lowercase) {
               var ordA = 'a'.charCodeAt(0);
               var ordZ = 'z'.charCodeAt(0);
            } else {
               var ordA = 'A'.charCodeAt(0);
               var ordZ = 'Z'.charCodeAt(0);
            }
            var len = ordZ - ordA + 1;
            var s = "";
            while (n >= 0) {
               s = String.fromCharCode((n - 1) % len + ordA) + s;
               n = Math.floor(n / len) - 1;
            }
            return s;
         },
          repeat: function (string, n) {
            return Array(n + 1).join(string)
         },
          isNumeric: function (num) {
            return !isNaN(num)
         },
          bullet: function (type) {
            var bullets = {
               disc: '\u25CF',
                circle: '\u25CB',
                square: '\u25A0'
            }
            return bullets[type]
         },
          format: function (c, node) {
            var markers = '1'
            markers = $(node).parents('[' + pdxObject.attributeNames.marker + ']').attr(pdxObject.attributeNames.marker) || markers
            markers = $(node).attr(pdxObject.attributeNames.marker) || markers
            var markerList = markers.split('.')
            for (var marker of markerList) {
               var val;
               switch (marker) {
                  case 'a':
                     val = pdxObject.marker.letter(c, true);
                     break;
                  case 'A':
                     val = pdxObject.marker.letter(c, false);
                     break;
                  case 'i':
                     val = pdxObject.marker.romanize(c, true);
                     break;
                  case 'I':
                     val = pdxObject.marker.romanize(c, false);
                     break;
                  default:
                     val = pdxObject.marker.bullet(marker)
                     if (!val) {
                        if (pdxObject.marker.isNumeric(marker)) {
                           val = c
                        } else {
                           val = pdxObject.marker.repeat(marker, c)
                        }
                     }
               }
            }
            return val
         }
      }
   }
   $.extend({
      pdxSetup: function (options) {
         // Usage: $.pdxSetup({property:'Custom value'});
         return $.extend(defaults, options);
      }
   }).fn.extend({
      // Usage: $(selector).pdx(command,{option = 'value'});
      pdx: function (command, options) {
         pdxObject.options = $.extend(pdxObject.options, defaults, options);
         var temp = $(this);
         return new Promise(function (resolve, reject) {
            var ret = temp.each(function () {
               switch (command) {
                  case 'update':
                     pdxObject.perform(this, 'update', options);
                     break;
                  case 'setup':
                     pdxObject.perform(this, 'setup', options);
                     break;
                  case 'destroy':
                     pdxObject.destroy(this, options);
                     break;
                  default:
                     break;
               }
            });
            var results = [];
            // After preparing the full tasklist, execute them. 
            for (var i = 0; i < pdxObject.tasklist.length; i++) {
               for (var j = 0; pdxObject.tasklist[i] && j < pdxObject.tasklist[i].length; j++) {
                  var task = pdxObject.tasklist[i][j]
                  results.push(task.minion[task.action].call(task.minion, task.node, task.search, task.options, pdxObject));
               }
            }
            pdxObject.tasklist = []
            $.when.apply(this, results).done(function () {
               resolve(ret);
            });
         });
      }
   }).extend($.expr[":"], {
      // Custom filters;
      // Usage: $(':pdx(someValue)') ;
      pdx: function (element, index, details) {
         return ~~pdxObject.DoesItHaveQuality(element, details[3]);
      }
   });
})({
   property: "value",
    otherProperty: "value"
}, jQuery, window, document);
(function ($, window, document, undefined) {
   var pluginName = 'xpath';
   var constants = {};
   var defaults = {
      ns: []
   };
   // inspired by http://stackoverflow.com/questions/12243661/javascript-use-xpath-in-jquery
   function filter(element, xpathExpression, options) {
      var opts = $.extend({}, defaults, options, constants);
      // place namespace resolver setup here
      var result = [];
      var ownerDocument = element.nodeType == element.DOCUMENT_NODE ? element : element.ownerDocument
      var xpathResult = ownerDocument.evaluate(xpathExpression, element, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
      while (elem = xpathResult.iterateNext()) {
         result.push(elem);
      }
      return result
   }
   $.fn[pluginName] = function (data, options) {
      var ret = []
      this.each(function () {
         ret = ret.concat(filter(this, data, options));
      })
      return jQuery([]).pushStack(ret);
   }
})(jQuery, window, document);
String.prototype.tpl = function (o) {
   var r = this;
   for (var i in o) {
      r = r.replace(new RegExp("\\$" + i, 'g'), o[i])
   }
   return r
}
function clearEntities() {
   entities = {};
}
//http: //stackoverflow.com/questions/574944/how-to-load-up-css-files-using-javascript
function injectCss(id, uri) {
   if (!document.getElementById(id)) {
      var head = document.getElementsByTagName('head')[0];
      var link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.type = 'text/css';
      link.href = uri;
      link.media = 'all';
      head.appendChild(link);
   }
}
// http://www.jsoneliners.com/function/is-scalar/
function isScalar(obj) {
   return (/string|number|boolean/).test(typeof obj);
}
// http://stackoverflow.com/questions/20060931/automatically-generating-unique-dom-ids
(function () {
   var counter = 0;
   window.uniqueId = function () {
      return 'docId-' + counter++
   }
})();