var _example = (function (module) {

	var xmp;

	// Run when example is loaded
	function pageLoaded() {
		// Set up XMP reader
		xmp = module.xmpReader = new _xmpreader.XmpReader();
		xmp.addEventListener("loaded", onXmpLoaded);
		xmp.addEventListener("error", onXmpError);

		// Bind file selector event
		document.getElementById("fileselector").addEventListener("change", onFileSelection, false);

		// Bind drop target
		var ele = document.getElementById("preview");
		ele.addEventListener("dragover", onDragOver, false);
		ele.addEventListener("dragenter", onDragEnter, false);
		ele.addEventListener("dragleave", onDragLeave, false);
		ele.addEventListener("drop", onDrop, false);
	}

	window.addEventListener('load', pageLoaded);

	// Load successful
	function onXmpLoaded() {
		// Get available values for form
		var inputs = document.getElementsByTagName("input");
		for (var i = 0; i < inputs.length; i++) {
			var gpanoAttrib = inputs[i].getAttribute("data-gpano");
			if (gpanoAttrib) inputs[i].value = xmp.getGPanoValue(gpanoAttrib);
		}

		// Calc degrees
		var fullWidth = xmp.getGPanoValue("FullPanoWidthPixels");
		var fullHeight = xmp.getGPanoValue("FullPanoHeightPixels");
		var croppedWidth = xmp.getGPanoValue("CroppedAreaImageWidthPixels");
		var croppedHeight = xmp.getGPanoValue("CroppedAreaImageHeightPixels");
		document.getElementById("HorizDeg").value = Math.round(radToDeg(croppedWidth * (Math.PI * 2 / fullWidth)));
		document.getElementById("VertDeg").value = Math.round(radToDeg(croppedHeight * (Math.PI / fullHeight)));
	}

	// Error event
	function onXmpError() {
		console.log("No XMP found");
	}

	// Convert radians to degrees
	function radToDeg(val) {
		return val * 180 / Math.PI;
	}

	// Event to process file selection
	function onFileSelection(event) {
		// Clear existing output
		var inputs = document.getElementsByTagName("input");
		for (var i = 0; i < inputs.length; i++) {
			if (inputs[i].type == "text") inputs[i].value = "";
		}

		// Get file blob
		var blob = (event.target.files || event.dataTransfer.files)[0];

		// Display image for reference
		var preview = document.getElementById("preview");
		preview.className = "";
		preview.style.backgroundImage = "url(" + URL.createObjectURL(blob) + ")";

		// Brute force the image dimensions
		var img = new Image();
		img.onload = function (event) {
			document.getElementById("ImageWidth").value = event.target.naturalWidth;
			document.getElementById("ImageHeight").value = event.target.naturalHeight;
		};
		img.src = URL.createObjectURL(blob);

		// Read blob
		xmp.readFile(blob);
	}

	function onDragOver(event) {
		event.preventDefault();
	}

	function onDragEnter(event) {
		event.preventDefault();
		event.target.className += " over";
	}

	function onDragLeave(event) {
		event.preventDefault();
		if (event.target.className == "empty over") event.target.className = "empty";
		else event.target.className = "";
	}

	function onDrop(event) {
		event.preventDefault();
		event.target.className = "";
		document.getElementById("fileselector").value = "";
		onFileSelection(event);
	}

	return module;

}(_example || {}))
