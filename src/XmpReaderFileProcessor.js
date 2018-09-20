/* global FileReader */
/* global Uint8Array */

// Identifier for XMP data
var xmpIdentifier = "http://ns.adobe.com/xap/1.0/"

// State enum for processing JPEG marker data
var ProcessState = {
	Stop: "Stop",
	ReadMarker: "ReadMarker",
	ReadLengthToNextMarker: "ReadLengthToNextMarker",
	ReadLengthOfData: "ReadLengthOfData",
	ReadData: "ReadData"
}

class XmpFileProcessor {
	constructor(file, readComplete) {
		this.fileblob = file
		this.readComplete = readComplete
		this.filereader = new FileReader()
		this.filereader.onload = (event) => { this.filereaderOnload(event) }
		this.currentPos = 0
		this.sliceLength = 2
		this.state = ProcessState.ReadMarker
		this.xmpData = ""
	}

	getSlice() {
		var slice = this.fileblob.slice(this.currentPos, this.currentPos + this.sliceLength)
		this.filereader.readAsArrayBuffer(slice)
	}

	filereaderOnload(event) {
		var data = new Uint8Array(event.target.result)

		switch (this.state) {
			case ProcessState.ReadMarker:
				this.readMarker(data)
				break
			case ProcessState.ReadLengthToNextMarker:
				this.readLengthToNextMarker(data)
				break
			case ProcessState.ReadLengthOfData:
				this.readLengthOfData(data)
				break
			case ProcessState.ReadData:
				this.readData(data)
				break
			case ProcessState.Stop:
			default:
				this.readComplete(this.xmpData)
				break
		}
	}

	readMarker(data) {
		if (data[0] != 0xff) {
			this.state = ProcessState.Stop
		} else {
			switch (data[1]) {
				// Read next two bytes as marker
				case 0xD8: // SOI
				case 0xD9: // EOI
				case 0xD0: // RSTn
				case 0xD1: // RSTn
				case 0xD2: // RSTn
				case 0xD3: // RSTn
				case 0xD4: // RSTn
				case 0xD5: // RSTn
				case 0xD6: // RSTn
				case 0xD7: // RSTn
					this.currentPos += 2
					this.sliceLength = 2
					this.state = ProcessState.ReadMarker
					break
		
				// Ignore next two bytes, get next marker
				case 0xDD: // DRI
					this.currentPos += 4
					this.sliceLength = 2
					this.state = ProcessState.ReadMarker
					break
		
				// Read length from next two bytes, get next marker
				case 0xC0: // SOF0
				case 0xC2: // SOF2
				case 0xC4: // DHT
				case 0xDB: // DQT
				case 0xDA: // SOS
				case 0xFE: // COM
					this.currentPos += 2
					this.sliceLength = 2
					this.state = ProcessState.ReadLengthToNextMarker
					break
		
				// Read length from next two bytes, get marker data
				case 0xE0: // APPn
				case 0xE1: // APPn
				case 0xE2: // APPn
					this.currentPos += 2
					this.sliceLength = 2
					this.state = ProcessState.ReadLengthOfData
					break
		
				default:
					this.state = ProcessState.Stop
					break
			}
		}

		this.getSlice()
	}

	readLengthToNextMarker(data) {
		// Move position to length found in marker payload
		// Set slice size to length of marker
		this.currentPos += (data[0] * 0x100 + data[1]) - 2
		this.sliceLength = 2
		this.state = ProcessState.ReadMarker
		this.getSlice()
	}

	readLengthOfData(data) {
		// Move position past payload
		// Set slice size to length found in marker payload
		this.currentPos += 2
		this.sliceLength = (data[0] * 0x100 + data[1]) - 2
		this.state = ProcessState.ReadData
		this.getSlice()
	}

	readData(data) {
		// Get string from data
		var text = String.fromCharCode.apply(null, data)

		// Look for XMP data in APPn marker section
		if (text.indexOf(xmpIdentifier) == 0) this.xmpData = text.substring(xmpIdentifier.length)

		// Process next marker
		this.currentPos += this.sliceLength
		this.sliceLength = 2
		this.state = ProcessState.ReadMarker
		this.getSlice()
	}
}

export default XmpFileProcessor