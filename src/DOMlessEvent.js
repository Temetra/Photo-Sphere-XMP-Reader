var _domlessevent;

(function (_domlessevent) {
	var DOMlessEvent = _domlessevent.DOMlessEvent = (function () {
		function DOMlessEvent() {
			this.callbacks = [];
		}
		
		DOMlessEvent.prototype.registerCallback = function(callback) {
			this.callbacks.push(callback);
		}
		
		DOMlessEvent.prototype.dispatchEvent = function(eventArgs) {
			this.callbacks.forEach(function(callback) {
				callback(eventArgs);
			});
		}

		return DOMlessEvent;
	})();

	var initializeEvents = _domlessevent.initializeEvents = function (subject) {
		// Add events collection
		if (!subject.events) {
			subject.events = {};
		}

		// Add event listener method
		if (!subject.addEventListener) {
			subject.addEventListener = function(eventName, callback) {
				if (eventName in subject.events) subject.events[eventName].registerCallback(callback);
				else console.log(eventName + " event not found");
			};
		}
	};

	var addEvent = _domlessevent.addEvent = function(eventName, subject) {
		if (eventName in subject.events) console.log(eventName + " event already present");
		else subject.events[eventName] = new DOMlessEvent();
	};

	var dispatchEvent = _domlessevent.dispatchEvent = function(subject, eventName, eventArgs) {
		if (eventName in subject.events) subject.events[eventName].dispatchEvent();
		else console.log(eventName + " event not found");
	};

})(_domlessevent || (_domlessevent = {}));

