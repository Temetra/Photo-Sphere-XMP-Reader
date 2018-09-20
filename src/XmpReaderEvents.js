// Pure javascript objects don't get DOM events; this fakes it with a callback list
function addEventListener(eventName, callback) {
    if (eventName in this.events) {
        this.events[eventName].push(callback)
    }
}

function removeEventListener(eventName, callback) {
    if (eventName in this.events) {
        var index = this.events[eventName].indexOf(callback)
        if (index > -1) {
            this.events[eventName].splice(index, 1)
        }
    }
}

function dispatchEvent(eventName) {
    if (eventName in this.events) {
        var callbacks = this.events[eventName];

        callbacks.forEach(function (callback) {
            callback(this);
        });
    }
}

export { addEventListener, removeEventListener, dispatchEvent }