import XmpFileProcessor from "./XmpReaderFileProcessor.js"
import getGPanoValue from "./XmpReaderGetGPanoValue.js"
import * as XmpReaderEvents from "./XmpReaderEvents.js"

var XmpReader = class {
	constructor() {
		// XMP source data
		this.xmpData = ""
		
		// Set up events
        this.events = {
            loaded: [],
            error: []
        }
	}

	// Returns true if XMP data was obtained
	hasData() {
		return (this.xmpData != undefined && this.xmpData.length > 0)
	}

	// Processes an image file
	readFile(file) {
		var processor = new XmpFileProcessor(file, (xmpData) => {
			this.xmpData = xmpData
			if (this.xmpData) this.dispatchEvent("loaded")
			else this.dispatchEvent("error")
		})
	
		processor.getSlice()
	}
}

// Add prototype methods from modules
XmpReader.prototype.getGPanoValue = getGPanoValue
XmpReader.prototype.addEventListener = XmpReaderEvents.addEventListener
XmpReader.prototype.removeEventListener = XmpReaderEvents.removeEventListener
XmpReader.prototype.dispatchEvent = XmpReaderEvents.dispatchEvent

export default XmpReader