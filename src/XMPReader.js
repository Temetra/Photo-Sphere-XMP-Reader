var _xmpreader;

(function (_xmpreader) {
	var XmpReader = (function () {
		// Constructor method
		function XmpReader() {
			// Init object
			this.result = "";
			_domlessevent.initializeEvents(this);
			_domlessevent.addEvent("xmploaded", this);
			_domlessevent.addEvent("xmperror", this);
		}

		// Returns string value of GPano XMP attribute
		XmpReader.prototype.getGPanoValue = function(attribName) {
			var fullname = "GPano:" + attribName + "=\"";
			var start = this.result.indexOf(fullname);
			var end = this.result.indexOf("\"", start + fullname.length);
			if (start < 0 || end < 0) return "";
			return this.result.substring(start + fullname.length, end);
		};

		// Extracts XMP data from file blob
		XmpReader.prototype.readFile = function(file) {
			// Init parameters for read process
			var params = {
				fileblob: file,
				filereader: new FileReader(),
				currentPos: 0,
				chunkSize: 2048,
				data: "",
				start: -1,
				end: -1,
				xmpreader: this
			};
			
			// Read XMP
			params.filereader.onload = function(event) { filereaderOnload(event, params) };
			readSlice(params);
		};

		function filereaderOnload(event, params) {
			// Load result into array
			var view = new Uint8Array(event.target.result);

			// Convert array into string and append to current data
			params.data += String.fromCharCode.apply(null, view);
			
			// Look for XMP segment
			if (params.start < 0) params.start = params.data.indexOf("<x:xmpmeta");
			if (params.end < 0) params.end = params.data.indexOf("</x:xmpmeta>");

			// Read more?
			if (params.end < 0) {
				// Quit at 512k read
				if (params.currentPos + params.chunkSize >= 512 * 1024) {
					// Assume blob does not contain XMP
					params.xmpreader.result = "";
					_domlessevent.dispatchEvent(params.xmpreader, "xmperror");
				}
				else {
					// Read more data
					readSlice(params);
				}
			}
			else {
				// Trim data and finish
				params.xmpreader.result = params.data.substring(params.start, params.end + "</x:xmpmeta>".length);
				_domlessevent.dispatchEvent(params.xmpreader, "xmploaded");
			}
		}

		function readSlice(params) {
			var slice = params.fileblob.slice(params.currentPos, params.currentPos + params.chunkSize);
			params.currentPos += params.chunkSize;
			params.filereader.readAsArrayBuffer(slice);
		}

		return XmpReader;
	})();

	_xmpreader.XmpReader = XmpReader;

})(_xmpreader || (_xmpreader = {}));
