var _xmpreader;

(function (_xmpreader) {
	var XmpReader = (function () {
		// Identifier for XMP data
		var xmpIdentifier = "http://ns.adobe.com/xap/1.0/";

		// State enum for processing JPEG marker data
		var ProcessState = {
			Stop: "Stop",
			ReadMarker: "ReadMarker",
			ReadLengthToNextMarker: "ReadLengthToNextMarker",
			ReadLengthOfData: "ReadLengthOfData",
			ReadData: "ReadData"
		};

		// Constructor method
		function XmpReader() {
			// Initialize public attributes
			this.XMPData = "";

			// Set up events
			this.events = {
				loaded: [],
				error: []
			};
		}

		// Pure javascript objects don't get DOM events; this fakes it with a callback list
		XmpReader.prototype.addEventListener = function (eventName, callback) {
			if (eventName in this.events) {
				this.events[eventName].push(callback);
			}
		};

		XmpReader.prototype.removeEventListener = function (eventName, callback) {
			if (eventName in this.events) {
				var index = this.events[eventName].indexOf(callback);
				if (index > -1) {
					this.events[eventName].splice(index, 1);
				}
			}
		};

		function dispatchEvent(xmpReader, eventName, eventArgs) {
			if (eventName in xmpReader.events) {
				var callbacks = xmpReader.events[eventName];

				callbacks.forEach(function (callback) {
					callback(eventArgs);
				});
			}
		}

		// Functions for converting GPano text values to type
		function parseBoolean(text) {
			let val = text.toLowerCase().trim();
			if (val === "true") return true;
			else if (val === "false") return false;
			else return null;
		}

		function parseDate(text) {
			return Date.parse(text);
		}

		var xmpParameterConversion = {
			UsePanoramaViewer: parseBoolean,
			//CaptureSoftware: [string],
			//StitchingSoftware: [string],
			//ProjectionType: [string],
			PoseHeadingDegrees: parseFloat,
			PosePitchDegrees: parseFloat,
			PoseRollDegrees: parseFloat,
			InitialViewHeadingDegrees: parseInt,
			InitialViewPitchDegrees: parseInt,
			InitialViewRollDegrees: parseInt,
			InitialHorizontalFOVDegrees: parseFloat,
			InitialVerticalFOVDegrees: parseFloat,
			FirstPhotoDate: parseDate,
			LastPhotoDate: parseDate,
			SourcePhotosCount: parseInt,
			ExposureLockUsed: parseBoolean,
			CroppedAreaImageWidthPixels: parseInt,
			CroppedAreaImageHeightPixels: parseInt,
			FullPanoWidthPixels: parseInt,
			FullPanoHeightPixels: parseInt,
			CroppedAreaLeftPixels: parseInt,
			CroppedAreaTopPixels: parseInt,
			InitialCameraDolly: parseFloat
		};

		// If the GPano XMP attribute exists, returns value converting to type if possible
		// Otherwise returns null
		XmpReader.prototype.getGPanoValue = function (attribName) {
			// Find the attribute
			var fullname = "GPano:" + attribName + "=\"";
			var start = this.XMPData.indexOf(fullname);
			var end = this.XMPData.indexOf("\"", start + fullname.length);

			// No attribute found
			if (start < 0 || end < 0) return null;

			// Extract the attribute
			var attribValue = this.XMPData.substring(start + fullname.length, end);

			// Convert the attribute
			if (attribName in xmpParameterConversion) {
				var parse = xmpParameterConversion[attribName];
				return parse(attribValue);
			}

			// Otherwise return the text
			return attribValue;
		};

		// Extracts XMP data from file blob
		XmpReader.prototype.readFile = function (file) {
			// Reinitialize public attributes
			this.XMPData = "";

			// Initialize private parameters
			var params = {
				fileblob: file,
				filereader: new FileReader(),
				currentPos: 0,
				sliceLength: 2,
				state: ProcessState.ReadMarker,
				xmpreader: this
			};

			// Start reading data
			params.filereader.onload = function (event) { filereaderOnload(event, params) };
			getSlice(params);
		};

		// Returns true if XMP data was obtained
		XmpReader.prototype.hasData = function () {
			return (this.XMPData != undefined && this.XMPData.length > 0);
		};

		// Gets a slice from the file blob and reads slice as array buffer
		function getSlice(params) {
			var slice = params.fileblob.slice(params.currentPos, params.currentPos + params.sliceLength);
			params.filereader.readAsArrayBuffer(slice);
		}

		// Processes result of reading slice as array buffer
		function filereaderOnload(event, params) {
			var data = new Uint8Array(event.target.result);

			switch (params.state) {
				case ProcessState.ReadMarker:
					// Process marker
					processMarker(data, params);
					getSlice(params);
					break;
				case ProcessState.ReadLengthToNextMarker:
					// Move position to length found in marker payload
					// Set slice size to length of marker
					params.currentPos += (data[0] * 0x100 + data[1]) - 2;
					params.sliceLength = 2;
					params.state = ProcessState.ReadMarker;
					getSlice(params);
					break;
				case ProcessState.ReadLengthOfData:
					// Move position past payload
					// Set slice size to length found in marker payload
					params.currentPos += 2;
					params.sliceLength = (data[0] * 0x100 + data[1]) - 2;
					params.state = ProcessState.ReadData;
					getSlice(params);
					break;
				case ProcessState.ReadData:
					// Read data found in marker
					readMarkerData(data, params);
					// Process next marker
					params.currentPos += params.sliceLength;
					params.sliceLength = 2;
					params.state = ProcessState.ReadMarker;
					getSlice(params);
					break;
				default:
					// Stop processing
					if (params.xmpreader.XMPData) dispatchEvent(params.xmpreader, "loaded");
					else dispatchEvent(params.xmpreader, "error");
					break;
			}
		}

		// Processes JPEG marker data and configures state for next read
		function processMarker(data, params) {
			if (data[0] != 0xff) {
				params.state = ProcessState.Stop;
				return;
			}

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
					params.currentPos += 2;
					params.sliceLength = 2;
					params.state = ProcessState.ReadMarker;
					return;

				// Ignore next two bytes, get next marker
				case 0xDD: // DRI
					params.currentPos += 4;
					params.sliceLength = 2;
					params.state = ProcessState.ReadMarker;
					return;

				// Read length from next two bytes, get next marker
				case 0xC0: // SOF0
				case 0xC2: // SOF2
				case 0xC4: // DHT
				case 0xDB: // DQT
				case 0xDA: // SOS
				case 0xFE: // COM
					params.currentPos += 2;
					params.sliceLength = 2;
					params.state = ProcessState.ReadLengthToNextMarker;
					return;

				// Read length from next two bytes, get marker data
				case 0xE0: // APPn
				case 0xE1: // APPn
				case 0xE2: // APPn
					params.currentPos += 2;
					params.sliceLength = 2;
					params.state = ProcessState.ReadLengthOfData;
					return;

				default:
					return ProcessState.Stop;
			}
		}

		// Looks for XMP data in APPn marker section
		function readMarkerData(data, params) {
			// Convert data to string
			var text = String.fromCharCode.apply(null, data);
			// Look for XMP data
			if (text.indexOf(xmpIdentifier) == 0) params.xmpreader.XMPData = text.substring(xmpIdentifier.length);
		}

		return XmpReader;
	})();

	_xmpreader.XmpReader = XmpReader;

})(_xmpreader || (_xmpreader = {}));
