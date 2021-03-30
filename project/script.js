var script = script || {}

let glzOrWidth = WINDOW_PARAMS.glazingBy;
let changedVar = "sillHeightValue";
let unitSys = UNIT_PARAMS.unitSys
let radiantFloorChecked = WINTER_COMFORT_PARAMS.intRadiantFloorChecked;
let ppdValue = 20;
let ppdValue2 = 10;
// let resultsArray = [];
let multiDimResults;
//make a multi-dim array to store the results array
//it will only be [len/2][13] by defalut (or flipped... not sure)
//you will need to double the len/2 but flip it on the first half.
//extend the 13 to be the actual room depth somehow... repeating last??



script.computeData = function(object) {
    multiDimResults = [];
    let halfWall = parseInt(ROOM_PARAMS.length*5 / 2)

    for(let i = 0; i < halfWall; i++){
        let nDimResults = []
        multiDimResults.push(nDimResults)
        for(let j = 0; j < ROOM_PARAMS.depth*5; j++){
            multiDimResults[i].push(0);
        }
    }
    // console.log(multiDimResults[0].length)


    for(let i = 0; i < halfWall; i++){
        object.occDistToWallCenter = i;

        var geoResult = geo.createGlazingForRect(parseFloat(object.ceilingHeightValue), 
        object.wallLen, 
        object.glzRatioValue/100, 
        parseFloat(object.windowWidthValue), 
        parseFloat(object.windowHeightValue), 
        parseFloat(object.sillHeightValue), 
        parseFloat(object.distanceWindows),
        glzOrWidth, 
        changedVar
        );
        // Compute the view factors to make the graph.
        var viewResult = geo.computeAllViewFac(geoResult.wallCoords, geoResult.glzCoords, object.occDistToWallCenter)
        // Compute the PPD to make the graph.
        var comfortResult = comf.getFullPPD(
            viewResult.wallViews, 
            viewResult.glzViews, 
            viewResult.facadeDist, 
            viewResult.windIntervals, 
            object.occDistToWallCenter,
            geoResult.windowHeight,
            geoResult.sillHeight, 
            object.uvalueValue, 
            object.intLowEChecked, 
            object.intLowEEmissivity, 
            parseFloat(object.rvalueValue), 
            parseFloat(object.airtempValue), 
            parseFloat(object.outdoorTempValue), 
            radiantFloorChecked, 
            parseFloat(object.clothingValue), 
            parseFloat(object.metabolic), 
            parseFloat(object.airspeedValue), 
            parseFloat(object.humidityValue), 
            ppdValue, 
            ppdValue2)
            for(let j = 0; j < 13; j++){
                // resultsArray.push(comfortResult.myDataset[j]);
                multiDimResults[i][j] = comfortResult.myDataset[j]
            }

            // console.log(comfortResult.myDataset[0])
    }
    // console.log(resultsArray)

    object.occDistToWallCenter = 0;
	// Compute the window and wall geometry.
    var geoResult = geo.createGlazingForRect(parseFloat(object.ceilingHeightValue), 
    object.wallLen, 
    object.glzRatioValue/100, 
    parseFloat(object.windowWidthValue), 
    parseFloat(object.windowHeightValue), 
    parseFloat(object.sillHeightValue), 
    parseFloat(object.distanceWindows),
    glzOrWidth, 
    changedVar
    );
	// Compute the view factors to make the graph.
	var viewResult = geo.computeAllViewFac(geoResult.wallCoords, geoResult.glzCoords, object.occDistToWallCenter)
	// Compute the PPD to make the graph.
    var comfortResult = comf.getFullPPD(
        viewResult.wallViews, 
        viewResult.glzViews, 
        viewResult.facadeDist, 
        viewResult.windIntervals, 
        object.occDistToWallCenter,
        geoResult.windowHeight,
         geoResult.sillHeight, 
         object.uvalueValue, 
         object.intLowEChecked, 
         object.intLowEEmissivity, 
         parseFloat(object.rvalueValue), 
         parseFloat(object.airtempValue), 
         parseFloat(object.outdoorTempValue), 
         radiantFloorChecked, 
         parseFloat(object.clothingValue), 
         parseFloat(object.metabolic), 
         parseFloat(object.airspeedValue), 
         parseFloat(object.humidityValue), 
         ppdValue, 
         ppdValue2)

        //  console.log(comfortResult)

	// Return all of the information in one dictionary
	// var r = {}

	r.wallCoords = geoResult.wallCoords;
	r.glzCoords = geoResult.glzCoords;
	r.glzRatio = geoResult.glzRatio;
	r.windowWidth = geoResult.windowWidth;
	r.windowHeight = geoResult.windowHeight;
	r.sillHeight = geoResult.sillHeight;
	r.centLineDist = geoResult.centLineDist;

	r.wallViews = viewResult.wallViews;
	r.glzViews = viewResult.glzViews;
	r.facadeDist = viewResult.facadeDist;

	r.condensation = comfortResult.condensation; // Text string value that is either: "certain", "risky", "none".
	r.dataSet = comfortResult.myDataset; // Data to construct the graph.
	r.occPtInfo = comfortResult.occPtInfo;  // The status of the occupant at the input location.
	r.dwnPPDFac = comfortResult.dwnPPDFac;  // Boolean value for whether the occupant is in front of the window or not.


	return r
}