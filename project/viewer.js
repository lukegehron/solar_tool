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



// init('myCanvas');
init('myCanvas00');
// init();
initTweakPane();
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
  geometry = new THREE.PlaneBufferGeometry(0.18, 0.18);
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
    expanded: false,
    container: document.getElementById('climate_pane'),
    title: 'Climate',
  })

  climate_pane.addInput(CLIMATE_PARAMS, 'longitude');
  climate_pane.addInput(CLIMATE_PARAMS, 'latitude');
  climate_pane.addInput(CLIMATE_PARAMS, 'timeZoneOffset');

  const time_pane = new Tweakpane({
    expanded: false,
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
    expanded: false,
    title: 'Geometry',
  });

  const roomPanel = room_pane.addFolder({
    expanded: false,
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

  const mrt_pane = new Tweakpane({
    expanded: false,
    container: document.getElementById('mrt_pane'),
    title: 'MRT',
  })

  mrt_pane.addInput(SUMMER_COMFORT_PARAMS, 'directNormalIrradiance');
  mrt_pane.addInput(SUMMER_COMFORT_PARAMS, 'fractionOfBodyExposed');
  mrt_pane.addInput(SUMMER_COMFORT_PARAMS, 'shortWaveAbsorpivity');
  mrt_pane.addInput(SUMMER_COMFORT_PARAMS, 'TSol');
  mrt_pane.addInput(SUMMER_COMFORT_PARAMS, 'SHGCIndirect');
  mrt_pane.addInput(SUMMER_COMFORT_PARAMS, 'TSolShading');


  // global_pane.on('change', (value) => {-349,-519,-88,94,72,-41,93,65,-41,97,62,-41,-209,400,-96,-8,201,-73,-42,216,-76,-128,234,-83,-145,257,-86,-158,281,-88,-165,312,-91,-163,340,-93,-153,370,-96,-99,219,-80,-245,386,-101,26,208,-71,-183,467,-102,-229,331,-91,-205,230,-85,162,-50,-41,90,75,-41,145,11,-41,139,0,-41,117,-4,-41,106,2,-41,102,14,-41,92,20,-41,100,25,-41,93,32,-41,84,31,-41,169,33,-41,165,24,-41,161,15,-41,157,6,-41,153,-3,-41,148,-12,-41,144,-21,-41,-192,444,-99,-201,422,-98,-219,376,-94,-225,352,-92,-229,303,-89,-224,276,-88,-217,251,-86,-190,209,-83,-172,187,-81,43,8,-41,36,15,-41,26,25,-41,18,33,-41,10,40,-41,-11,75,-44,-6,66,-42,-1,57,-41,4,48,-41,-6,-166,-41,227,-128,-44,-134,-158,-41,181,-73,-43,-179,-282,-41,40,-119,-41,31,-131,-41,64,-168,-41,70,-158,-41,84,-157,-41,175,-181,-42,271,-583,-41,109,-656,-42,100,-642,-41,202,-661,-33,230,-638,-34,229,-671,-33,51,-407,-41,-2,-421,-41,-2,-433,-41,10,-484,-42,71,-440,-41,-54,439,-101,-77,401,-98,-58,393,-96,-46,390,-95,-42,399,-96,-41,427,-98,-161,165,-80,-84,94,-56,-73,55,-48,-61,59,-47,-83,43,-48,-22,89,-47,12,103,-47,3,99,-47,-5,96,-47,-14,93,-47,67,-438,-41,66,-443,-41,-149,-612,-51,-28,-438,-41,-29,-437,-41,-28,-437,-41,-160,-419,-44,293,6,-65,279,34,-62,307,28,-70,283,81,-68,314,-157,-66,300,-130,-62,328,-135,-75,328,-195,-74,303,-180,-62,307,-211,-68,342,-200,-80,328,-222,-77,338,-339,-79,352,-317,-84,317,-328,-71,313,-297,-72,337,-312,-80,338,-252,-82,310,-247,-72,324,-274,-76,385,-368,-90,370,-341,-88,398,-346,-97,398,-405,-91,373,-391,-86,377,-422,-86,412,-411,-95,399,-433,-90,389,-316,-95,402,-294,-99,367,-305,-89,363,-274,-88,388,-288,-95,388,-229,-94,360,-224,-86,375,-251,-91,377,-106,-89,363,-79,-87,391,-84,-93,390,-143,-91,366,-129,-86,370,-160,-86,405,-149,-97,391,-171,-91,400,-201,-95,373,-195,-87,340,-107,-81,354,-172,-82,405,-219,-98,376,-392,-87,333,-362,-76,346,-399,-79,322,-385,-69,326,-416,-67,361,-405,-83,347,-427,-78,352,-485,-72,365,-463,-81,330,-474,-64,326,-443,-64,351,-457,-75,382,-480,-85,378,-449,-85,474,-428,-112,477,-459,-112,446,-437,-106,422,-422,-98,426,-453,-98,461,-442,-111,447,-464,-106,443,-406,-106,457,-384,-110,422,-395,-100,418,-364,-102,442,-378,-106,429,-341,-103,472,-372,-112,456,-203,-111,459,-253,-112,463,-284,-112,484,-295,-112,494,-412,-112,508,-390,-112,473,-401,-112,469,-370,-112,493,-385,-112,466,-320,-112,480,-347,-112,420,-253,-102,406,-226,-98,434,-231,-104,433,-291,-105,409,-276,-100,413,-307,-102,448,-296,-110,434,-319,-105,424,-202,-103,509,-480,-112,498,-504,-112,502,-534,-112,537,-523,-112,523,-546,-112,458,-474,-109,471,-512,-112,447,-497,-106,450,-528,-107,472,-539,-112,476,-598,-112,490,-575,-112,455,-586,-109,506,-592,-112,503,-562,-112,407,-582,-95,411,-613,-96,380,-590,-84,355,-576,-73,359,-607,-78,394,-596,-90,376,-560,-81,390,-538,-88,355,-549,-72,351,-518,-70,375,-532,-80,362,-495,-76,405,-526,-94,428,-566,-102,441,-544,-106,406,-555,-95,413,-501,-96,434,-155,-105,419,-90,-103,452,-178,-111,449,-143,-110,421,-183,-103,407,-118,-99,379,56,-90,393,-9,-93,409,-43,-99,395,22,-94,368,146,-100,383,80,-93,366,115,-92,352,180,-101,312,232,-99,326,167,-90,341,226,-107,366,204,-108,328,198,-97,459,-628,-110,490,-623,-112,520,-618,-112,377,-645,-84,428,-652,-102,393,-662,-89,407,-640,-94,331,118,-84,302,124,-77,301,284,-108,327,296,-114,343,262,-113,301,186,-86,289,245,-96,-263,-57,-94,-283,-121,-91,-261,-140,-82,-241,-77,-88,-257,-170,-74,-229,-158,-63,-206,-145,-56,-242,-137,-74,-230,-109,-77,-216,-133,-65,-185,-82,-69,-207,-63,-81,-208,-94,-73,-286,-159,-87,-265,-95,-91,-226,25,-90,-247,-38,-93,-170,26,-69,-168,57,-71,-177,-13,-72,-191,12,-76,-203,-17,-82,-167,-25,-68,-190,-37,-76,-218,-49,-86,-202,44,-80,-222,-20,-89,-244,0,-94,-224,63,-88,-169,-65,-66,-150,-8,-62,-152,-46,-63,-125,-3,-56,-118,31,-57,-144,26,-62,-110,59,-58,-139,52,-63,-150,100,-71,-154,74,-70,-129,79,-64,-178,105,-77,-180,74,-75,-146,123,-73,-125,102,-66,-192,152,-84,-173,119,-78,-169,148,-79,-204,84,-82,-238,70,-92,-260,90,-97,-215,131,-86,-216,100,-85,-269,-177,-78,-264,-206,-68,-293,-195,-84,-286,-214,-75,-282,-243,-64,-276,-269,-54,-299,-294,-58,-292,-323,-50,-298,-354,-52,-281,-377,-48,-274,-406,-51,-280,-436,-69,-254,-431,-52,-240,-454,-58,-246,-485,-71,-220,-479,-61,-234,-512,-70,-208,-506,-64,-311,-232,-81,-318,-400,-73,-325,-381,-73,-300,-363,-54,-288,-451,-74,-296,-432,-73,-300,-402,-65,-270,-471,-73,-259,-498,-73,-245,-562,-73,-257,-535,-74,-220,-576,-69,-232,-549,-71,-239,-588,-72,-282,-541,-78,-284,-503,-78,-296,-477,-78,-305,-442,-76,-417,-123,-99,-439,-88,-97,-424,-34,-97,-435,-174,-98,-414,71,-97,-489,83,-96,-497,163,-97,-467,181,-98,-396,43,-98,-380,-30,-99,-398,-76,-99,-381,-156,-99,-340,-106,-98,-347,-74,-100,-381,81,-98,-409,162,-99,-519,-173,-95,-348,54,-100,-333,92,-101,-313,-2,-101,-328,-40,-100,-284,-29,-99,-283,23,-101,-248,9,-95,-258,41,-98,-281,61,-101,-261,81,-98,-295,68,-101,-272,188,-98,-271,219,-99,-260,171,-97,-248,240,-97,-236,161,-92,-234,192,-94,-280,151,-100,-224,145,-88,-257,131,-91,-306,145,-101,-287,166,-100,-297,213,-101,-299,182,-101,-300,120,-101,-274,126,-98,-430,412,-101,-460,394,-99,-466,423,-99,-429,449,-102,-352,422,-105,-389,434,-103,-351,459,-105,-242,446,-106,-303,459,-106,-303,502,-106,-232,485,-106,-272,476,-106,-259,414,-106,-349,277,-103,-426,215,-99,-311,242,-102,-310,272,-103,-247,252,-96,-261,299,-100,-283,278,-102,-285,247,-101,-289,303,-103,-266,323,-102,-284,338,-105,-261,359,-103,-304,299,-103,-310,323,-105,-349,168,-102,-360,217,-102,-279,-530,-77,-284,-505,-78,-322,-507,-85,-335,-495,-87,-336,-577,-87,-315,-555,-84,-303,-582,-82,-316,-535,-84,-459,-293,-96,-412,-276,-96,-474,-362,-95,-426,-346,-96,-410,-424,-94,-449,-408,-95,-324,-265,-78,-317,-284,-70,-313,-313,-63,-342,-302,-80,-329,-352,-71,-366,-289,-90,-361,-238,-94,-338,-258,-86,-331,-229,-88,-332,-209,-91,-340,-376,-79,-348,-356,-80,-344,-413,-85,-352,-327,-83,-329,-188,-92,-304,-170,-90,-311,-151,-92,-315,-119,-95,-301,-106,-94,-328,-457,-85,-343,-452,-87,-369,-458,-90,-361,-477,-89,-388,-492,-91,-395,-473,-91,-405,-483,-92,-438,-482,-94,-449,-461,-94,-379,-437,-91,-407,-366,-94,-400,-397,-93,-373,-391,-89,-385,-336,-92,-436,-212,-97,-155,-509,-49,-129,-504,-47,-105,-518,-45,-81,-512,-43,-75,-541,-43,-67,-579,-43,-79,-595,-43,-151,-529,-49,-151,-574,-51,-57,-507,-43,-338,-671,-89,-336,-730,-86,-311,-712,-81,-304,-741,-81,-308,-693,-80,-314,-666,-86,-195,-665,-67,-190,-691,-62,-185,-740,-61,-193,-711,-64,-172,-688,-55,-178,-661,-62,363,-629,-81,312,-623,-60,346,-612,-73,333,-635,-69,329,-662,-68,359,-657,-81,281,-640,-49,301,-668,-60,305,-641,-59,122,-717,-42,147,346,-84,159,330,-82,227,354,-106,130,424,-106,76,412,-93,61,442,-102,42,457,-104,9,449,-100,13,430,-97,-590,329,-96,-621,348,-95,-574,422,-96,-386,-654,-92,-154,-616,-54,-103,-379,-41,-102,-372,-41,475,-570,-112
  global_pane.on('change', (value) => {
    // console.log('changed: ' + String(value));
    // console.log(ROOM_PARAMS)
    updateParams();
  });

  mrt_pane.on('change', (value) => {
    // console.log('changed: ' + String(value));
    // console.log(ROOM_PARAMS)
    updateParams();
  });

  set_wall_properties();
  render_zone();
  update_view_factors();
  update_shortwave_components();
  update_visualization();
  // drawGrid();
  // calculate_all();
  updateRoom();
  cornerSunPath()

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

function cornerSunPath(){
  // MAKE SUN PATH CORNER GRAPHIC

  // console.log(xPointLoc, yPointLoc)

  let geometry = new THREE.CircleGeometry( 0.8, 32 );
  let material = new THREE.MeshBasicMaterial( { color: 0xcccccc } );
  let circle = new THREE.Mesh( geometry, material );
  circle.position.x = 6
      circle.position.y = 3.5
      circle.position.z = -1
scene.add( circle );

  console.log(coordinates)
  for(let i = 0; i < coordinates.length; i++){
    if(coordinates[i][1] != null && coordinates[i][1] > 0){  
      if(i % 4 == 0){

      
      const geometry = new THREE.SphereGeometry( 0.05, 32, 32 );
      const material = new THREE.MeshBasicMaterial( {color: 0x333333} );
      const sphere = new THREE.Mesh( geometry, material );
  
      // sphere.rotation.set(xPointLoc[i], yPointLoc[i], 0)

      sphere.position.x = 6
      sphere.position.y = 3.5
      sphere.position.z = -1

      var axis = new THREE.Vector3( 0, 0, 1 ).normalize();
  
      sphere.rotateOnWorldAxis(axis, 45*Math.PI/180)

      var axis = new THREE.Vector3( 1, 0, 0 ).normalize();
  
      sphere.rotateOnWorldAxis(axis, coordinates[i][1]*Math.PI/180)

      var axis = new THREE.Vector3( 0, 0, 1 ).normalize();
  
      sphere.rotateOnWorldAxis(axis, coordinates[i][0]*Math.PI/180)
  
      sphere.translateX(0.5)
      sphere.translateY(0.5)
      // sphere.translateZ(0.5)
      scene.add( sphere );
      // console.log("hi")
    }
    }

    
    
    // sphere.position.y = 0.5

    

    // sphere.position.x = xPointLoc[i]*0.1
    // sphere.position.y = yPointLoc[i]*0.1
    

    // pivot = new THREE.Group();
    // pivot.position.set( 0.0, 0.0, 0 );
    // mesh.add( pivot );
    // pivot.add( sphere );

  
  }

  var dir = new THREE.Vector3( 0, 1, 0 ).normalize();
  var origin = new THREE.Vector3( 6, 3.5, -0.98 )
  var length = 0.8


  var arrowHelper = new THREE.ArrowHelper(dir, origin, length, 0x000000 , 0.3, 0.3);
  scene.add(arrowHelper);

  const loader = new THREE.FontLoader();

loader.load( 'fonts/helvetiker_regular.typeface.json', function ( font ) {

	const textGeo = new THREE.TextGeometry( 'N', {
		font: font,
		size: 0.2,
		height: 0.005,
		curveSegments: 12,
		bevelEnabled: false
  } );
  var textMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
  var textMesh = new THREE.Mesh(textGeo, textMaterial);
  textMesh.position.x = 5.9;
  textMesh.position.y = 3.1;
  textMesh.position.z = -0.99;
  // textMesh.rotation.x = -Math.PI / 2;
  // textMesh.rotation.z = -Math.PI / 2;
  scene.add(textMesh);
} );
  
  

//   roomOrientationValue = roomOrientationValue*-1
//   p.push();
//   p.translate(380,280);
//   p.strokeCap(p.SQUARE);
//   p.stroke(light_black+100);
//   p.strokeWeight(1);
//   p.noFill();
//   p.ellipse(0,0,75,45); //main circle
//   p.fill(light_black+100);
//   p.line(0,0,45*p.sin((roomOrientationValue+45)*(-3.1415926 / 180)), 27*p.cos((roomOrientationValue+45)*(-3.1415926 / 180)));
//   p.line(0,0,45*p.sin((roomOrientationValue+135)*(-3.1415926 / 180)), 27*p.cos((roomOrientationValue+135)*(-3.1415926 / 180)));
//   p.line(0,0,45*p.sin((roomOrientationValue+225)*(-3.1415926 / 180)), 27*p.cos((roomOrientationValue+225)*(-3.1415926 / 180)));
//   p.textAlign(p.CENTER, p.CENTER);
//   p.textSize(10);
//   p.text("N", 56*p.sin((roomOrientationValue-45)*(-3.1415926 / 180)), 34*p.cos((roomOrientationValue-45)*(-3.1415926 / 180)));
//   p.strokeWeight(4);
//   p.line(0,0,45*p.sin((roomOrientationValue-45)*(-3.1415926 / 180)), 27*p.cos((roomOrientationValue-45)*(-3.1415926 / 180)));
//   //p.translate(36*p.sin((roomOrientationValue+45)*(-3.1415926 / 180)), 22*p.cos((roomOrientationValue+45)*(-3.1415926 / 180)));
//   //p.point(0,0);
//   p.stroke(10);
//   p.strokeWeight(3);

//   p.strokeWeight(4);
//   p.stroke(light_black);
//   p.point(xPointLoc[0], yPointLoc[0]);
//   for (let i = 0; i < xPointLoc.length-1; i++){
//     p.strokeWeight(1);
//     //p.stroke(light_black);
//     p.line(xPointLoc[i], yPointLoc[i],xPointLoc[i+1], yPointLoc[i+1]);
//     p.strokeWeight(4);
//     //p.stroke(100);
//     p.point(xPointLoc[i+1], yPointLoc[i+1]);
//   }
//   p.strokeWeight(3);
//   p.stroke(100);
//   // for (let i = 0; i < xPointLoc.length; i++){
//   //   p.point(xPointLoc[i], yPointLoc[i]);
//   // }
//   p.pop();

// roomOrientationValue = roomOrientationValue*-1
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
  getSolar();
  doTrig();
  updateData(case1Data);
  // console.log(case1Data);

  let colorCount = 0;

  //CREATE GRID AT Z-HEIGHT 0
  const gridMaterial = new THREE.MeshLambertMaterial({
    color: 0xeeeeee,
    transparent: true,
    opacity: 0.7
  });

  let lenTEN = ROOM_PARAMS.length * 5;
  let depTEN = ROOM_PARAMS.depth * 5;

  let prevN = lenTEN / 2;
  for (let i = depTEN / -2; i < depTEN / 2; i++) {
    for (let j = lenTEN / -2; j < lenTEN / 2; j++) {
      // const material = new THREE.MeshBasicMaterial({
      //     color: 0x000000,
      //     side: THREE.DoubleSide
      // });
      // const plane = new THREE.Mesh(geometry, gridMaterial);
      if (isNaN(gridColorArray[colorCount])) {
        gridColorArray[colorCount] = gridColorArray[lenTEN];
      }


      // if(typeof resultsArray[colorCount] === 'undefined' || isNaN(resultsArray[colorCount].mrt)){
      //     resultsArray[colorCount] = resultsArray[colorCount - 1];
      // }

      // console.log(resultsArray[colorCount].mrt)
      // console.log(colorCount)
      // console.log(multiDimResults)
      // console.log(i*-2 / ROOM_PARAMS.depth -1 )
      let k = lenTEN / 2 + j
      let m = depTEN / 2 + i

      let n = parseInt(lenTEN / 2 - 1) - k;

      if (lenTEN % 2 != 1) {
        if (n < 0) {
          n = Math.abs(n + 1)

        }
      } else {
        if (n < 0) {
          n = Math.abs(n + 1)
          if (n >= Math.floor(lenTEN/ 2)) {
            n = Math.floor(lenTEN/ 2 - 1)
            // console.log(n)
          }
        }
      }

      // console.log(n,m) //m = i, n = j
      let j_1 = i  + depTEN / 2;
      let i_1 = j + lenTEN / 2;

      // console.log(i_1, j_1)

      if (typeof multiDimResults[n][m] === 'undefined' || isNaN(multiDimResults[n][m].ppd)) {
        multiDimResults[n][m] = multiDimResults[n][m - 1];
      }
      

      
      let dSolar = 0;

      if(isNaN(gridColorArray[colorCount]) == false || typeof gridColorArray[colorCount] !== 'undefined'){
        dSolar = gridColorArray[colorCount];
      }

      // console.log(dSolar)

      
      // colorCount++;


      let my_point = new THREE.Vector3(0, 0, 0);
      let cursorPoint = new THREE.Vector3(i_1 *0.2 - 0.4, j_1*0.2 + 0.1, 0)
      my_point.x = cursorPoint.x - mrt.room.width/ 2;
      my_point.y = cursorPoint.y - mrt.room.depth / 2;
      my_point.z = 0;

      var point_view_factors = calculate_view_factors(cursorPoint);
      var longwave_mrt = mrt.calc(point_view_factors);
      // console.log(longwave_mrt)

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


      // plane = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
      //   // color: new THREE.Color(`rgb(255,`+parseInt(255 -multiDimResults[n][m].dwnSpd*2)+`,`+parseInt(255 -multiDimResults[n][m].dwnSpd*2)+`)`),
      //   color: new THREE.Color(`rgb(255,` + (255 - parseInt(display_value * 2)) + `,` + (255 - parseInt(display_value * 2)) + `)`),
      //   side: THREE.DoubleSide
      // }));
      // plane.translateX(m - mrt.room.width/2);
      // plane.translateY(n - mrt.room.depth/2);
      // plane.translateZ(-1);

      multiDimResults[n][m].longwaveMRT = longwave_mrt;
      multiDimResults[n][m].mrt1 = longwave_mrt + my_erf.dMRT;
      multiDimResults[n][m].shortwaveMRT = my_erf.dMRT;
      multiDimResults[n][m].directShortwaveMRT = my_erf.dMRT_direct;
      multiDimResults[n][m].diffuseShortwaveMRT = my_erf.dMRT_diff;
      multiDimResults[n][m].reflectedShortwaveMRT= my_erf.dMRT_refl;
      multiDimResults[n][m].pmv1 = my_pmv.pmv;

      let combinedMRT = parseFloat(multiDimResults[n][m].mrt1)

      let finalPPD = comf.pmv(
        WINTER_COMFORT_PARAMS.airtempValue,
         combinedMRT, 
         WINTER_COMFORT_PARAMS.airspeedValue, 
         WINTER_COMFORT_PARAMS.humidityValue, 
         WINTER_COMFORT_PARAMS.metabolic, 
         WINTER_COMFORT_PARAMS.clothingValue, 
         0.001)
        // comf.pmv(ta, tr, vel, rh, met, clo, wme)
        // returns [pmv, ppd]
        // ta, air temperature (°C)
        // tr, mean radiant temperature (°C)
        // vel, relative air velocity (m/s)
        // rh, relative humidity (%) Used only this way to input humidity level
        // met, metabolic rate (met)
        // clo, clothing (clo)
        // wme, external work, normally around 0 (met)


      let da;
      let colorMult = 2
      if(PARAMS1.model == 0){
        da = depTEN/ 2 + i;
        colorMult = 10
      }else if(PARAMS1.model == 1){
        da = lenTEN / 2 + j;
        colorMult = 10
      }else if(PARAMS1.model == 2){
        da = dSolar;
        colorMult = 5
      }else if(PARAMS1.model == 3){
        da = multiDimResults[n][m].dwnSpd;
        colorMult = 100
      }else if(PARAMS1.model == 4){
        da = multiDimResults[n][m].dwnTmp;
        colorMult = -100
      }else if(PARAMS1.model == 5){
        da = multiDimResults[n][m].glzfac;
        colorMult = 4
      }else if(PARAMS1.model == 6){
        da = multiDimResults[n][m].govPPD;
      }else if(PARAMS1.model == 7){
        da = multiDimResults[n][m].mrt;
      }else if(PARAMS1.model == 8){
        da = multiDimResults[n][m].mrtppd;
      }else if(PARAMS1.model == 9){
        da = multiDimResults[n][m].pmv;
      }else if(PARAMS1.model == 10){
        colorMult = -100
        da = multiDimResults[n][m].ppd;
      }else if(PARAMS1.model == 11){
        da = multiDimResults[n][m].tarDist;
        colorMult = 5
      }else if(PARAMS1.model == 12){
        da = multiDimResults[n][m].longwaveMRT;
      }else if(PARAMS1.model == 13){
        da = multiDimResults[n][m].mrt1;
      }else if(PARAMS1.model == 14){
        da = multiDimResults[n][m].shortwaveMRT;
      }else if(PARAMS1.model == 15){
        da = multiDimResults[n][m].directShortwaveMRT;
      }else if(PARAMS1.model == 16){
        da = multiDimResults[n][m].diffuseShortwaveMRT;
        colorMult = 5
      }else if(PARAMS1.model == 17){
        da = multiDimResults[n][m].reflectedShortwaveMRT;
        colorMult = 5
      }else if(PARAMS1.model == 18){
        da = multiDimResults[n][m].pmv1;
        colorMult = 5
      }else{
        da = finalPPD.ppd
      }

      if(isNaN(parseFloat(da))){
        da = 0;
      }
      // console.log(n, m)

      // console.log(parseInt(da))

      let plane = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
        // color: new THREE.Color(`rgb(255,`+parseInt(255 -multiDimResults[n][m].dwnSpd*2)+`,`+parseInt(255 -multiDimResults[n][m].dwnSpd*2)+`)`),
        color: new THREE.Color(`rgb(255,`+parseInt(255 -da * colorMult)+`,`+parseInt(255 -da * colorMult)+`)`),
        // color: new THREE.Color(`rgb(255,` + (255 - gridColorArray[colorCount] * 2) + `,` + (255 - gridColorArray[colorCount] * 2) + `)`),
        side: THREE.DoubleSide
      }));

      


      plane.setRotationFromAxisAngle(new THREE.Vector3(0, 0, 1), util.degrees_to_radians(ROOM_PARAMS.orientation));
      plane.translateX(j*.2 - 0.4);
      plane.translateY(i*.2 - 0.4);

      
      




      // plane.name = "grid1";
      plane.name = "grid";
      plane.userData = {
        loc_i: parseInt(ROOM_PARAMS.depth / 2 + i),
        loc_j: parseInt(ROOM_PARAMS.length / 2 + j),
        direct_solar: dSolar,
        dwnSpd: multiDimResults[n][m].dwnSpd,
        dwnTmp: multiDimResults[n][m].dwnTmp,
        glzfac: multiDimResults[n][m].glzfac,
        govPPD: multiDimResults[n][m].govPPD,
        mrt: multiDimResults[n][m].mrt,
        mrtppd: multiDimResults[n][m].mrtppd,
        pmv: multiDimResults[n][m].pmv,
        ppd: multiDimResults[n][m].ppd,
        tarDist: multiDimResults[n][m].tarDist,
        longwaveMRT: longwave_mrt,
        mrt1: longwave_mrt + my_erf.dMRT,
        shortwaveMRT: my_erf.dMRT,
        directShortwaveMRT: my_erf.dMRT_direct,
        diffuseShortwaveMRT: my_erf.dMRT_diff,
        reflectedShortwaveMRT: my_erf.dMRT_refl,
        pmv1: my_pmv.pmv,
        finalPPD: finalPPD
      }
      // scene.add(plane);
      // plane.userData = {
        
      // }
      // console.log(cursorPoint.x, cursorPoint.z, plane.userData)
      scene.add(plane);
      colorCount++;
    }
  }
  // console.log(multiDimResults)
  // console.log(gridColorArray)

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



  let windowMaterial = new THREE.MeshLambertMaterial({
    color: 0xccccff,
    transparent: true,
    opacity: 0.4,
    side: THREE.DoubleSide
  });
  for (let i = 0; i < r.glzCoords.length; i++) {
    const window = [];

    window.push(new THREE.Vector3(r.glzCoords[i][0][0] - 0.5, r.glzCoords[i][0][1] - ROOM_PARAMS.depth / 2 - 0.5, r.glzCoords[i][0][2] - ROOM_PARAMS.gridHeight));
    window.push(new THREE.Vector3(r.glzCoords[i][1][0] - 0.5, r.glzCoords[i][1][1] - ROOM_PARAMS.depth / 2 - 0.5, r.glzCoords[i][1][2] - ROOM_PARAMS.gridHeight));
    window.push(new THREE.Vector3(r.glzCoords[i][2][0] - 0.5, r.glzCoords[i][2][1] - ROOM_PARAMS.depth / 2 - 0.5, r.glzCoords[i][2][2] - ROOM_PARAMS.gridHeight));
    window.push(new THREE.Vector3(r.glzCoords[i][3][0] - 0.5, r.glzCoords[i][3][1] - ROOM_PARAMS.depth / 2 - 0.5, r.glzCoords[i][3][2] - ROOM_PARAMS.gridHeight));
    window.push(new THREE.Vector3(r.glzCoords[i][0][0] - 0.5, r.glzCoords[i][0][1] - ROOM_PARAMS.depth / 2 - 0.5, r.glzCoords[i][0][2] - ROOM_PARAMS.gridHeight));

    lineGeometry = new THREE.BufferGeometry().setFromPoints(window);
    line = new THREE.Line(lineGeometry, lineMaterial);
    line.name = "outline"
    line.setRotationFromAxisAngle(new THREE.Vector3(0, 0, 1), util.degrees_to_radians(ROOM_PARAMS.orientation));
    scene.add(line);

    const geometry1 = new THREE.PlaneBufferGeometry(r.windowWidth, r.windowHeight);
    geometry1.translate(((r.glzCoords[i][0][0] + r.glzCoords[i][1][0]) / 2) - 0.5, +ROOM_PARAMS.gridHeight - r.windowHeight / 2 - WINDOW_PARAMS.sillHeight, r.glzCoords[i][0][1] - ROOM_PARAMS.depth / 2 - 0.5);
    geometry1.rotateX(Math.PI * -0.5);
    const plane1 = new THREE.Mesh(geometry1, windowMaterial);

    plane1.name = "window";
    plane1.setRotationFromAxisAngle(new THREE.Vector3(0, 0, 1), util.degrees_to_radians(ROOM_PARAMS.orientation));
    scene.add(plane1);
  }

  //HORIZONTAL SHADES

  let shadeMaterial = new THREE.MeshLambertMaterial({
    color: 0x999999,
    // transparent: true,
    // opacity: 0.7,
    side: THREE.DoubleSide
  });

  for (let i = 0; i < r.glzCoords.length; i++) {
    for (let j = 0; j < HORIZONTAL_SHADE_PARAMS.number; j++) {
      const geometry1 = new THREE.PlaneBufferGeometry(r.windowWidth, HORIZONTAL_SHADE_PARAMS.depth);
      geometry1.translate(0, -HORIZONTAL_SHADE_PARAMS.depth / 2, 0);
      geometry1.rotateX(util.degrees_to_radians(HORIZONTAL_SHADE_PARAMS.angle));
      geometry1.translate(((r.glzCoords[i][0][0] + r.glzCoords[i][1][0]) / 2) - 0.5, ROOM_PARAMS.depth / -2 - 0.5 - .01 - HORIZONTAL_SHADE_PARAMS.dist, WINDOW_PARAMS.sillHeight - ROOM_PARAMS.gridHeight + WINDOW_PARAMS.heightFromSill - (HORIZONTAL_SHADE_PARAMS.spacing * j));
      // geometry1.rotateOnAxis()
      // geometry1.rotateX(Math.PI * -0.5);
      const plane1 = new THREE.Mesh(geometry1, shadeMaterial);

      plane1.name = "shade";
      plane1.setRotationFromAxisAngle(new THREE.Vector3(0, 0, 1), util.degrees_to_radians(ROOM_PARAMS.orientation));
      scene.add(plane1);
    }
  }

  //VERTICAL SHADES

  shadeMaterial = new THREE.MeshLambertMaterial({
    color: 0xeeeeee,
    // transparent: true,
    // opacity: 0.7,
    side: THREE.DoubleSide
  });


  for (let i = 0; i < r.glzCoords.length; i++) {
    for (let j = 0; j < VERTICAL_SHADE_PARAMS.number; j++) {
      let shadeHeight = r.windowHeight;
      if (VERTICAL_SHADE_PARAMS.fullHeight == 1) {
        shadeHeight = ROOM_PARAMS.ceilHeight;
      }
      const geometry1 = new THREE.PlaneBufferGeometry(VERTICAL_SHADE_PARAMS.depth, shadeHeight);
      geometry1.rotateX(Math.PI * -0.5);
      geometry1.rotateZ(Math.PI * -0.5);
      geometry1.translate(((r.glzCoords[i][0][0] + r.glzCoords[i][1][0]) / 2) - 0.5 + WINDOW_PARAMS.width / 2 - (VERTICAL_SHADE_PARAMS.spacing * j) - VERTICAL_SHADE_PARAMS.lrShift, ROOM_PARAMS.depth / -2 - 0.5 - VERTICAL_SHADE_PARAMS.depth / 2 - .01 - VERTICAL_SHADE_PARAMS.dist, WINDOW_PARAMS.sillHeight - ROOM_PARAMS.gridHeight + WINDOW_PARAMS.heightFromSill / 2);
      // geometry1.rotateOnAxis()
      // geometry1.rotateX(Math.PI * -0.5);
      const plane1 = new THREE.Mesh(geometry1, shadeMaterial);

      plane1.name = "shade";
      plane1.setRotationFromAxisAngle(new THREE.Vector3(0, 0, 1), util.degrees_to_radians(ROOM_PARAMS.orientation));
      scene.add(plane1);
    }
  }



}

// CHECKS INTERSECTIONS
function render() {
  raycaster.setFromCamera(mouse, camera);
  var intersects = raycaster.intersectObjects(scene.children);
  if (intersects.length > 0) {

    if (INTERSECTED != intersects[0].object) {
      if (INTERSECTED != null && INTERSECTED.name != null){
        // console.log(INTERSECTED.name)
      }


      // if (INTERSECTED) INTERSECTED.material.color.setHex(INTERSECTED.currentHex);

      if (INTERSECTED != null && INTERSECTED.name == "grid") {
        // console.log(INTERSECTED)
        // console.log(INTERSECTED.userData.direct_solar);
        let myDiv = document.getElementById("mdata");
        let txt = "";
        txt += "MRT: " + INTERSECTED.userData.mrt.toString() + "\n";
        txt += "Direct Solar: " + INTERSECTED.userData.direct_solar.toString() + "\n";
        txt += "Location: " + INTERSECTED.userData.loc_i.toString() + ", " + INTERSECTED.userData.loc_j.toString() + "\n";
        txt += "Glazing Factor " + INTERSECTED.userData.glzfac.toString() + "\n";
        txt += "MRTPPD: " + INTERSECTED.userData.mrtppd.toString() + "\n";
        txt += "PMV: " + INTERSECTED.userData.pmv.toString() + "\n";
        txt += "PPD: " + INTERSECTED.userData.ppd.toString() + "\n";
        // txt += "PPD2: " + determinePPD(INTERSECTED.userData.pmv) + "\n";

        if (TIME_PARAMS.studyType == 1) {
          txt += "Azmuth Altitute: " + coordinates[0] + "\n";
          var mRes = coordinates[0].toString().split(",");
          var mNum = parseFloat(mRes[1])
          txt += "Direct Normal Irradiance: " + directNormalIrradiance(parseFloat(mNum)).toString();
        }

        txt += "MRT: " + INTERSECTED.userData.mrt1.toString() + "\n";
        // txt += "Direct Solar: " + INTERSECTED.userData.direct_solar.toString() + "\n";
        txt += "LongwaveMRT: " + INTERSECTED.userData.longwaveMRT.toString() + "\n";
        txt += "shortwaveMRT: " + INTERSECTED.userData.shortwaveMRT.toString() + "\n";
        txt += "directShortwaveMRT: " + INTERSECTED.userData.directShortwaveMRT.toString() + "\n";
        txt += "diffuseShortwaveMRT: " + INTERSECTED.userData.diffuseShortwaveMRT.toString() + "\n";
        txt += "reflectedShortwaveMRT: " + INTERSECTED.userData.reflectedShortwaveMRT.toString() + "\n";
        txt += "pmv1: " + INTERSECTED.userData.pmv1 + "\n";
        txt += "PPD1: " + determinePPD(INTERSECTED.userData.pmv) + "\n";
        txt += "PPD2: " + determinePPD(INTERSECTED.userData.pmv1) + "\n";
        txt += "Solar Adjusted MRT: " + parseFloat(parseFloat(INTERSECTED.userData.mrt) + parseFloat(INTERSECTED.userData.mrt1)) + "\n";
        txt += "Final PPD: " + INTERSECTED.userData.finalPPD.ppd;


        // myDiv.innerText = txt;
      }

      

      INTERSECTED = intersects[0].object;
      // INTERSECTED.currentHex = INTERSECTED.material.color.getHex();
      // INTERSECTED.material.color.setHex(0xff0000);
    }
    
    


  } else {
    // if (INTERSECTED) INTERSECTED.material.color.setHex(INTERSECTED.currentHex);
    INTERSECTED = null;
  }
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

  let gridX = ROOM_PARAMS.depth * 5;
  let gridY = ROOM_PARAMS.length * 5;

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
      let YdistanceFromWall = (i * 0.2 + 0.2); // grid distance from window wall in Y direction
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
                bigA = ((XlocationOnWall + (j * 0.2 + 0.2) + (r.glzCoords[n][0][0] - (wallDepVal / 2)) + (p * parseInt(vertShadeSpace) - vertShadeShift)));
              } else {
                bigA = ((XlocationOnWall + (j * 0.2 + 0.2) - (r.glzCoords[n][0][0] + (wallDepVal / 2)) + (-p * parseInt(vertShadeSpace) - vertShadeShift)));
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
      let YdistanceFromWall = (i* 0.2 + 0.2); // grid distance from window wall in Y direction
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

            if (XlocationOnWall + (j * 0.2 + 0.2 ) > r.glzCoords[m][0][0] + (wallDepVal / 2) && XlocationOnWall + (j * 0.2 + 0.2) < r.glzCoords[m][1][0] + (wallDepVal / 2)) { //cycle through all the windows, check if the wall position exists within the bounds of the window
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
      let distanceFromWall = (i * 0.2 + 0.2) / 4;
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