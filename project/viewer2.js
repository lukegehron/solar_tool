import * as THREE from '../build/three.module.js';
import {
  OrbitControls
} from "./jsm/controls/OrbitControls.js";
import Stats from './jsm/libs/stats.module.js';

var container, stats;
var container2;
var camera, scene, raycaster, renderer, geometry;
var cameraControls;

let plane, norm_factor;

let view_factors_need_updating = true;

let solarcal = {
  alt: 35,
  az: 270,
  fbes: 0.5,
  Idir: 700,
  asa: 0.7,
};

let showModel = "dwnSpd";

let alt_rad, az_rad;

let sun;

let ERF_vertex_values;

let scale_min, scale_max;
let display_value;

let comfort = {
  ta: 25,
  vel: 0.15,
  rh: 50,
  met: 1.1,
  clo: 0.5,
};


var mouse = new THREE.Vector2(),
  INTERSECTED;
var frustumSize = 1000;
var surfaces = [];

let Lon, Lat, Hour, Day, Month, TimeZone, roomOrientationValue, currentStudy;
let dateCounter, annualCoordinates, currentFrame, xPointLoc, yPointLoc, coordinates;

let hour = TIME_PARAMS.hour;
let timestep = TIME_PARAMS.timeStep;
let offset = TIME_PARAMS.offset;
let singleHour = 1;

let myCheck = 1;

let r;

var view_factors;
var panelBorderMin = 0.1; // minimum distance from panel edge to surface edge
const tempMax = 1000; // highest temperature you can enter in the model
const tempMin = -30; // lowest temperature you can enter in the model

let gridColorArray = [];

var case1Data = {
  ceilingHeightValue: ROOM_PARAMS.ceilHeight,
  wallLen: ROOM_PARAMS.length,
  windowHeightValue: WINDOW_PARAMS.heightFromSill,
  windowWidthValue: WINDOW_PARAMS.width,
  glzRatioValue: WINDOW_PARAMS.glazingRatio,
  sillHeightValue: WINDOW_PARAMS.sillHeight,
  distanceWindows: WINDOW_PARAMS.separation,

  occDistToWallCenter: WINTER_COMFORT_PARAMS.occDistToWallCenter,

  uvalueValue: WINTER_COMFORT_PARAMS.uvalueValue,
  calcUVal: WINTER_COMFORT_PARAMS.calcUVal,
  intLowEChecked: WINTER_COMFORT_PARAMS.intLowEChecked,
  intLowEEmissivity: WINTER_COMFORT_PARAMS.intLowEEmissivity,

  outdoorTempValue: WINTER_COMFORT_PARAMS.outdoorTempValue,
  airtempValue: WINTER_COMFORT_PARAMS.airtempValue,
  humidityValue: WINTER_COMFORT_PARAMS.humidityValue,

  rvalueValue: WINTER_COMFORT_PARAMS.rvalueValue,
  airspeedValue: WINTER_COMFORT_PARAMS.airspeedValue,
  clothingValue: WINTER_COMFORT_PARAMS.clothingValue,
  metabolic: WINTER_COMFORT_PARAMS.metabolic
}



init('myCanvas');
// init('myCanvas00');
// init();
// initTweakPane();
updateRoom();
animate();

// function renderCommon(canvas){}

function init(canva) {

  // container = document.createElement('div');
  // container.setAttribute("id", "Div1");
  // document.body.appendChild(container);
  // container2 = document.createElement('div');
  // container2.setAttribute("id", "Div2");
  // document.body.appendChild(container2);

  //THREE_CAMERA
  // var aspect = window.innerWidth / window.innerHeight;
  // camera = new THREE.OrthographicCamera( frustumSize * aspect / - 2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2, 0.1, 10000 );
  camera = new THREE.PerspectiveCamera(1, window.innerWidth / window.innerHeight, 1, 100000);
  camera.position.x = 400;
  camera.position.y = 400;
  camera.position.z = 400;
  camera.up.set(0, 0, 1);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);

  //THREE_LIGHTS
  var light = new THREE.DirectionalLight(0xffffff, 0.45);
  light.position.set(1, 1, 1).normalize();
  scene.add(light);

  light = new THREE.DirectionalLight(0xffffff, 0.45);
  light.position.set(1, -1, 1).normalize();
  scene.add(light);

  light = new THREE.DirectionalLight(0xffffff, 0.45);
  light.position.set(-1, -1, 1).normalize();
  scene.add(light);

  light = new THREE.DirectionalLight(0xffffff, 0.45);
  light.position.set(-1, 1, 1).normalize();
  scene.add(light);
  scene.add(new THREE.AmbientLight(0xffffff, 0.40));

  //THREE_GEOMETRY
  geometry = new THREE.PlaneBufferGeometry(0.9, 0.9);
  // updateRoom();

  raycaster = new THREE.Raycaster();

  //THREE_RENDERER
  renderer = new THREE.WebGLRenderer({
    // canvas: document.getElementById(Div2),
    canvas: document.getElementById(canva),
    antialias: true
  });

  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth/2.2, window.innerHeight/2.2);
  // container.appendChild(renderer.domElement);
  // container2.appendChild(renderer.domElement);

  //THREE_CONTROLS
  cameraControls = new OrbitControls(camera, renderer.domElement);
  cameraControls.addEventListener('change', render);

  //THREE_STATS
  // stats = new Stats();
  // container.appendChild(stats.dom);

  document.addEventListener('mousemove', onDocumentMouseMove, false);
  window.addEventListener('resize', onWindowResize, false);

  //SUN AND ARROW

  // vector that points towards north
  var dir = new THREE.Vector3(1, 0, 0);
  var origin = new THREE.Vector3(1, 0, -4.5);
  var length = 3;
  var hex = 0x000000;

  var arrowHelper = new THREE.ArrowHelper(dir, origin, length, hex, 0.3, 0.3);
  // scene.add(arrowHelper);

  // var textGeo = new THREE.TextGeometry("N", {
  //   size: 1,
  //   height: 0.1,
  // });
  // var textMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
  // var textMesh = new THREE.Mesh(textGeo, textMaterial);
  // textMesh.position = new THREE.Vector3(0, 0, -5);
  // textMesh.rotation.x = -Math.PI / 2;
  // textMesh.rotation.z = -Math.PI / 2;
  // scene.add(textMesh);

  var sunGeometry = new THREE.SphereGeometry(0.5, 32, 32);
  var sunMaterial = new THREE.MeshLambertMaterial({
    color: 0xff0000,
    opacity: 0.8,
    emissive: 0xffff00,
  });
  sun = new THREE.Mesh(sunGeometry, sunMaterial);
  // scene.add(sun);

  //Taken from MRT tool
  // function set_surface_property(surface_name, property, value, panel) {
  //   var surface = _.find(mrt.walls, function (r) {
  //     return r.name == surface_name;
  //   });
  //   if (panel) {
  //     surface.subsurfaces[0][property] = value;
  //   } else {
  //     surface[property] = value;
  //   }
  //   update_shortwave_components();
  //   update_visualization();
  // }

  //TWEAKPANE_PANELS
  

}

//INITIALIZE TWEAKPANE PANELS
function initTweakPane() {
  const global_pane = new Tweakpane({
    container: document.getElementById('global_pane'),
    title: 'Model Type',
  });
  global_pane.addInput(PARAMS1, 'model', {
    options: {
      loc_i: 0,
        loc_j: 1,
        direct_solar: 2,
        dwnSpd: 3,
        dwnTmp: 4,
        glzfac: 5,
        govPPD: 6,
        mrt: 7,
        mrtppd: 8,
        pmv: 9,
        ppd: 10,
        tarDist: 11,
        longwaveMRT: 12,
        mrt1: 13,
        shortwaveMRT: 14,
        directShortwaveMRT: 15,
        diffuseShortwaveMRT: 16,
        reflectedShortwaveMRT: 17,
        pmv1: 18,
        finalPPD:19
    },
  });

  const climate_pane = new Tweakpane({
    container: document.getElementById('climate_pane'),
    title: 'Climate',
  })

  climate_pane.addInput(CLIMATE_PARAMS, 'longitude');
  climate_pane.addInput(CLIMATE_PARAMS, 'latitude');
  climate_pane.addInput(CLIMATE_PARAMS, 'timeZoneOffset');

  const time_pane = new Tweakpane({
    container: document.getElementById('time_pane'),
    title: 'Time',
  })
  time_pane.addInput(TIME_PARAMS, 'studyType');
  time_pane.addInput(TIME_PARAMS, 'hour');
  time_pane.addInput(TIME_PARAMS, 'day');
  time_pane.addInput(TIME_PARAMS, 'month');

  const geometry_pane = new Tweakpane({
    container: document.getElementById('room_pane'),
  });

  const room_pane = geometry_pane.addFolder({
    title: 'Geometry',
  });

  const roomPanel = room_pane.addFolder({
    title: 'Room',
  });
  roomPanel.addInput(ROOM_PARAMS, 'orientation');
  roomPanel.addInput(ROOM_PARAMS, 'ceilHeight');
  roomPanel.addInput(ROOM_PARAMS, 'gridHeight');
  roomPanel.addInput(ROOM_PARAMS, 'depth');
  roomPanel.addInput(ROOM_PARAMS, 'length');

  const windowPanel = room_pane.addFolder({
    expanded: false,
    title: 'Window',
  });
  windowPanel.addInput(WINDOW_PARAMS, 'heightFromSill');
  windowPanel.addInput(WINDOW_PARAMS, 'sillHeight');
  windowPanel.addInput(WINDOW_PARAMS, 'glazingBy');
  windowPanel.addInput(WINDOW_PARAMS, 'separation');

  const hshadePanel = room_pane.addFolder({
    expanded: false,
    title: 'Horizontal Shade',
  });
  hshadePanel.addInput(HORIZONTAL_SHADE_PARAMS, 'depth');
  hshadePanel.addInput(HORIZONTAL_SHADE_PARAMS, 'number');
  hshadePanel.addInput(HORIZONTAL_SHADE_PARAMS, 'spacing');
  hshadePanel.addInput(HORIZONTAL_SHADE_PARAMS, 'dist');
  hshadePanel.addInput(HORIZONTAL_SHADE_PARAMS, 'heightAbove');
  hshadePanel.addInput(HORIZONTAL_SHADE_PARAMS, 'angle');

  const vshadePanel = room_pane.addFolder({
    expanded: false,
    title: 'Vertical Shade',
  });
  vshadePanel.addInput(VERTICAL_SHADE_PARAMS, 'depth');
  vshadePanel.addInput(VERTICAL_SHADE_PARAMS, 'number');
  vshadePanel.addInput(VERTICAL_SHADE_PARAMS, 'spacing');
  vshadePanel.addInput(VERTICAL_SHADE_PARAMS, 'leftRight');
  vshadePanel.addInput(VERTICAL_SHADE_PARAMS, 'lrShift');
  vshadePanel.addInput(VERTICAL_SHADE_PARAMS, 'dist');
  vshadePanel.addInput(VERTICAL_SHADE_PARAMS, 'fullHeight');
  vshadePanel.addInput(VERTICAL_SHADE_PARAMS, 'heightAbove');
  vshadePanel.addInput(VERTICAL_SHADE_PARAMS, 'relativeHeight');
  vshadePanel.addInput(VERTICAL_SHADE_PARAMS, 'angle');

//   const mrt_pane = new Tweakpane({
//     container: document.getElementById('mrt_pane'),
//     title: 'MRT',
//   })

//   mrt_pane.addInput(SUMMER_COMFORT_PARAMS, 'directNormalIrradiance');
//   mrt_pane.addInput(SUMMER_COMFORT_PARAMS, 'fractionOfBodyExposed');
//   mrt_pane.addInput(SUMMER_COMFORT_PARAMS, 'shortWaveAbsorpivity');
//   mrt_pane.addInput(SUMMER_COMFORT_PARAMS, 'TSol');
//   mrt_pane.addInput(SUMMER_COMFORT_PARAMS, 'SHGCIndirect');
//   mrt_pane.addInput(SUMMER_COMFORT_PARAMS, 'TSolShading');


  global_pane.on('change', (value) => {
    // console.log('changed: ' + String(value));
    // console.log(ROOM_PARAMS)
    updateParams();
  });

  climate_pane.on('change', (value) => {
    // console.log('changed: ' + String(value));
    // console.log(ROOM_PARAMS)
    updateParams();
  });

  time_pane.on('change', (value) => {
    // console.log('changed: ' + String(value));
    // console.log(ROOM_PARAMS)
    updateParams();
  });


  geometry_pane.on('change', (value) => {
    // console.log('changed: ' + String(value));
    // console.log(ROOM_PARAMS)
    updateParams();
  });

//   mrt_pane.on('change', (value) => {
//     // console.log('changed: ' + String(value));
//     // console.log(ROOM_PARAMS)
//     updateParams();
//   });

  // set_wall_properties();
  // render_zone();
  // update_view_factors();
  // update_shortwave_components();
  // update_visualization();
  // drawGrid();
  // calculate_all();
  // updateRoom();

}

//UPDATE TWEAKPANE PARAMETERS
function updateParams() {
  // let count = 0;
  var selectedObject = scene.getObjectByName("grid");
  do {
    scene.remove(selectedObject);
    selectedObject = scene.getObjectByName("grid");
    // count++;
  } while (selectedObject != null)

  var selectedObject = scene.getObjectByName("outline");
  do {
    scene.remove(selectedObject);
    selectedObject = scene.getObjectByName("outline");
    // count++;
  } while (selectedObject != null)

  var selectedObject = scene.getObjectByName("window");
  do {
    scene.remove(selectedObject);
    selectedObject = scene.getObjectByName("window");
    // count++;
  } while (selectedObject != null)

  var selectedObject = scene.getObjectByName("shade");
  do {
    scene.remove(selectedObject);
    selectedObject = scene.getObjectByName("shade");
    // count++;
  } while (selectedObject != null)


  updateRoom()


  animate();
}

//UPDATE ROOM SIZE
function updateRoom() {
  case1Data = {
    ceilingHeightValue: ROOM_PARAMS.ceilHeight,
    wallLen: ROOM_PARAMS.length,
    windowHeightValue: WINDOW_PARAMS.heightFromSill,
    windowWidthValue: WINDOW_PARAMS.width,
    glzRatioValue: WINDOW_PARAMS.glazingRatio,
    sillHeightValue: WINDOW_PARAMS.sillHeight,
    distanceWindows: WINDOW_PARAMS.separation,

    occDistToWallCenter: WINTER_COMFORT_PARAMS.occDistToWallCenter,

    uvalueValue: WINTER_COMFORT_PARAMS.uvalueValue,
    calcUVal: WINTER_COMFORT_PARAMS.calcUVal,
    intLowEChecked: WINTER_COMFORT_PARAMS.intLowEChecked,
    intLowEEmissivity: WINTER_COMFORT_PARAMS.intLowEEmissivity,

    outdoorTempValue: WINTER_COMFORT_PARAMS.outdoorTempValue,
    airtempValue: WINTER_COMFORT_PARAMS.airtempValue,
    humidityValue: WINTER_COMFORT_PARAMS.humidityValue,

    rvalueValue: WINTER_COMFORT_PARAMS.rvalueValue,
    airspeedValue: WINTER_COMFORT_PARAMS.airspeedValue,
    clothingValue: WINTER_COMFORT_PARAMS.clothingValue,
    metabolic: WINTER_COMFORT_PARAMS.metabolic
  }

  var geoResult = geo.createGlazingForRect(
    parseFloat(ROOM_PARAMS.ceilHeight),
    parseFloat(ROOM_PARAMS.length),
    WINDOW_PARAMS.glazingRatio / 100.0,
    parseFloat(WINDOW_PARAMS.width),
    parseFloat(WINDOW_PARAMS.heightFromSill),
    parseFloat(WINDOW_PARAMS.sillHeight),
    parseFloat(WINDOW_PARAMS.separation),
    WINDOW_PARAMS.glazingBy
  );
  r = {}
  r.wallCoords = geoResult.wallCoords;
  r.glzCoords = geoResult.glzCoords;
  r.glzRatio = geoResult.glzRatio;
  r.windowWidth = geoResult.windowWidth;
  r.windowHeight = geoResult.windowHeight;
  r.sillHeight = geoResult.sillHeight;
  r.centLineDist = geoResult.centLineDist;

  // console.log(r);
  // getSolar();
  // doTrig();
  updateData(case1Data);
  // console.log(case1Data);

  let colorCount = 0;

  //CREATE GRID AT Z-HEIGHT 0
  const gridMaterial = new THREE.MeshLambertMaterial({
    color: 0xeeeeee,
    transparent: true,
    opacity: 0.7
  });

  

  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0xaaaaaa
  });

  const corner1 = []
  const corner2 = []
  const corner3 = []
  const corner4 = []
  const floor = []
  const ceil = []

  const points = [];
  corner1.push(new THREE.Vector3(ROOM_PARAMS.length / -2 - .5, ROOM_PARAMS.depth / -2 - .5, -ROOM_PARAMS.gridHeight));
  corner1.push(new THREE.Vector3(ROOM_PARAMS.length / -2 - .5, ROOM_PARAMS.depth / -2 - .5, ROOM_PARAMS.ceilHeight - ROOM_PARAMS.gridHeight));

  let lineGeometry = new THREE.BufferGeometry().setFromPoints(corner1);
  let line = new THREE.Line(lineGeometry, lineMaterial);
  line.name = "outline"
  line.setRotationFromAxisAngle(new THREE.Vector3(0, 0, 1), util.degrees_to_radians(ROOM_PARAMS.orientation));
  scene.add(line);

  corner2.push(new THREE.Vector3(ROOM_PARAMS.length / 2 - .5, ROOM_PARAMS.depth / 2 - .5, -ROOM_PARAMS.gridHeight));
  corner2.push(new THREE.Vector3(ROOM_PARAMS.length / 2 - .5, ROOM_PARAMS.depth / 2 - .5, ROOM_PARAMS.ceilHeight - ROOM_PARAMS.gridHeight));

  lineGeometry = new THREE.BufferGeometry().setFromPoints(corner2);
  line = new THREE.Line(lineGeometry, lineMaterial);
  line.name = "outline"
  line.setRotationFromAxisAngle(new THREE.Vector3(0, 0, 1), util.degrees_to_radians(ROOM_PARAMS.orientation));
  scene.add(line);

  corner3.push(new THREE.Vector3(ROOM_PARAMS.length / 2 - .5, ROOM_PARAMS.depth / -2 - .5, -ROOM_PARAMS.gridHeight));
  corner3.push(new THREE.Vector3(ROOM_PARAMS.length / 2 - .5, ROOM_PARAMS.depth / -2 - .5, ROOM_PARAMS.ceilHeight - ROOM_PARAMS.gridHeight));

  lineGeometry = new THREE.BufferGeometry().setFromPoints(corner3);
  line = new THREE.Line(lineGeometry, lineMaterial);
  line.name = "outline"
  line.setRotationFromAxisAngle(new THREE.Vector3(0, 0, 1), util.degrees_to_radians(ROOM_PARAMS.orientation));
  scene.add(line);

  corner4.push(new THREE.Vector3(ROOM_PARAMS.length / -2 - .5, ROOM_PARAMS.depth / 2 - .5, -ROOM_PARAMS.gridHeight));
  corner4.push(new THREE.Vector3(ROOM_PARAMS.length / -2 - .5, ROOM_PARAMS.depth / 2 - .5, ROOM_PARAMS.ceilHeight - ROOM_PARAMS.gridHeight));

  lineGeometry = new THREE.BufferGeometry().setFromPoints(corner4);
  line = new THREE.Line(lineGeometry, lineMaterial);
  line.name = "outline"
  line.setRotationFromAxisAngle(new THREE.Vector3(0, 0, 1), util.degrees_to_radians(ROOM_PARAMS.orientation));
  scene.add(line);

  //FLOOR OUTLINE
  floor.push(new THREE.Vector3(ROOM_PARAMS.length / -2 - .5, ROOM_PARAMS.depth / 2 - .5, -ROOM_PARAMS.gridHeight));
  floor.push(new THREE.Vector3(ROOM_PARAMS.length / 2 - .5, ROOM_PARAMS.depth / 2 - .5, -ROOM_PARAMS.gridHeight));
  floor.push(new THREE.Vector3(ROOM_PARAMS.length / 2 - .5, ROOM_PARAMS.depth / -2 - .5, -ROOM_PARAMS.gridHeight));
  floor.push(new THREE.Vector3(ROOM_PARAMS.length / -2 - .5, ROOM_PARAMS.depth / -2 - .5, -ROOM_PARAMS.gridHeight));
  floor.push(new THREE.Vector3(ROOM_PARAMS.length / -2 - .5, ROOM_PARAMS.depth / 2 - .5, -ROOM_PARAMS.gridHeight));

  lineGeometry = new THREE.BufferGeometry().setFromPoints(floor);
  line = new THREE.Line(lineGeometry, lineMaterial);
  line.name = "outline"
  line.setRotationFromAxisAngle(new THREE.Vector3(0, 0, 1), util.degrees_to_radians(ROOM_PARAMS.orientation));
  scene.add(line);

  //CEILING OUTLINE
  ceil.push(new THREE.Vector3(ROOM_PARAMS.length / -2 - .5, ROOM_PARAMS.depth / 2 - .5, ROOM_PARAMS.ceilHeight - ROOM_PARAMS.gridHeight));
  ceil.push(new THREE.Vector3(ROOM_PARAMS.length / 2 - .5, ROOM_PARAMS.depth / 2 - .5, ROOM_PARAMS.ceilHeight - ROOM_PARAMS.gridHeight));
  ceil.push(new THREE.Vector3(ROOM_PARAMS.length / 2 - .5, ROOM_PARAMS.depth / -2 - .5, ROOM_PARAMS.ceilHeight - ROOM_PARAMS.gridHeight));
  ceil.push(new THREE.Vector3(ROOM_PARAMS.length / -2 - .5, ROOM_PARAMS.depth / -2 - .5, ROOM_PARAMS.ceilHeight - ROOM_PARAMS.gridHeight));
  ceil.push(new THREE.Vector3(ROOM_PARAMS.length / -2 - .5, ROOM_PARAMS.depth / 2 - .5, ROOM_PARAMS.ceilHeight - ROOM_PARAMS.gridHeight));

  lineGeometry = new THREE.BufferGeometry().setFromPoints(ceil);
  line = new THREE.Line(lineGeometry, lineMaterial);
  line.name = "outline"
  line.setRotationFromAxisAngle(new THREE.Vector3(0, 0, 1), util.degrees_to_radians(ROOM_PARAMS.orientation));
  scene.add(line);

  //GEO Result - TAKES DATA FROM THE GEO.JS FILE
  //geo.createGlazingForRect = function(rectHeight, wallLength, glazingRatio, windowWidth, winHeight, silHeight, distBreakup, ratioOrWidth, changedVar)








}

// CHECKS INTERSECTIONS
function render() {
  
  renderer.render(scene, camera);
}

//TODO CHANGE THIS TO PERSPECTIVE
function onWindowResize() {

  var aspect = window.innerWidth / window.innerHeight;

  // camera.left = -frustumSize * aspect / 2;
  // camera.right = frustumSize * aspect / 2;
  // camera.top = frustumSize / 2;
  // camera.bottom = -frustumSize / 2;

  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth/2.2, window.innerHeight/2.2);

}


function animate() {

  requestAnimationFrame(animate);

  render();
  // stats.update();

}

function getSolar() {
  Lon = CLIMATE_PARAMS.longitude;
  Lat = CLIMATE_PARAMS.latitude;
  Hour = TIME_PARAMS.hour;
  Day = TIME_PARAMS.day;
  Month = TIME_PARAMS.month;
  TimeZone = CLIMATE_PARAMS.timeZoneOffset;
  roomOrientationValue = ROOM_PARAMS.orientation;
  currentStudy = singleHour; // singleHour

  dateCounter = 0;
  annualCoordinates = [];
  currentFrame = 0;

  singleHour = TIME_PARAMS.studyType;



  //SunVectors - TAKEN FROM THE OLD SUNVECTORS.JS FILE

  offset = (new Date().getTimezoneOffset()) / 60;

  var dates = []
  var date;
  var date2;
  for (let i = 1; i <= 24 * timestep; i++) {
    hour = i / timestep;
    // console.log(hour)
    if (i == ((parseInt(24 - Hour)) * timestep)) {
      date = new Date(2000, Month - 1, Day, hour - offset - TimeZone, (hour % parseInt(hour)) * 60);
      // console.log((hour%parseInt(hour))*60 + " " + Hour);
      let mytime = 24 - hour;
      date2 = new Date(2000, Month - 1, Day, Hour - offset - TimeZone, 0);
    }
    dates.push(new Date(2000, Month - 1, Day, hour - offset - TimeZone, (hour % parseInt(hour)) * 60));
    // console.log(2000, Month - 1, Day, hour - offset - TimeZone, (hour % parseInt(hour)) * 60);
    // console.log(offset, TimeZone)
  }
  // console.log(dates);
  //console.log(date);


  xPointLoc = [];
  yPointLoc = [];

  coordinates = [];
  for (let i = 1; i <= (24 * timestep) - 1; i++) {
    coordinates.push(solarCalculator([Lon, Lat]).position(dates[i]));
  }

  let suncoordinates = [];
  for (let i = 1; i <= 23; i++) {
    let currentCal = solarCalculator([Lon, Lat]).position(dates[i * 4]);
    if (currentCal[1] > 0) {
      suncoordinates.push(currentCal);
    }

  }

  // console.log(suncoordinates)


  for (let i = 0; i < coordinates.length; i += parseInt(timestep)) {
    if (coordinates[i][1] > 0) {
      xPointLoc.push((36 - (36 * (coordinates[i][1] / 180))) * Math.sin((coordinates[i][0] - 45 - roomOrientationValue) * (-3.1415926 / 180)));
      yPointLoc.push(((22 - (22 * (coordinates[i][1] / 180))) * Math.cos((coordinates[i][0] - 45 - roomOrientationValue) * (-3.1415926 / 180))) - (coordinates[i][1] * .3));
      //p.point((36-(36*(coordinates[i][1]/180)))*p.sin((coordinates[i][0]-45+roomOrientationValue)*(-3.1415926 / 180)), ((22-(22*(coordinates[i][1]/180)))*p.cos((coordinates[i][0]-45+roomOrientationValue)*(-3.1415926 / 180)))-(coordinates[i][1]*.3));
    }
  }

  if (singleHour == 1) {
    coordinates = [];
    let coordinates2 = [];
    for (let i = 1; i <= 9; i++) {
      coordinates.push(solarCalculator([Lon, Lat]).position(date));
    }
    for (let i = 1; i <= 9; i++) {
      coordinates2.push(solarCalculator([Lon, Lat]).position(date2));
    }
    xPointLoc = [];
    yPointLoc = [];
    for (let i = 0; i < coordinates2.length; i += parseInt(timestep)) {
      if (coordinates2[i][1] > 0) {
        xPointLoc.push((36 - (36 * (coordinates2[i][1] / 180))) * Math.sin((coordinates2[i][0] - 45 - roomOrientationValue) * (-3.1415926 / 180)));
        yPointLoc.push(((22 - (22 * (coordinates2[i][1] / 180))) * Math.cos((coordinates2[i][0] - 45 - roomOrientationValue) * (-3.1415926 / 180))) - (coordinates2[i][1] * .3));
        //p.point((36-(36*(coordinates[i][1]/180)))*p.sin((coordinates[i][0]-45+roomOrientationValue)*(-3.1415926 / 180)), ((22-(22*(coordinates[i][1]/180)))*p.cos((coordinates[i][0]-45+roomOrientationValue)*(-3.1415926 / 180)))-(coordinates[i][1]*.3));
      }
    }
  }

  // console.log(coordinates)
}

function doTrig() {

  let gridX = ROOM_PARAMS.depth;
  let gridY = ROOM_PARAMS.length;

  // let vertShadeNum = VERTICAL_SHADE_PARAMS.number;
  let wallDepVal = ROOM_PARAMS.length;
  let gridHt = ROOM_PARAMS.gridHeight;
  let horzShadeNum = HORIZONTAL_SHADE_PARAMS.number;
  let horzShadeDist = HORIZONTAL_SHADE_PARAMS.dist;
  let horzShadeDep = HORIZONTAL_SHADE_PARAMS.depth;
  let horzShadeAngle = HORIZONTAL_SHADE_PARAMS.angle;
  let horzShadeHeight = HORIZONTAL_SHADE_PARAMS.heightAbove;
  let horzShadeSpace = HORIZONTAL_SHADE_PARAMS.spacing;
  let bigArrayColor = [];

  let vertShadeDep = VERTICAL_SHADE_PARAMS.depth;
  let vertShadeDist = VERTICAL_SHADE_PARAMS.dist;
  let vertShadeHeight = VERTICAL_SHADE_PARAMS.fullHeight;
  let vertShadeNum = VERTICAL_SHADE_PARAMS.number;
  let vertShadeShift = VERTICAL_SHADE_PARAMS.lrShift;
  let vertShadeStart = VERTICAL_SHADE_PARAMS.leftRight;
  let vertShadeSpace = VERTICAL_SHADE_PARAMS.spacing;

  //TIME FOR SOME TRIG
  let VecXArray = [];
  let VecYArray = [];
  let VecZArray = [];
  let angleZ;
  let angleHeight; //the height of the sun vector starting from the grid sq
  let angleHeightTest = [];



  //THIS IS A FIX THAT ALLOWS THE ROOM ORIENTATION TO ROTATE A FULL 360 DEGREES
  let newCoordinateArray = [];
  for (let k = 0; k < coordinates.length; k++) {
    //console.log(coordinates[k][0]+float(roomOrientationValue-180))
    if (coordinates[k][0] + parseFloat(roomOrientationValue - 180) < -180) {
      newCoordinateArray.push(coordinates[k][0] + parseFloat(roomOrientationValue - 180) + 360);
    } else if (coordinates[k][0] + parseFloat(roomOrientationValue - 180) > 180) {
      newCoordinateArray.push(coordinates[k][0] + parseFloat(roomOrientationValue - 180) - 360);
    } else {
      newCoordinateArray.push(coordinates[k][0] + parseFloat(roomOrientationValue - 180));
    }
  }


  let LouverList1 = [];
  let XYLouverTest = [];






  if (myCheck == 1) {
    // VERTICAL SHADES XY

    let b1;
    let Xloc1 = [];
    let XYtest1 = [];
    let AWArray1 = [];
    let ZAdd = [];
    let bigB = 0;
    let superB = [];
    let superD = [];
    let filledList = [];
    for (let i = 0; i < gridX; i++) {
      let YdistanceFromWall = (i + 1); // grid distance from window wall in Y direction
      b1 = 0;
      filledList.push(0);
      for (let j = 0; j < gridY; j++) {
        b1 = 0;
        for (let k = 0; k < coordinates.length; k++) {
          let XYLouver1 = 0;
          let XlocationOnWall = 180; // this is a safe angle for the point to start from.. 180 means that it is perpindicular from the point (towards the wall?)
          if (newCoordinateArray[k] < 88.0 && newCoordinateArray[k] > -88.0) {
            XlocationOnWall = Math.tan(newCoordinateArray[k] * (3.1415926 / 180)) * YdistanceFromWall; //this is real point at the window wall relative to the grid point. Add j to get the real location on the window wall
          }
          AWArray1.push(XlocationOnWall);
          let xCoord = 0;
          let bigBArray = [];
          let superC = [];

          for (let n = 0; n < r.glzCoords.length; n++) { //cycle through each window
            // if (XlocationOnWall+(j+1) > r.glzCoords[n][0][0]+(wallDepVal/2)  && XlocationOnWall+(j+1) < r.glzCoords[n][1][0]+(wallDepVal/2)){ //cycle through all the windows, check if the wall position exists within the bounds of the window
            //   xCoord = n+1; //we really only care about if a point gets hit 1x per timestep so this number could go crazy high, but it only needs to go up by 1 to count.. if it gets sun from multiple windows it doesnt really matter
            // }
            // xCoord = 1;
            //}if(xCoord > 0){ //if this specific gridpoint and sun angle goes through a window...
            let newBigBArray = [];
            for (let p = 0; p < parseInt(vertShadeNum); p++) { //for each shade in this window...

              let angleA = abs(newCoordinateArray[k]);
              let angleB = 90.0 - abs(newCoordinateArray[k]);
              if (newCoordinateArray[k] > 0) {
                angleB = angleB * -1;
              }
              let bigA;
              if (vertShadeStart == "L") {
                bigA = ((XlocationOnWall + (j + 1) + (r.glzCoords[n][0][0] - (wallDepVal / 2)) + (p * parseInt(vertShadeSpace) - vertShadeShift)));
              } else {
                bigA = ((XlocationOnWall + (j + 1) - (r.glzCoords[n][0][0] + (wallDepVal / 2)) + (-p * parseInt(vertShadeSpace) - vertShadeShift)));
              }
              bigB = ((Math.sin(angleB * (3.1415926 / 180)) * bigA) / (Math.sin(angleA * (3.1415926 / 180))));
              bigBArray.push(bigB);
              newBigBArray.push(bigB);
            }
            superC.push(newBigBArray);
          } //console.log(bigBArray.length);
          superB.push(bigBArray);
          superD.push(superC);
          for (let q = 0; q < superC.length; q++) { // I think the problem exists here... need a second layer of for loop?
            for (let g = 0; g < superC[0].length; g++) {
              if (superC[q][g] > parseInt(vertShadeDist) && superC[q][g] < (parseInt(vertShadeDist) + parseInt(vertShadeDep))) {
                XYLouver1 = XYLouver1 + 1;
              } else {}
            }
          } //ZAdd.push(bigB)
          if (XYLouver1 > 0) {
            b1 = 1;
          } else {
            b1 = 0;
          }
          LouverList1.push(b1);
        }
      }
    }
    //console.log(filledListI);


    //END OF VERTICAL SHADES




    //START PYTHAGOREAM THEORM FOR XY
    //ASSUME +Y IS DUE NORTH and is the wall opposite the windowwall is N (windowwall is S)

    let b;
    let Xloc = []
    let XYtest = []
    let AWArray = []
    for (let i = 0; i < gridX; i++) {
      let YdistanceFromWall = (i + 1); // grid distance from window wall in Y direction
      b = 0;
      for (let j = 0; j < gridY; j++) {
        b = 0;
        for (let k = 0; k < coordinates.length; k++) {
          let XlocationOnWall = 180; // this is a safe angle for the point to start from.. 180 means that it is perpindicular from the point (towards the wall?)
          if (newCoordinateArray[k] < 88.0 && newCoordinateArray[k] > -88.0) {
            XlocationOnWall = Math.tan(newCoordinateArray[k] * (3.1415926 / 180)) * YdistanceFromWall; //this is real point at the window wall relative to the grid point. Add j to get the real location on the window wall
            //console.log(XlocationOnWall);
          }
          AWArray.push(XlocationOnWall);
          let xCoord = 0;
          let vertLouverXdistance = [];
          for (let m = 0; m < r.glzCoords.length; m++) {

            if (XlocationOnWall + (j + 1) > r.glzCoords[m][0][0] + (wallDepVal / 2) && XlocationOnWall + (j + 1) < r.glzCoords[m][1][0] + (wallDepVal / 2)) { //cycle through all the windows, check if the wall position exists within the bounds of the window
              xCoord = xCoord + 1; //we really only care about if a point gets hit 1x per timestep so this number could go crazy high, but it only needs to go up by 1 to count.. if it gets sun from multiple windows it doesnt really matter
            }
          }
          if (xCoord > 0) {
            b = 1;
          } else {
            b = 0;
          }
          XYtest.push(b);

        }
      }
    }
    //END PYTHAGOREM THEORM FOR XY


    //START PYTHAGOREAM THEORM FOR Z

    let a;
    let Ztest = [];
    let AHArray = [];
    for (let i = 0; i < gridX; i++) {
      let distanceFromWall = (i + 1) / 4;
      a = 0;
      for (let j = 0; j < gridY; j++) {
        a = 0;
        for (let k = 0; k < coordinates.length; k++) {
          let angleHeight = Math.tan((coordinates[k][1]) * (3.1415926 / 180)) * distanceFromWall;
          AHArray.push(coordinates[k][1]);
          if (coordinates[k][1] < 0) {
            a = 0;
          } else if (angleHeight > r.glzCoords[0][0][2] - gridHt && angleHeight < (r.glzCoords[0][2][2] - gridHt)) {
            let testArray1 = [1];
            for (let n = 0; n < horzShadeNum; n++) {
              let sinLawDist = (horzShadeDist * (Math.sin(3.1415926 - (((90) - coordinates[k][1]) * (3.1415926 / 180)) - (90 * (3.1415926 / 180))))) / Math.sin(((90) - coordinates[k][1]) * (3.1415926 / 180));
              let sinLawAngle = (horzShadeDep * (Math.sin(3.1415926 - (((90) - coordinates[k][1]) * (3.1415926 / 180)) - (horzShadeAngle * (3.1415926 / 180))))) / Math.sin(((90) - coordinates[k][1]) * (3.1415926 / 180));

              if (angleHeight < (r.glzCoords[0][2][2] - gridHt) - (horzShadeSpace * n) - (sinLawDist) + (parseFloat(horzShadeHeight) * .5) && angleHeight > ((r.glzCoords[0][2][2] - gridHt) - (horzShadeSpace * n) - (sinLawDist) - (sinLawAngle) + (parseFloat(horzShadeHeight) * .5))) {
                testArray1.push(0);
              } else {
                testArray1.push(1);
              }
            }
            let SortedArray = testArray1.sort();
            let SALength = testArray1.length;
            let itemArray = SortedArray[0];
            a = itemArray;

            //console.log(SortedArray);
          } else {
            a = 0;
          }
          Ztest.push(a);
        }
      }
    }
    //END PYTHAGOREAM THEROM FOR Z

    //START XY and Z check
    let gridColor;
    gridColorArray = []
    for (let i = 0; i < XYtest.length; i++) {

      let XYLouv = LouverList1[i];
      let XYcolor = XYtest[i];
      let Zcolor = Ztest[i];

      if (XYcolor == 1 && Zcolor == 1 && XYLouv == 0) {
        gridColor = gridColor + 1;
      } else {
        gridColor = gridColor + 0;
      }

      // console.log(gridColor)
      if (i % coordinates.length == (coordinates.length) - 1) {
        gridColorArray.push(gridColor);
        gridColor = 0;
      }
    }

    if (dateCounter == 1) {
      for (let i = 0; i < gridColorArray.length; i++) {
        bigArrayColor.push(gridColor);
      }
    } else if (dateCounter < 365) {
      for (let i = 0; i < gridColorArray.length; i++) {
        bigArrayColor[i] += gridColorArray[i];
      }
    }

  } else {

    bigArrayColor = [];






    if (vertShadeOn == 1) { // Variable height louvers

      // VERTICAL SHADES XY
      let XYLouverTest = [];
      let b1;
      let Xloc1 = [];
      let XYtest1 = [];
      let AWArray1 = [];
      let ZAdd = [];
      let bigB = 0;
      let superB = [];
      let superD = [];
      let filledList = [];
      let filledListI = [];
      for (let i = 0; i < gridX; i++) {
        let filledListJ = [];
        for (let j = 0; j < gridY; j++) {
          let filledListK = [];
          for (let k = 0; k < coordinates.length; k++) {
            let filledListN = [];
            for (let n = 0; n < r.glzCoords.length; n++) {
              let filledListP = [];
              for (let p = 0; p < parseInt(vertShadeNum); p++) {
                filledListP.push(0);
              }
              filledListN.push(filledListP);
            }
            filledListK.push(filledListN);
          }
          filledListJ.push(filledListK);
        }
        filledListI.push(filledListJ);
      }

      let filledListZ = [];
      for (let i = 0; i < gridX; i++) {
        let filledListJ = [];
        for (let j = 0; j < gridY; j++) {
          let filledListK = [];
          for (let k = 0; k < coordinates.length; k++) {
            let filledListN = [];
            for (let n = 0; n < r.glzCoords.length; n++) {
              let filledListP = [];
              for (let p = 0; p < parseInt(vertShadeNum); p++) {
                filledListP.push(0);
              }
              filledListN.push(filledListP);
            }
            filledListK.push(filledListN);
          }
          filledListJ.push(filledListK);
        }
        filledListZ.push(filledListJ);
      }

      for (let i = 0; i < gridX; i++) {
        let YdistanceFromWall = (i + 1); // grid distance from window wall in Y direction
        b1 = 0;
        filledList.push(0);
        for (let j = 0; j < gridY; j++) {
          b1 = 0;
          for (let k = 0; k < coordinates.length; k++) {
            let XYLouver1 = 0;
            let XlocationOnWall = 180; // this is a safe angle for the point to start from.. 180 means that it is perpindicular from the point (towards the wall?)
            if (newCoordinateArray[k] < 88.0 && newCoordinateArray[k] > -88.0) {
              XlocationOnWall = Math.tan(newCoordinateArray[k] * (3.1415926 / 180)) * YdistanceFromWall; //this is real point at the window wall relative to the grid point. Add j to get the real location on the window wall
            }
            AWArray1.push(XlocationOnWall);
            let xCoord = 0;
            let bigBArray = [];
            let superC = [];

            for (let n = 0; n < r.glzCoords.length; n++) { //cycle through each window
              // if (XlocationOnWall+(j+1) > r.glzCoords[n][0][0]+(wallDepVal/2)  && XlocationOnWall+(j+1) < r.glzCoords[n][1][0]+(wallDepVal/2)){ //cycle through all the windows, check if the wall position exists within the bounds of the window
              //   xCoord = n+1; //we really only care about if a point gets hit 1x per timestep so this number could go crazy high, but it only needs to go up by 1 to count.. if it gets sun from multiple windows it doesnt really matter
              // }
              // xCoord = 1;
              //}if(xCoord > 0){ //if this specific gridpoint and sun angle goes through a window...
              let newBigBArray = [];
              for (let p = 0; p < parseInt(vertShadeNum); p++) { //for each shade in this window...

                let angleA = abs(newCoordinateArray[k]);
                let angleB = 90.0 - abs(newCoordinateArray[k]);
                if (newCoordinateArray[k] > 0) {
                  angleB = angleB * -1;
                }
                let bigA;
                if (vertShadeStart == "L") {
                  bigA = ((XlocationOnWall + (j + 1) + (r.glzCoords[n][0][0] - (wallDepVal / 2)) + (p * parseInt(vertShadeSpace) - vertShadeShift)));
                } else {
                  bigA = ((XlocationOnWall + (j + 1) - (r.glzCoords[n][0][0] + (wallDepVal / 2)) + (-p * parseInt(vertShadeSpace) - vertShadeShift)));
                }
                bigB = ((Math.sin(angleB * (3.1415926 / 180)) * bigA) / (Math.sin(angleA * (3.1415926 / 180))));
                bigBArray.push(bigB);
                newBigBArray.push(bigB);
              }
              superC.push(newBigBArray);
            } //console.log(bigBArray.length);
            superB.push(bigBArray);
            superD.push(superC);
            for (let q = 0; q < superC.length; q++) { // I think the problem exists here... need a second layer of for loop?
              for (let g = 0; g < superC[0].length; g++) {
                if (superC[q][g] > parseInt(vertShadeDist) && superC[q][g] < (parseInt(vertShadeDist) + parseInt(vertShadeDep))) {
                  XYLouver1 = XYLouver1 + 1;
                  filledListI[i][j][k][q][g] = 1;
                } else {
                  filledListI[i][j][k][q][g] = 0;
                }
              }
            } //ZAdd.push(bigB)
            if (XYLouver1 > 0) {
              b1 = 1;
            } else {
              b1 = 0;
            }
            XYLouverTest.push(b1);
          }
        }
      }
      //console.log(filledListI);
      // VERTICAL SHADES Z

      let a1;
      let Ztest1 = [];
      let AHArray1 = [];
      let newCounter = 0;
      let emptyList = [];
      for (let i = 0; i < gridX; i++) {
        let distanceFromWall = (i + 1) / 4;
        a1 = 0;
        for (let j = 0; j < gridY; j++) {
          a1 = 0;
          for (let k = 0; k < coordinates.length; k++) {
            let distanceBeyondWall = 0;
            let anotherCounter = 0;
            let angleHeight = Math.tan((coordinates[k][1]) * (3.1415926 / 180)) * distanceFromWall;

            for (let n = 0; n < r.glzCoords.length; n++) {

              for (let ru = 0; ru < vertShadeNum; ru++) {
                distanceBeyondWall = (superD[newCounter][n][ru]);

                let angleHeight2 = Math.tan((coordinates[k][1]) * (3.1415926 / 180)) * distanceBeyondWall;


                let myVar;
                if (angleHeight + angleHeight2 > (r.glzCoords[0][0][2] - gridHt) - parseInt(vertShadeScale) + parseInt(vertShadeHeight) && angleHeight + angleHeight2 < (r.glzCoords[0][2][2] - gridHt) + parseInt(vertShadeHeight)) {
                  myVar = 0;
                  //if this condintion, it hits the full size louver
                } else {
                  myVar = 1;
                  anotherCounter = anotherCounter + 1
                }
                filledListZ[i][j][k][n][ru] = myVar;
              }
            }
            if (anotherCounter > 0 + vertShadeNum) {
              XYLouverTest[newCounter - 1] = 0;
            }
            newCounter = newCounter + 1;

          }
        }
      }


      let decider = 0;
      for (let i = 0; i < gridX; i++) {
        for (let j = 0; j < gridY; j++) {
          for (let k = 0; k < coordinates.length; k++) {
            let nextLevel = 0;
            for (let n = 0; n < r.glzCoords.length; n++) {
              for (let p = 0; p < parseInt(vertShadeNum); p++) {
                decider = 0;
                if (filledListI[i][j][k][n][p] == 1) {
                  decider = 1;
                  if (filledListZ[i][j][k][n][p] == 1) {
                    decider = 2;
                  }
                }
                if (decider == 1) {
                  nextLevel = nextLevel + 1;
                }
              }
            }
            if (nextLevel > 0) {
              LouverList1.push(1);
            } else {
              LouverList1.push(0);
            }
          }
        }
      }
    } else { //baseline --- louvers extend to infinty
      // VERTICAL SHADES XY

      let b1;
      let Xloc1 = [];
      let XYtest1 = [];
      let AWArray1 = [];
      let ZAdd = [];
      let bigB = 0;
      let superB = [];
      let superD = [];
      let filledList = [];
      for (let i = 0; i < gridX; i++) {
        let YdistanceFromWall = (i + 1); // grid distance from window wall in Y direction
        b1 = 0;
        filledList.push(0);
        for (let j = 0; j < gridY; j++) {
          b1 = 0;
          for (let k = 0; k < coordinates.length; k++) {
            let XYLouver1 = 0;
            let XlocationOnWall = 180; // this is a safe angle for the point to start from.. 180 means that it is perpindicular from the point (towards the wall?)
            if (newCoordinateArray[k] < 88.0 && newCoordinateArray[k] > -88.0) {
              XlocationOnWall = Math.tan(newCoordinateArray[k] * (3.1415926 / 180)) * YdistanceFromWall; //this is real point at the window wall relative to the grid point. Add j to get the real location on the window wall
            }
            AWArray1.push(XlocationOnWall);
            let xCoord = 0;
            let bigBArray = [];
            let superC = [];

            for (let n = 0; n < r.glzCoords.length; n++) { //cycle through each window
              // if (XlocationOnWall+(j+1) > r.glzCoords[n][0][0]+(wallDepVal/2)  && XlocationOnWall+(j+1) < r.glzCoords[n][1][0]+(wallDepVal/2)){ //cycle through all the windows, check if the wall position exists within the bounds of the window
              //   xCoord = n+1; //we really only care about if a point gets hit 1x per timestep so this number could go crazy high, but it only needs to go up by 1 to count.. if it gets sun from multiple windows it doesnt really matter
              // }
              // xCoord = 1;
              //}if(xCoord > 0){ //if this specific gridpoint and sun angle goes through a window...
              let newBigBArray = [];
              for (let p = 0; p < parseInt(vertShadeNum); p++) { //for each shade in this window...

                let angleA = abs(newCoordinateArray[k]);
                let angleB = 90.0 - abs(newCoordinateArray[k]);
                if (newCoordinateArray[k] > 0) {
                  angleB = angleB * -1;
                }
                let bigA;
                if (vertShadeStart == "L") {
                  bigA = ((XlocationOnWall + (j + 1) + (r.glzCoords[n][0][0] - (wallDepVal / 2)) + (p * parseInt(vertShadeSpace) - vertShadeShift)));
                } else {
                  bigA = ((XlocationOnWall + (j + 1) - (r.glzCoords[n][0][0] + (wallDepVal / 2)) + (-p * parseInt(vertShadeSpace) - vertShadeShift)));
                }
                bigB = ((Math.sin(angleB * (3.1415926 / 180)) * bigA) / (Math.sin(angleA * (3.1415926 / 180))));
                bigBArray.push(bigB);
                newBigBArray.push(bigB);
              }
              superC.push(newBigBArray);
            } //console.log(bigBArray.length);
            superB.push(bigBArray);
            superD.push(superC);
            for (let q = 0; q < superC.length; q++) { // I think the problem exists here... need a second layer of for loop?
              for (let g = 0; g < superC[0].length; g++) {
                if (superC[q][g] > parseInt(vertShadeDist) && superC[q][g] < (parseInt(vertShadeDist) + parseInt(vertShadeDep))) {
                  XYLouver1 = XYLouver1 + 1;
                } else {}
              }
            } //ZAdd.push(bigB)
            if (XYLouver1 > 0) {
              b1 = 1;
            } else {
              b1 = 0;
            }
            LouverList1.push(b1);
          }
        }
      }
      //console.log(filledListI);

    }

    //END OF VERTICAL SHADES




    //START PYTHAGOREAM THEORM FOR XY
    //ASSUME +Y IS DUE NORTH and is the wall opposite the windowwall is N (windowwall is S)

    let b;
    let Xloc = []
    let XYtest = []
    let AWArray = []
    for (let i = 0; i < gridX; i++) {
      let YdistanceFromWall = (i + 1); // grid distance from window wall in Y direction
      b = 0;
      for (let j = 0; j < gridY; j++) {
        b = 0;
        for (let k = 0; k < coordinates.length; k++) {
          let XlocationOnWall = 180; // this is a safe angle for the point to start from.. 180 means that it is perpindicular from the point (towards the wall?)
          if (newCoordinateArray[k] < 88.0 && newCoordinateArray[k] > -88.0) {
            XlocationOnWall = Math.tan(newCoordinateArray[k] * (3.1415926 / 180)) * YdistanceFromWall; //this is real point at the window wall relative to the grid point. Add j to get the real location on the window wall
            //console.log(XlocationOnWall);
          }
          AWArray.push(XlocationOnWall);
          let xCoord = 0;
          let vertLouverXdistance = [];
          for (let m = 0; m < r.glzCoords.length; m++) {

            if (XlocationOnWall + (j + 1) > r.glzCoords[m][0][0] + (wallDepVal / 2) && XlocationOnWall + (j + 1) < r.glzCoords[m][1][0] + (wallDepVal / 2)) { //cycle through all the windows, check if the wall position exists within the bounds of the window
              xCoord = xCoord + 1; //we really only care about if a point gets hit 1x per timestep so this number could go crazy high, but it only needs to go up by 1 to count.. if it gets sun from multiple windows it doesnt really matter
            }
          }
          if (xCoord > 0) {
            b = 1;
          } else {
            b = 0;
          }
          XYtest.push(b);

        }
      }
    }
    //END PYTHAGOREM THEORM FOR XY


    //START PYTHAGOREAM THEORM FOR Z

    let a;
    let Ztest = [];
    let AHArray = [];
    for (let i = 0; i < gridX; i++) {
      let distanceFromWall = (i + 1) / 4;
      a = 0;
      for (let j = 0; j < gridY; j++) {
        a = 0;
        for (let k = 0; k < coordinates.length; k++) {
          let angleHeight = Math.tan((coordinates[k][1]) * (3.1415926 / 180)) * distanceFromWall;
          AHArray.push(coordinates[k][1]);
          if (coordinates[k][1] < 0) {
            a = 0;
          } else if (angleHeight > r.glzCoords[0][0][2] - gridHt && angleHeight < (r.glzCoords[0][2][2] - gridHt)) {
            let testArray1 = [1];
            for (let n = 0; n < horzShadeNum; n++) {
              let sinLawDist = (horzShadeDist * (Math.sin(3.1415926 - (((90) - coordinates[k][1]) * (3.1415926 / 180)) - (90 * (3.1415926 / 180))))) / Math.sin(((90) - coordinates[k][1]) * (3.1415926 / 180));
              let sinLawAngle = (horzShadeDep * (Math.sin(3.1415926 - (((90) - coordinates[k][1]) * (3.1415926 / 180)) - (horzShadeAngle * (3.1415926 / 180))))) / Math.sin(((90) - coordinates[k][1]) * (3.1415926 / 180));

              if (angleHeight < (r.glzCoords[0][2][2] - gridHt) - (horzShadeSpace * n) - (sinLawDist) + (p.float(horzShadeHeight) * .5) && angleHeight > ((r.glzCoords[0][2][2] - gridHt) - (horzShadeSpace * n) - (sinLawDist) - (sinLawAngle) + (p.float(horzShadeHeight) * .5))) {
                testArray1.push(0);
              } else {
                testArray1.push(1);
              }
            }
            let SortedArray = testArray1.sort();
            let SALength = testArray1.length;
            let itemArray = SortedArray[0];
            a = itemArray;

            //console.log(SortedArray);
          } else {
            a = 0;
          }
          Ztest.push(a);
        }
      }
    }
    //END PYTHAGOREAM THEROM FOR Z

    //START XY and Z check
    let gridColor;
    //let gridColorArray = []
    for (let i = 0; i < XYtest.length; i++) {

      let XYLouv = LouverList1[i];
      let XYcolor = XYtest[i];
      let Zcolor = Ztest[i];

      if (XYcolor == 1 && Zcolor == 1 && XYLouv == 0) {
        gridColor = gridColor + 1;
      } else {
        gridColor = gridColor + 0;
      }
      if (i % coordinates.length == (coordinates.length) - 1) {
        gridColorArray.push(gridColor);
        gridColor = 0;
      }
    }


  }






  // console.log(gridColorArray.length);
  // console.log(gridColorArray)





  //END OF TRIG
}

/* ------ FUNCTIONS TO UPDATE DATA ------ */
// Called after adjusting values based on change events
function updateData(object) {
  // Re-run the functions with the new inputs.
  var fullData = script.computeData(object);

  //update datasets with new value
  var newDataset = fullData.dataSet;

  var newGlzCoords = fullData.glzCoords;
  var newGlzWidth = fullData.windowWidth;
  var newGlzHeight = fullData.windowHeight;
  var newGlzRatio = fullData.glzRatio;
  var newSillHeight = fullData.sillHeight;
  var newCentLineDist = fullData.centLineDist;
  var newOccLocData = fullData.occPtInfo;
  var newCondensation = fullData.condensation;


  // Update values in object
  //update window width
  object.windowWidthValue = newGlzWidth;
  //update glazing ratio
  object.glzRatioValue = newGlzRatio * 100;
  //update window height
  object.windowHeightValue = newGlzHeight;
  //update sill height
  object.sillHeightValue = newSillHeight;
  //update dist btwn windows.
  object.distanceWindows = newCentLineDist;

  autocalcUValues();



}


function autocalcUValues() {
  // Re-run the functions with the new inputs.
  var fullDataCase1 = script.computeData(case1Data);

  //Compute the U-Value required to make the occupant comfortable.
  var numPtsLen = (fullDataCase1.wallViews.length) - 1
  case1Data.calcUVal = uVal.uValFinal(fullDataCase1.wallViews[numPtsLen], fullDataCase1.glzViews[numPtsLen], fullDataCase1.facadeDist[numPtsLen], fullDataCase1.dwnPPDFac, parseFloat(case1Data.windowHeightValue), parseFloat(case1Data.sillHeightValue), case1Data.airtempValue, case1Data.outdoorTempValue, case1Data.rvalueValue, case1Data.intLowEChecked, case1Data.intLowEEmissivity, case1Data.airspeedValue, case1Data.humidityValue, case1Data.metabolic, case1Data.clothingValue, ppdValue, ppdValue2);

}


function directNormalIrradiance(solarAngle) {
  let Idir;
  if (solarAngle <= 5) {
    Idir = map_range(solarAngle, 0, 5, 0, 210);
  } else if (solarAngle <= 10) {
    Idir = map_range(solarAngle, 5, 10, 210, 390);
  } else if (solarAngle <= 20) {
    Idir = map_range(solarAngle, 10, 20, 390, 620);
  } else if (solarAngle <= 30) {
    Idir = map_range(solarAngle, 20, 30, 620, 740);
  } else if (solarAngle <= 40) {
    Idir = map_range(solarAngle, 30, 40, 740, 810);
  } else if (solarAngle <= 50) {
    Idir = map_range(solarAngle, 40, 50, 810, 860);
  } else if (solarAngle <= 60) {
    Idir = map_range(solarAngle, 50, 60, 860, 890);
  } else if (solarAngle <= 70) {
    Idir = map_range(solarAngle, 60, 70, 890, 910);
  } else if (solarAngle <= 80) {
    Idir = map_range(solarAngle, 70, 80, 910, 920);
  } else if (solarAngle <= 90) {
    Idir = map_range(solarAngle, 80, 90, 920, 925);
  }
  return Idir;

}


function map_range(value, low1, high1, low2, high2) {
  return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}


function determinePPD(PMV) {

  let PPD = 100 - 95 * Math.E ** (-1 * (0.03353 * (PMV ** 4) + 0.2179 * (PMV ** 2)))
  return PPD;

}



function calculate_all(_update_view_factors) {
  update_zone();
  setTimeout(function () {
    if (_update_view_factors) {
      update_view_factors();
      // document.getElementById("calculating").style.display = "none";
    }
    do_fast_stuff();
  }, 1);
}

function update_zone() {
  remove_zone();
  set_wall_properties();
  render_zone();
}

function do_fast_stuff() {
  update_shortwave_components();
  update_visualization();
}

function setOpacity(opacity) {
  for (var i = 0; i < scene.children.length; i++) {
    var ch = scene.children[i];
    if (ch.hasOwnProperty("material")) {
      ch.material.opacity = opacity / 100;
    }
  }
}

function onDocumentMouseMove(event) {
  event.preventDefault();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}


function calculate_view_factors(point) {
  // console.log(point.x, point.y)
  mrt.occupant.position.x = point.x;
  mrt.occupant.position.y = point.y;
  var my_vfs = mrt.view_factors();
  return my_vfs;
}

function get_window_objects() {
  var window_names = [];
  _.each(mrt.walls, function (w) {
    if (params[w.name].panel.window && params[w.name].panel.active) {
      for (let i = 0; i < mrt.walls[0].subsurfaces.length; i++) {
        window_names.push(w.name + "panel" + (i + 1));
      }
    }
  });

  var window_objects = _.map(window_names, function (window_name) {
    var w = _.find(scene.children, function (o) {
      return o.name == window_name;
    });
    return w;
  });

  return window_objects;
}

function get_window_object_vfs(window_objects, i) {
  var window_object_vfs = _.map(window_objects, function (w) {
    return _.find(view_factors[i], function (o) {
      return o.name == w.name;
    }).view_factor;
  });
  return window_object_vfs;
}

function drawGrid() {

  let colorCount = 0;

  //CREATE GRID AT Z-HEIGHT 0
  const gridMaterial = new THREE.MeshLambertMaterial({
    color: 0xeeeeee,
    transparent: true,
    opacity: 0.7
  });

  let geometry = new THREE.PlaneBufferGeometry(0.9, 0.9);

  for (let i = 0; i < mrt.room.width; i++) {
    for (let j = 0; j < mrt.room.depth; j++) {
      let my_point = new THREE.Vector3(0, 0, 0);
      let cursorPoint = new THREE.Vector3(i + 0.5, j + 0.5, 0)
      my_point.x = cursorPoint.x - mrt.room.width / 2;
      my_point.y = cursorPoint.y - mrt.room.depth / 2;
      my_point.z = 0;

      var point_view_factors = calculate_view_factors(cursorPoint);
      var longwave_mrt = mrt.calc(point_view_factors);

      var window_objects = get_window_objects();

      if (window_objects) {
        var window_object_vfs = _.map(window_objects, function (w) {
          return _.find(point_view_factors, function (o) {
            return o.name == w.name;
          }).view_factor;
        });
        var my_erf = calculate_erf_point(
          my_point,
          solarcal.skydome_center,
          window_objects,
          window_object_vfs
        );
      } else {
        my_erf = {
          dMRT_direct: 0,
          dMRT_diff: 0,
          dMRT_refl: 0,
          dMRT: 0,
          ERF: 0
        };
      }

      if (params.display === "Longwave MRT") {
        display_value = longwave_mrt;
      } else if (params.display === "MRT") {
        display_value = longwave_mrt + my_erf.dMRT;
      } else if (params.display === "Shortwave dMRT") {
        display_value = my_erf.dMRT;
      } else if (params.display === "Direct shortwave dMRT") {
        display_value = my_erf.dMRT_direct;
      } else if (params.display === "Diffuse shortwave dMRT") {
        display_value = my_erf.dMRT_diff;
      } else if (params.display === "Reflected shortwave dMRT") {
        display_value = my_erf.dMRT_refl;
      } else if (params.display === "PMV") {
        var mrt_total = longwave_mrt + my_erf.dMRT;
        var my_pmv = comf.pmvElevatedAirspeed(
          comfort.ta,
          mrt_total,
          comfort.vel,
          comfort.rh,
          comfort.met,
          comfort.clo,
          0
        );
        display_value = my_pmv.pmv;
      }
      // console.log(cursorPoint.x, cursorPoint.z, display_value.toFixed(1));

      var mrt_total = longwave_mrt + my_erf.dMRT;
      var my_pmv = comf.pmvElevatedAirspeed(
        comfort.ta,
        mrt_total,
        comfort.vel,
        comfort.rh,
        comfort.met,
        comfort.clo,
        0
      );


      const plane = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
        // color: new THREE.Color(`rgb(255,`+parseInt(255 -multiDimResults[n][m].dwnSpd*2)+`,`+parseInt(255 -multiDimResults[n][m].dwnSpd*2)+`)`),
        color: new THREE.Color(`rgb(255,` + (255 - parseInt(display_value * 2)) + `,` + (255 - parseInt(display_value * 2)) + `)`),
        side: THREE.DoubleSide
      }));
      plane.translateX(i - mrt.room.width/2);
      plane.translateY(j - mrt.room.depth/2);
      plane.translateZ(-1);

      plane.name = "grid1";
      plane.userData = {
        longwaveMRT: longwave_mrt,
        mrt: longwave_mrt + my_erf.dMRT,
        shortwaveMRT: my_erf.dMRT,
        directShortwaveMRT: my_erf.dMRT_direct,
        diffuseShortwaveMRT: my_erf.dMRT_diff,
        reflectedShortwaveMRT: my_erf.dMRT_refl,
        pmv: my_pmv.pmv
      }
      // console.log(cursorPoint.x, cursorPoint.z, plane.userData)
      // scene.add(plane);
      colorCount++;
    }
  }
}


function update_view_factors() {
  view_factors = _.map(plane.geometry.vertices, function (v) {
    var my_vector = new THREE.Vector3();
    my_vector.copy(v);
    my_vector.applyMatrix4(plane.matrixWorld);
    mrt.occupant.position.x = my_vector.x;
    mrt.occupant.position.y = my_vector.z;
    var vfs = mrt.view_factors();
    var vfsum = 0;
    for (var i = 0; i < vfs.length; i++) {
      vfsum += vfs[i].view_factor;
    }
    norm_factor = 1.0 / vfsum;
    for (var i = 0; i < vfs.length; i++) {
      vfs[i].view_factor *= norm_factor;
    }
    return vfs;
  });
  view_factors_need_updating = false;
}

function update_shortwave_components() {
  var window_objects = get_window_objects();
  var window_object_vfs = get_window_object_vfs(solarcal.window_objects);

  var r = 1.3 * _.max(mrt.room);

  var floor = _.find(scene.children, function (c) {
    return c.name == "floor";
  });
  solarcal.skydome_center = new THREE.Vector3(0, 0, 0);
  for (var i = 0; i < floor.geometry.vertices.length; i++) {
    var v = floor.geometry.vertices[i];
    solarcal.skydome_center.add(v);
  }
  solarcal.skydome_center.divideScalar(4);

  alt_rad = Math.PI / 2 - (Math.PI * solarcal.alt) / 180;
  az_rad = (Math.PI * solarcal.az) / 180;

  sun.position.x =
    solarcal.skydome_center.x + r * Math.sin(alt_rad) * Math.cos(az_rad);
  sun.position.y = solarcal.skydome_center.y + r * Math.cos(alt_rad);
  sun.position.z =
    solarcal.skydome_center.z + r * Math.sin(alt_rad) * Math.sin(az_rad);

  if (window_objects) {
    ERF_vertex_values = _.map(plane.geometry.vertices, function (v, i) {
      window_object_vfs = get_window_object_vfs(window_objects, i);
      return calculate_erf_point(
        v,
        solarcal.skydome_center,
        window_objects,
        window_object_vfs
      );
    });
  } else {
    // if no window object, all components are zero
    ERF_vertex_values = _.map(plane.geometry.vertices, function () {
      return {
        dMRT_direct: 0,
        dMRT_diff: 0,
        dMRT_refl: 0,
        dMRT: 0,
        ERF: 0
      };
    });
  }
}

function calculate_erf_point(
  v,
  skydome_center,
  window_objects,
  window_object_vfs
) {
  // Check direct exposure
  var my_vector = new THREE.Vector3();
  my_vector.copy(v);
  my_vector.z = -my_vector.y;
  my_vector.y = 1
  my_vector.applyMatrix4(plane.matrixWorld);

  // this vector is used for the sun's position in
  // computations whereas the sun object is an icon
  var my_sun_dir = new THREE.Vector3();
  my_sun_dir.copy(sun.position);
  my_sun_dir.sub(skydome_center);
  my_sun_dir.multiplyScalar(1000);
  my_sun_dir.add(skydome_center);
  my_sun_dir.sub(my_vector);

  var sun_position = new THREE.Vector3();
  sun_position.copy(my_sun_dir);
  sun_position.normalize();

  raycaster.set(my_vector, sun_position);

  var tsol_factor = 0;
  var tsol = 0;
  for (var i = 0; i < window_objects.length; i++) {
    var window_object = window_objects[i];
    var intersects = raycaster.intersectObject(window_object);
    if (intersects.length != 0) {
      var v_normal = window_object.geometry.faces[0].normal;
      var relative_sun_position = new THREE.Vector3();
      relative_sun_position.copy(sun.position);
      relative_sun_position.sub(skydome_center);
      relative_sun_position.normalize();
      var dot = v_normal.dot(relative_sun_position);
      var th = (180 * Math.acos(dot)) / Math.PI;
      if (th > 90) th = 180 - th;

      // var window_object_parent = window_object.name.replace("panel1", "");
      // var tsol = params[window_object_parent].panel.tsol;

      var window_object_parent = "window1";
      var tsol = 0.8;

      // this equation is a fit of an empirical model of
      // clear glass transmittance as a function of angle
      // of incidence, from ASHRAE Handbook 1985 27.14.
      var tsol_factor = -7e-8 * Math.pow(th, 4) +
        7e-6 * Math.pow(th, 3) -
        0.0002 * Math.pow(th, 2) +
        0.0016 * th +
        0.997;
      //scene.add(new THREE.ArrowHelper( sun_position, my_vector, 10, 0x00ff00))

      break;
    }
  }

  var svvf = _.reduce(
    window_object_vfs,
    function (memo, num) {
      return memo + num;
    },
    0
  );
  var sharp = solarcal.az - (180 * mrt.occupant.azimuth) / Math.PI;
  if (sharp < 0) sharp += 360;
  var my_erf = ERF(
    solarcal.alt,
    sharp,
    mrt.occupant.posture,
    solarcal.Idir,
    tsol,
    svvf,
    solarcal.fbes,
    solarcal.asa,
    tsol_factor
  );
  return my_erf;
}

function update_visualization() {
  if (view_factors_need_updating) {
    var vertex_colors = _.map(view_factors, function () {
      return new THREE.Color(1, 1, 1);
    });
    // document.getElementById("scale-maximum").innerHTML = "-";
    // document.getElementById("scale-minimum").innerHTML = "-";
  } else {
    var vertex_values;
    if (params.display == "MRT") {
      vertex_values = _.map(view_factors, function (vfs, i) {
        return mrt.calc(vfs) + ERF_vertex_values[i].dMRT;
      });
    } else if (params.display == "Longwave MRT") {
      vertex_values = _.map(view_factors, function (vfs) {
        return mrt.calc(vfs);
      });
    } else if (params.display == "Shortwave dMRT") {
      vertex_values = _.map(ERF_vertex_values, function (v) {
        return v.dMRT;
      });
    } else if (params.display == "Direct shortwave dMRT") {
      vertex_values = _.map(ERF_vertex_values, function (v) {
        return v.dMRT_direct;
      });
    } else if (params.display == "Diffuse shortwave dMRT") {
      vertex_values = _.map(ERF_vertex_values, function (v) {
        return v.dMRT_diff;
      });
    } else if (params.display == "Reflected shortwave dMRT") {
      vertex_values = _.map(ERF_vertex_values, function (v) {
        return v.dMRT_refl;
      });
    } else if (params.display == "PMV") {
      var mrt_values = _.map(view_factors, function (vfs, i) {
        return mrt.calc(vfs) + ERF_vertex_values[i].dMRT;
      });
      vertex_values = _.map(mrt_values, function (mrt_val) {
        var my_pmv = comf.pmvElevatedAirspeed(
          comfort.ta,
          mrt_val,
          comfort.vel,
          comfort.rh,
          comfort.met,
          comfort.clo,
          0
        );
        return my_pmv.pmv;
      });
    }

    if (params.autoscale) {
      scale_min = _.min(vertex_values);
      scale_max = _.max(vertex_values);
    } else {
      scale_min = params.scaleMin;
      scale_max = params.scaleMax;
    }

    // document.getElementById("scale-maximum").innerHTML = scale_max.toFixed(1);
    // document.getElementById("scale-minimum").innerHTML = scale_min.toFixed(1);
    var vertex_colors = _.map(vertex_values, function (v) {
      var value_range = scale_max - scale_min;
      if (value_range == 0) {
        return new THREE.Color(0, 0, 1);
      } else {
        var r = (v - scale_min) / (scale_max - scale_min);
        return new THREE.Color(r, 0, 1 - r);
      }
    });
  }

  var faceIndices = ["a", "b", "c"];
  for (var i = 0; i < plane.geometry.faces.length; i++) {
    var f = plane.geometry.faces[i];
    f.vertexColors = [];
    for (var j = 0; j < 3; j++) {
      var idx = f[faceIndices[j]];
      f.vertexColors.push(vertex_colors[idx]);
    }
  }
  plane.geometry.colorsNeedUpdate = true;
}

function gen_zone_geometry() {
  var wall1 = {
    vertices: [{
        x: 0,
        y: 0,
        z: 0
      },
      {
        x: mrt.room.width,
        y: 0,
        z: 0
      },
      {
        x: mrt.room.width,
        y: mrt.room.height,
        z: 0
      },
      {
        x: 0,
        y: mrt.room.height,
        z: 0
      },
    ],
    name: "wall1",
  };
  if (params.wall1.panel.active) {
    var u0 = params.wall1.panel.xposition;
    var v0 = params.wall1.panel.yposition;
    var w = Math.min(
      params.wall1.panel.width,
      mrt.room.width - (u0 + panelBorderMin)
    );
    var h = Math.min(
      params.wall1.panel.height,
      mrt.room.height - (v0 + panelBorderMin)
    );
    wall1.children = [{
      vertices: [{
          x: u0,
          y: v0,
          z: 0
        },
        {
          x: u0,
          y: v0 + h,
          z: 0
        },
        {
          x: u0 + w,
          y: v0 + h,
          z: 0
        },
        {
          x: u0 + w,
          y: v0,
          z: 0
        },
      ],
      radiant_t: params.wall1.panel.temperature,
      emissivity: params.wall1.panel.emissivity,
      name: "wall1panel1",
    }, {
      vertices: [{
          x: u0 + 5,
          y: v0,
          z: 0
        },
        {
          x: u0 + 5,
          y: v0 + h,
          z: 0
        },
        {
          x: u0 + w + 5,
          y: v0 + h,
          z: 0
        },
        {
          x: u0 + w + 5,
          y: v0,
          z: 0
        },
      ],
      radiant_t: params.wall1.panel.temperature,
      emissivity: params.wall1.panel.emissivity,
      name: "wall1panel2",
    }, ];
  } else {
    wall1.children = [];
  }

  var wall2 = {
    vertices: [{
        x: mrt.room.width,
        y: 0,
        z: 0
      },
      {
        x: mrt.room.width,
        y: mrt.room.height,
        z: 0
      },
      {
        x: mrt.room.width,
        y: mrt.room.height,
        z: mrt.room.depth
      },
      {
        x: mrt.room.width,
        y: 0,
        z: mrt.room.depth
      },
    ],
    name: "wall2",
  };
  if (params.wall2.panel.active) {
    var u0 = params.wall2.panel.xposition;
    var v0 = params.wall2.panel.yposition;
    var w = Math.min(
      params.wall2.panel.width,
      mrt.room.depth - (u0 + panelBorderMin)
    );
    var h = Math.min(
      params.wall2.panel.height,
      mrt.room.height - (v0 + panelBorderMin)
    );
    wall2.children = [{
      vertices: [{
          x: mrt.room.width,
          y: v0,
          z: u0
        },
        {
          x: mrt.room.width,
          y: v0 + h,
          z: u0
        },
        {
          x: mrt.room.width,
          y: v0 + h,
          z: u0 + w
        },
        {
          x: mrt.room.width,
          y: v0,
          z: u0 + w
        },
      ],
      radiant_t: params.wall2.panel.temperature,
      emissivity: params.wall2.panel.emissivity,
      name: "wall2panel1",
    }, ];
  } else {
    wall2.children = [];
  }

  var wall3 = {
    vertices: [{
        x: 0,
        y: 0,
        z: mrt.room.depth
      },
      {
        x: mrt.room.width,
        y: 0,
        z: mrt.room.depth
      },
      {
        x: mrt.room.width,
        y: mrt.room.height,
        z: mrt.room.depth
      },
      {
        x: 0,
        y: mrt.room.height,
        z: mrt.room.depth
      },
    ],
    name: "wall3",
  };

  if (params.wall3.panel.active) {
    var u0 = params.wall3.panel.xposition;
    var v0 = params.wall3.panel.yposition;
    var w = Math.min(
      params.wall3.panel.width,
      mrt.room.width - (u0 + panelBorderMin)
    );
    var h = Math.min(
      params.wall3.panel.height,
      mrt.room.height - (v0 + panelBorderMin)
    );
    wall3.children = [{
      vertices: [{
          x: u0,
          y: v0,
          z: mrt.room.depth
        },
        {
          x: u0,
          y: v0 + h,
          z: mrt.room.depth
        },
        {
          x: u0 + w,
          y: v0 + h,
          z: mrt.room.depth
        },
        {
          x: u0 + w,
          y: v0,
          z: mrt.room.depth
        },
      ],
      radiant_t: params.wall3.panel.temperature,
      emissivity: params.wall3.panel.emissivity,
      name: "wall3panel1",
    }, ];
  } else {
    wall3.children = [];
  }

  var wall4 = {
    vertices: [{
        x: 0,
        y: 0,
        z: 0
      },
      {
        x: 0,
        y: mrt.room.height,
        z: 0
      },
      {
        x: 0,
        y: mrt.room.height,
        z: mrt.room.depth
      },
      {
        x: 0,
        y: 0,
        z: mrt.room.depth
      },
    ],
    name: "wall4",
  };

  if (params.wall4.panel.active) {
    var u0 = params.wall4.panel.xposition;
    var v0 = params.wall4.panel.yposition;
    var w = Math.min(
      params.wall4.panel.width,
      mrt.room.depth - (u0 + panelBorderMin)
    );
    var h = Math.min(
      params.wall4.panel.height,
      mrt.room.height - (v0 + panelBorderMin)
    );
    wall4.children = [{
      vertices: [{
          x: 0,
          y: v0,
          z: u0
        },
        {
          x: 0,
          y: v0 + h,
          z: u0
        },
        {
          x: 0,
          y: v0 + h,
          z: u0 + w
        },
        {
          x: 0,
          y: v0,
          z: u0 + w
        },
      ],
      radiant_t: params.wall4.panel.temperature,
      emissivity: params.wall4.panel.emissivity,
      name: "wall4panel1",
    }, ];
  } else {
    wall4.children = [];
  }

  var ceiling = {
    vertices: [{
        x: 0,
        y: mrt.room.height,
        z: 0
      },
      {
        x: mrt.room.width,
        y: mrt.room.height,
        z: 0
      },
      {
        x: mrt.room.width,
        y: mrt.room.height,
        z: mrt.room.depth
      },
      {
        x: 0,
        y: mrt.room.height,
        z: mrt.room.depth
      },
    ],
    name: "ceiling",
  };

  if (params.ceiling.panel.active) {
    var u0 = params.ceiling.panel.xposition;
    var v0 = params.ceiling.panel.yposition;
    var w = Math.min(
      params.ceiling.panel.width,
      mrt.room.width - (u0 + panelBorderMin)
    );
    var h = Math.min(
      params.ceiling.panel.height,
      mrt.room.depth - (v0 + panelBorderMin)
    );
    ceiling.children = [{
      vertices: [{
          x: u0,
          y: mrt.room.height,
          z: v0
        },
        {
          x: u0 + w,
          y: mrt.room.height,
          z: v0
        },
        {
          x: u0 + w,
          y: mrt.room.height,
          z: v0 + h
        },
        {
          x: u0,
          y: mrt.room.height,
          z: v0 + h
        },
      ],
      radiant_t: params.ceiling.panel.temperature,
      emissivity: params.ceiling.panel.emissivity,
      name: "ceilingpanel1",
    }, ];
  } else {
    ceiling.children = [];
  }

  var floor = {
    vertices: [{
        x: 0,
        y: 0,
        z: 0
      },
      {
        x: mrt.room.width,
        y: 0,
        z: 0
      },
      {
        x: mrt.room.width,
        y: 0,
        z: mrt.room.depth
      },
      {
        x: 0,
        y: 0,
        z: mrt.room.depth
      },
    ],
    name: "floor",
  };

  if (params.floor.panel.active) {
    var u0 = params.floor.panel.xposition;
    var v0 = params.floor.panel.yposition;
    var w = Math.min(
      params.floor.panel.width,
      mrt.room.width - (u0 + panelBorderMin)
    );
    var h = Math.min(
      params.floor.panel.height,
      mrt.room.depth - (v0 + panelBorderMin)
    );
    floor.children = [{
      vertices: [{
          x: u0,
          y: 0,
          z: v0
        },
        {
          x: u0 + w,
          y: 0,
          z: v0
        },
        {
          x: u0 + w,
          y: 0,
          z: v0 + h
        },
        {
          x: u0,
          y: 0,
          z: v0 + h
        },
      ],
      radiant_t: params.floor.panel.temperature,
      emissivity: params.floor.panel.emissivity,
      name: "floorpanel1",
    }, ];
  } else {
    floor.children = [];
  }

  var myZone = [wall1, wall2, wall3, wall4, ceiling, floor];
  return myZone;
}

function wallPanelGeometry(vertices) {
  var Nv = vertices.length;
  var geometry = new THREE.Geometry();
  for (var j = 0; j < Nv; j++) {
    geometry.vertices.push(
      new THREE.Vector3(vertices[j].x, vertices[j].y, vertices[j].z)
    );
  }
  for (var j = 0; j < Nv - 2; j++) {
    var face = new THREE.Face3(0, j + 1, j + 2);
    geometry.faces.push(face);
  }
  return geometry;
}

function wallPanelMesh(geometry) {
  var material = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    reflectivity: 100,
    transparent: true,
    opacity: 1.0,
  });
  material.side = THREE.DoubleSide;
  var uva = new THREE.Vector2(0, 0);
  var uvb = new THREE.Vector2(0, 1);
  var uvc = new THREE.Vector2(1, 1);
  var uvd = new THREE.Vector2(1, 0);

  geometry.faceVertexUvs[0].push([uva, uvb, uvc]);
  geometry.faceVertexUvs[0].push([uva.clone(), uvc, uvd.clone()]);
  geometry.computeFaceNormals();

  var mesh = new THREE.Mesh(geometry, material);
  return mesh;
}

function remove_zone() {
  var objsToRemove = _.rest(scene.children, 3);
  _.each(objsToRemove, function (object) {
    scene.remove(object);
  });
}

function render_zone() {
  // Grid

  var step = 1;
  var geometry = new THREE.Geometry();
  for (var i = 0; i <= mrt.room.depth; i += step) {
    geometry.vertices.push(new THREE.Vector3(0, 0, i));
    geometry.vertices.push(new THREE.Vector3(mrt.room.width, 0, i));
  }
  for (var i = 0; i <= mrt.room.width; i += step) {
    geometry.vertices.push(new THREE.Vector3(i, 0, 0));
    geometry.vertices.push(new THREE.Vector3(i, 0, mrt.room.depth));
  }

  var material = new THREE.LineBasicMaterial({
    color: 0xaaaaaa,
    opacity: 0.2
  });
  var line = new THREE.Line(geometry, material);
  line.type = THREE.LinePieces;
  // scene.add(line);

  var z = gen_zone_geometry();

  // plane has the same dimensions as the floor
  var margin = {
    x: mrt.room.width / 20,
    y: mrt.room.depth / 20,
  };
  var aspect_ratio = mrt.room.width / mrt.room.depth;
  var Nx = Math.floor(26.0 * aspect_ratio);
  var Ny = Math.floor(26.0 / aspect_ratio);
  var plane_geometry = new THREE.PlaneGeometry(
    mrt.room.width - margin.x,
    mrt.room.depth - margin.y,
    Nx,
    Ny
  );

  var material = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
    vertexColors: THREE.VertexColors,
  });

  plane = new THREE.Mesh(plane_geometry, material);
  plane.rotation.x = Math.PI / 2;
  plane.position.x = mrt.room.width / 2;
  plane.position.y = mrt.occupant.posture == "seated" ? 0.6 : 1.1;
  plane.position.z = mrt.room.depth / 2;
  plane.geometry.dynamic = true; // so that we can change the vertex colors
  plane.name = "visualization";
  // scene.add(plane);
  plane.updateMatrixWorld();

  // Surfaces

  var Np = z.length;
  var thetax, thetaz, thetay;
  for (var i = 0; i < Np; i++) {
    var p = z[i];
    var wall = wallPanelGeometry(p.vertices);

    if (p.children.length > 0) {
      wall.computeFaceNormals();
      var n0 = wall.faces[0].normal;

      var arg = Math.pow(n0.x, 2) + Math.pow(n0.z, 2);
      if (arg === 0) {
        thetay = 0;
      } else {
        thetay = Math.acos(n0.z / arg);
      }

      arg = Math.pow(n0.y, 2) + Math.pow(n0.z, 2);
      if (arg === 0) {
        thetax = 0;
      } else {
        thetax = Math.acos(n0.z / arg);
      }

      var t = new THREE.Matrix4();
      var u = new THREE.Matrix4();
      var ti = new THREE.Matrix4();
      t.makeRotationX(thetax);
      u.makeRotationY(thetay);
      t.multiply(u);
      ti.getInverse(t);

      // height translation to be applied later
      var h = new THREE.Matrix4();
      h.makeTranslation(
        wall.vertices[0].x,
        wall.vertices[0].y,
        wall.vertices[0].z
      );

      wall.applyMatrix(t);
      var wallShape = new THREE.Shape();
      wallShape.moveTo(wall.vertices[0].x, wall.vertices[0].y);

      for (var j = 1; j < wall.vertices.length; j++) {
        var v = wall.vertices[j];
        wallShape.lineTo(v.x, v.y);
      }

      for (var k = 0; k < p.children.length; k++) {
        var panel = wallPanelGeometry(p.children[k].vertices);
        panel.applyMatrix(t);
        var hole = new THREE.Path();
        hole.moveTo(panel.vertices[0].x, panel.vertices[0].y);
        for (var kk = panel.vertices.length - 1; kk > 0; kk--) {
          hole.lineTo(panel.vertices[kk].x, panel.vertices[kk].y);
        }
        wallShape.holes.push(hole);

        panel.applyMatrix(ti);
        var mesh = wallPanelMesh(panel);
        mesh.name = p.children[k].name;
        scene.add(mesh);
        surfaces.push(mesh);
      }
      wall = new THREE.ShapeGeometry(wallShape);
      wall.applyMatrix(ti);
      wall.applyMatrix(h);
    }

    // wall texture
    //var wall_texture = THREE.ImageUtils.loadTexture( 'img/wall1.jpg' );
    var material = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      //map: wall_texture,
      //bumpMap: wall_texture,
      reflectivity: 100,
      transparent: true,
      opacity: 1.0,
    });

    material.side = THREE.DoubleSide;
    var mesh = new THREE.Mesh(wall, material);

    var uva = new THREE.Vector2(0, 0);
    var uvb = new THREE.Vector2(0, 1);
    var uvc = new THREE.Vector2(1, 1);
    var uvd = new THREE.Vector2(1, 0);

    mesh.geometry.faceVertexUvs[0].push([uva, uvb, uvc]);
    mesh.geometry.faceVertexUvs[0].push([uva.clone(), uvc, uvd.clone()]);

    mesh.geometry.computeFaceNormals();
    mesh.geometry.computeVertexNormals();

    mesh.name = p.name;
    mesh.translateZ(50)
    scene.add(mesh);
    surfaces.push(mesh);

    setOpacity(params.opacity);

    // edges
    var egh = new THREE.EdgesHelper(mesh, 0x444444);
    egh.material.linewidth = 2;
    // scene.add(egh);
  }
}