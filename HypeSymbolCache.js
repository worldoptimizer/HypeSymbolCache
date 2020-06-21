/*!
Hype SymbolCache 1.1
copyright (c) 2020 Max Ziebell, (https://maxziebell.de). MIT-license
*/

/**
 * A module that allows Tumult Hype symbols to be extended in a persistent way
 * @module HypeSymbolCache
 */

/*
 * Version-History
 * 1.0 Initial release under MIT-license
 * 1.1 Bugfixes, additional API and immediate refresh
 */

if("HypeSymbolCache" in window === false) window['HypeSymbolCache'] = (function () {

	var _cache = {};

	function documentLoad (hypeDocument, element, event){

		// init document cache
		_cache[hypeDocument.documentId()] = {}

		/**
		 * This function is an copy of the function found in the Hype Runtime. As that is an IIFE it isn't available and hence we need to redifine it for custom event handling following the official Hype Event schema.
		 *
 		 * @param {Object} event This object contains at least the event type (name of event) and in some cases some additional information (key, value) or nested structures
		 * @param {HTMLElement} element This is the element the current tagert of the event or null if the event doesn't require or was called without an target
		 * @return Returns the result of the event. Mostly this is an Boolean in case of Hype as it uses the events in an Observer pattern.
		 */
		hypeDocument.notifyEvent = function(event, element) {
		    var eventListeners = window['HYPE_eventListeners'];
		    if (eventListeners == null) {
		        return;
		    }
		    var result;
		    for (var i = 0; i < eventListeners.length; i++) {
		        if (eventListeners[i]['type'] == event['type'] && eventListeners[i]['callback'] != null) {
		            result = eventListeners[i]['callback'](this, element, event);
		            if (result === false) {
		                return false;
		            }
		        }
		    }
		    return result;
		};
		
		/**
		 * This helper does a backwards treewalk from the element it is started on and returns the symbolInstance if one is found. This function was originally written by Stephen Decker from Tumult Inc. but has been tweaked to use the Hype Symbol Cache. The cache is also used to return save the search result for child elements of symbols. Hence, a repeated symbol won't be a treewalk but rather a simple lookup.
		 *
		 * @param {HTMLElement} element The element to start the treewalk on
		 * @return {Object} Returns the first found symbolInstance while tree walking or null if no symbolInstance is found
		 */
		hypeDocument.getSymbolInstanceForElement = function(element){
			if (_cache[this.documentId()][element.id]) return _cache[this.documentId()][element.id];
			var symbolInstance = null;
			var currentElm = element;
			var docElm = document.getElementById(hypeDocument.documentId());
			while (symbolInstance == null && currentElm != null && currentElm != docElm) {
				symbolInstance = _cache[this.documentId()][currentElm.id];
				if (symbolInstance != null) {
					if (element != currentElm) _cache[this.documentId()][element.id] = symbolInstance;
				} else {
					currentElm = currentElm.parentNode;
				}
			}
			return symbolInstance;
		}
		

		/**
		 * This function reset the entire symbol cache and purging the entire symbol cache. This resets the return values for getSymbolInstanceById an getSymbolInstancesByName for all symbol instances.
		 *
		 * @param {Boolean} refreshImmediately If this is set to true it will fire HypeSymbolInit rather then only deleting the symbol cache.
		 */
		hypeDocument.purgeSymbolCache = function(refreshImmediately){
			if (refreshImmediately) {
				for (var id in _cache[this.documentId()]){
					hypeDocument.refreshSymbolCacheForId(id);
				}
			} else {
				_cache[this.documentId()] = {}
			}
		}

		/**
		 * This function reset the symbol cache of an single symbol by purging its symbol instance from the symbol cache. This resets the return values for getSymbolInstanceById an getSymbolInstancesByName for the symbol instance with the given id.
		 *
		 * @param {String} id This is the id of the symbol cache that should be reseted
		 * @param {Boolean} refreshImmediately If this is set to true it will fire HypeSymbolInit rather then only deleting the symbol cache.
		 */
		hypeDocument.purgeSymbolCacheForId = function(id, refreshImmediately){
			if (refreshImmediately) {
				hypeDocument.refreshSymbolCacheForId(id);
			} else {
				delete _cache[this.documentId()][id];
			}
		}
				
		// Alias original command
		hypeDocument._getSymbolInstanceById = hypeDocument.getSymbolInstanceById;
		hypeDocument._getSymbolInstancesByName = hypeDocument.getSymbolInstancesByName;


		/**
		 * This function overrides the original Hype document API and returns the symbol instance from the cache lookup instead. The original function is still available and aliased as hypeDocument._getSymbolInstanceById.
		 *
		 * @param {String} id The id your trying to get the symbolinstace from
		 */
		hypeDocument.getSymbolInstanceById = function(id){
			return _cache[this.documentId()][id];
		}
		
		/**
		 * This function overrides the original Hype document API and returns the symbol instances requested by name from the cache lookup instead. The original function is still available and aliased as hypeDocument._getSymbolInstancesByName.
		 *
		 * @param {String} id The id your trying to get the symbol instance from
		 */
		hypeDocument.getSymbolInstancesByName = function(name){
			var instances = hypeDocument._getSymbolInstancesByName(name);
			var cacheList = [];
			for (var i=0; i<instances.length; i++){
				cacheList.push(_cache[this.documentId()][instances[i].element().id]);
			}
			return cacheList;
		}
		
		/**
		 * This function refreshes the symbol cache by requesting a fresh copy of the symbol instance APi from the Hype Runtime and firing the custom event HypeSymbolInit afterwards
		 *
		 * @param {String} id The id your trying to refresh the symbol instance for
		 */
		hypeDocument.refreshSymbolCacheForId = function(id){
			_cache[hypeDocument.documentId()][id] = hypeDocument._getSymbolInstanceById(id);
			//todo in 1.2 only fire if cache is set for an symbol and is not null to secure against user passing in a non symbol id
			hypeDocument.notifyEvent({type: "HypeSymbolInit"}, document.getElementById(id));
		}
		/**
		 * This function refreshes the symbol cache by requesting a fresh copy of the symbol instance API from the Hype Runtime and firing the custom event HypeSymbolInit afterwards but only if the system cache isn't already set for the id
		 *
		 * @param {String} id The id your trying to refresh the symbol instance for
		 */		
		hypeDocument.refreshSymbolCacheForIdIfNecessary = function(id){
			if (!_cache[hypeDocument.documentId()][id]) {
				this.refreshSymbolCacheForId(id);
			}
		}
	}
		
	function symbolLoad (hypeDocument, element, event){
		hypeDocument.refreshSymbolCacheForIdIfNecessary(element.id);
	}
		
	if("HYPE_eventListeners" in window === false) window.HYPE_eventListeners = Array();
	window.HYPE_eventListeners.push({"type":"HypeDocumentLoad", "callback":documentLoad});
	window.HYPE_eventListeners.push({"type":"HypeSymbolLoad", "callback":symbolLoad});

	/**
	 * @typedef {Object} HypeHandlebars
	 * @property {String} version Version of the extension
	 */
	var HypeSymbolCache = {
		version: '1.1',
	};

	/** 
	 * Reveal Public interface to window['HypeSymbolCache'] 
	 * return {HypeSymbolCache}
	 */
	return HypeSymbolCache;
})();

