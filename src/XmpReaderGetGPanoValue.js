// Functions for converting GPano text values to type
function parseBoolean(text) {
	let val = text.toLowerCase().trim()
	if (val === "true") return true
	else if (val === "false") return false
	else return null
}

function parseDate(text) {
	return Date.parse(text)
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
}

// If the GPano XMP attribute exists, returns value converting to type if possible
// Otherwise returns null
function getGPanoValue(attribName) {
    // Find the attribute
    var fullname = "GPano:" + attribName + "=\""
    var start = this.xmpData.indexOf(fullname)
    var end = this.xmpData.indexOf("\"", start + fullname.length)

    // No attribute found
    if (start < 0 || end < 0) return null

    // Extract the attribute
    var attribValue = this.xmpData.substring(start + fullname.length, end)

    // Convert the attribute
    if (attribName in xmpParameterConversion) {
        var parse = xmpParameterConversion[attribName]
        return parse(attribValue)
    }

    // Otherwise return the text
    return attribValue
}

export default getGPanoValue