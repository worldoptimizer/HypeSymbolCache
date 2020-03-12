/*!
Hype SymbolCache 1.1
copyright (c) 2020 Max Ziebell, (https://maxziebell.de). MIT-license
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
		* hypeDocument.notifyEvent
		* @param {object} containing at least type as name of event
		* @param {HTMLDivElement} element
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
		* hypeDocument.getSymbolInstanceForElement
		* (based on work by @Stephen)
		* @param {HTMLDivElement} inital element
		* @return {symbolInstance} or null
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
		* hypeDocument.purgeSymbolCache
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
		* hypeDocument.purgeSymbolCacheForId
		* @param {String} element id
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


		// Override regular command and add the symbol cache lookup
		hypeDocument.getSymbolInstanceById = function(id){
			return _cache[this.documentId()][id];
		}
		
		hypeDocument.getSymbolInstancesByName = function(name){
			var instances = hypeDocument._getSymbolInstancesByName(name);
			var cacheList = [];
			for (var i=0; i<instances.length; i++){
				cacheList.push(_cache[this.documentId()][instances[i].element().id]);
			}
			return cacheList;
		}
		
		hypeDocument.refreshSymbolCacheForId = function(id){
			_cache[hypeDocument.documentId()][id] = hypeDocument._getSymbolInstanceById(id);
			hypeDocument.notifyEvent({type: "HypeSymbolInit"}, document.getElementById(id));
		}
		
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

	/* Reveal Public interface to window['HypeSymbolCache'] */
	return {
		version: '1.1'
	};
})();

