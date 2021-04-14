// TWEAKPANE Parameter objects
const PARAMS1 = {
  model: 2, // defaluts display to direct solar
};

const CLIMATE_PARAMS = {
  longitude: -71,
  latitude: 42,
  timeZoneOffset: -5
};

const TIME_PARAMS = {
  studyType: false,
  hour: 12,
  day: 21,
  month: 9,
  timeStep: 4
};

const ROOM_PARAMS = {
  orientation: 0,
  ceilHeight: 4,
  gridHeight: 1,
  length: 10,
  depth: 5
};

const WINDOW_PARAMS = {
  heightFromSill: 2,
  sillHeight: 1,
  glazingBy: 0,
  glazingRatio: 40,
  width: 2,
  separation: 5
}

const HORIZONTAL_SHADE_PARAMS = {
  depth: 0.5,
  number: 0,
  spacing: 0.4,
  dist: 0,
  heightAbove: 0,
  angle: 0
}

const VERTICAL_SHADE_PARAMS = {
  depth: 0.3,
  number: 0,
  spacing: 0.3,
  leftRight: 0,
  lrShift: 0,
  dist: 0,
  fullHeight: 0,
  heightAbove: 0,
  relativeHeight: 0,
  angle: 0
}

const WINTER_COMFORT_PARAMS = {
  occDistToWallCenter: 3,

  uvalueValue: 1.99,
  calcUVal: 0.29,
  intLowEChecked: 0,
  intLowEEmissivity: 0,
  intRadiantFloorChecked: 0,

  outdoorTempValue: -12,
  airtempValue: 22,
  humidityValue: 20,

  rvalueValue: 2.64,
  airspeedValue: 0.05,
  clothingValue: 0.85,
  metabolic: 1.2
}

const UNIT_PARAMS = {
  unitSys: "SI" // IP or SI
}

const OCCUPANT_PARAMS = {
  position: { x: 1, y: 1 },
  azimuth: 0.0,
  posture: "seated",
};


const MRT_PARAMS = {
  azimuth: 0,
  opacity: 0,
  temperature: 21.0,
  emissivity: 0.9,
  tsol: 0.8,
  temperature: 40.0,
  emissivity: 0.9,
  width: 8.0,
  height: 1.8,
  xposition: 1.0,
  yposition: 0.4,
}

const SUMMER_COMFORT_PARAMS = {
  directNormalIrradiance: 850,
  fractionOfBodyExposed: 0.3,
  shortWaveAbsorpivity: 0.7,
  TSol: 1,
  SHGCIndirect: 1,
  SHGC: this.TSol + this.SHGHIndirect,
  TSolShading: 1
}

mrt.occupant = {
  position: { x: 1, y: 1 },
  azimuth: 0.0,
  posture: "seated",
};

mrt.room = {
  depth: 5.0,
  width: 10.0,
  height: 2.6,
};

let params = {
  azimuth: 0,
  opacity: 0,
  wall1: {
    temperature: 21.0,
    emissivity: 0.9,
    panel: {
      active: true,
      window: true,
      tsol: 0.8,
      temperature: 40.0,
      emissivity: 0.9,
      width: 2.0,
      height: 1.8,
      xposition: 1.0,
      yposition: 0.4,
    },
  },
  wall2: {
    temperature: 21.0,
    emissivity: 0.9,
    panel: {
      active: false,
      window: false,
      tsol: 0.8,
      temperature: 36.0,
      emissivity: 0.9,
      width: 3.0,
      height: 1.8,
      xposition: 1.0,
      yposition: 0.4,
    },
  },
  wall3: {
    temperature: 21.0,
    emissivity: 0.9,
    panel: {
      active: false,
      window: false,
      tsol: 0.8,
      temperature: 38.0,
      emissivity: 0.9,
      width: 8.0,
      height: 1.8,
      xposition: 1.0,
      yposition: 0.4,
    },
  },
  wall4: {
    temperature: 21.0,
    emissivity: 0.9,
    panel: {
      active: false,
      window: false,
      tsol: 0.8,
      temperature: 40.0,
      emissivity: 0.9,
      width: 3.0,
      height: 1.8,
      xposition: 1.0,
      yposition: 0.4,
    },
  },
  ceiling: {
    temperature: 21.0,
    emissivity: 0.9,
    panel: {
      active: false,
      window: false,
      tsol: 0.8,
      temperature: 50.0,
      emissivity: 0.9,
      width: 3.0,
      height: 3.0,
      xposition: 1.0,
      yposition: 1.0,
    },
  },
  floor: {
    temperature: 21.0,
    emissivity: 0.9,
    panel: {
      active: false,
      window: false,
      tsol: 0.8,
      temperature: 40.0,
      emissivity: 0.9,
      width: 3.0,
      height: 3.0,
      xposition: 1.0,
      yposition: 1.0,
    },
  },
  display: "MRT",
  autoscale: true,
  scaleMin: 20.0,
  scaleMax: 40.0,
  setGlobalSurfaceTemp: 21,
  update: function () {
    document.getElementById("calculating").style.display = "";
    setTimeout(function () {
      calculate_all(true);
    }, 0);
  },
};

var view_factors;
var panelBorderMin = 0.1; // minimum distance from panel edge to surface edge
const tempMax = 1000; // highest temperature you can enter in the model
const tempMin = -30; // lowest temperature you can enter in the model

function set_wall_properties() {
  mrt.walls = [
    {
      name: "wall1",
      temperature: params.wall1.temperature,
      emissivity: params.wall1.emissivity,
      plane: "xz", // 'xy' plane for webgl geometry
      u: mrt.room.width,
      v: mrt.room.height,
      offset: { x: 0, y: 0, z: 0 },
      subsurfaces: [],
    },
    {
      name: "wall2",
      temperature: params.wall2.temperature,
      emissivity: params.wall2.emissivity,
      plane: "yz",
      u: mrt.room.depth,
      v: mrt.room.height,
      offset: { x: mrt.room.width, y: 0, z: 0 },
      subsurfaces: [],
    },
    {
      name: "wall3",
      temperature: params.wall3.temperature,
      emissivity: params.wall3.emissivity,
      plane: "xz",
      u: mrt.room.width,
      v: mrt.room.height,
      offset: { x: 0, y: mrt.room.depth, z: 0 },
      subsurfaces: [],
    },
    {
      name: "wall4",
      temperature: params.wall4.temperature,
      emissivity: params.wall4.emissivity,
      plane: "yz",
      u: mrt.room.depth,
      v: mrt.room.height,
      offset: { x: 0, y: 0, z: 0 },
      subsurfaces: [],
    },
    {
      name: "ceiling",
      temperature: params.ceiling.temperature,
      emissivity: params.ceiling.emissivity,
      plane: "xy",
      u: mrt.room.width,
      v: mrt.room.depth,
      offset: { x: 0, y: 0, z: mrt.room.height },
      subsurfaces: [],
    },
    {
      name: "floor",
      temperature: params.floor.temperature,
      emissivity: params.floor.emissivity,
      plane: "xy",
      u: mrt.room.width,
      v: mrt.room.depth,
      offset: { x: 0, y: 0, z: 0 },
      subsurfaces: [],
    },
  ];

  var wall1 = _.find(mrt.walls, function (w) {
    return w.name === "wall1";
  });
  if (params.wall1.panel.active) {
    wall1.subsurfaces = [
      {
        name: "wall1panel1",
        temperature: params.wall1.panel.temperature,
        emissivity: params.wall1.panel.emissivity,
        u: params.wall1.panel.xposition,
        v: params.wall1.panel.yposition,
        width: params.wall1.panel.width,
        height: params.wall1.panel.height,
      },{
        name: "wall1panel2",
        temperature: params.wall1.panel.temperature,
        emissivity: params.wall1.panel.emissivity,
        u: params.wall1.panel.xposition+5,
        v: params.wall1.panel.yposition,
        width: params.wall1.panel.width,
        height: params.wall1.panel.height,
      },
    ];
  }

  var wall2 = _.find(mrt.walls, function (w) {
    return w.name === "wall2";
  });
  if (params.wall2.panel.active) {
    wall2.subsurfaces = [
      {
        name: "wall2panel1",
        temperature: params.wall2.panel.temperature,
        emissivity: params.wall2.panel.emissivity,
        u: params.wall2.panel.xposition,
        v: params.wall2.panel.yposition,
        width: params.wall2.panel.width,
        height: params.wall2.panel.height,
      },
    ];
  }

  var wall3 = _.find(mrt.walls, function (w) {
    return w.name === "wall3";
  });
  if (params.wall3.panel.active) {
    wall3.subsurfaces = [
      {
        name: "wall3panel1",
        temperature: params.wall3.panel.temperature,
        emissivity: params.wall3.panel.emissivity,
        u: params.wall3.panel.xposition,
        v: params.wall3.panel.yposition,
        width: params.wall3.panel.width,
        height: params.wall3.panel.height,
      },
    ];
  }

  var wall4 = _.find(mrt.walls, function (w) {
    return w.name === "wall4";
  });
  if (params.wall4.panel.active) {
    wall4.subsurfaces = [
      {
        name: "wall4panel1",
        temperature: params.wall4.panel.temperature,
        emissivity: params.wall4.panel.emissivity,
        u: params.wall4.panel.xposition,
        v: params.wall4.panel.yposition,
        width: params.wall4.panel.width,
        height: params.wall4.panel.height,
      },
    ];
  }

  var ceiling = _.find(mrt.walls, function (w) {
    return w.name === "ceiling";
  });
  if (params.ceiling.panel.active) {
    ceiling.subsurfaces = [
      {
        name: "ceilingpanel1",
        temperature: params.ceiling.panel.temperature,
        emissivity: params.ceiling.panel.emissivity,
        u: params.ceiling.panel.xposition,
        v: params.ceiling.panel.yposition,
        width: params.ceiling.panel.width,
        height: params.ceiling.panel.height,
      },
    ];
  }

  var floor = _.find(mrt.walls, function (w) {
    return w.name === "floor";
  });
  if (params.floor.panel.active) {
    floor.subsurfaces = [
      {
        name: "floorpanel1",
        temperature: params.floor.panel.temperature,
        emissivity: params.floor.panel.emissivity,
        u: params.floor.panel.xposition,
        v: params.floor.panel.yposition,
        width: params.floor.panel.width,
        height: params.floor.panel.height,
      },
    ];
  }
}