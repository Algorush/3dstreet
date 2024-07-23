/* functions for creating elements for streetmix streets */

export function cloneMixinAsChildren({
    objectMixinId = '',
    parentEl = null,
    step = 15,
    radius = 60,
    rotation = '0 0 0',
    positionXYString = '0 0',
    length = undefined,
    randomY = false
  }) {
    for (let j = radius * -1; j <= radius; j = j + step) {
      const placedObjectEl = document.createElement('a-entity');
      placedObjectEl.setAttribute('mixin', objectMixinId);
      placedObjectEl.setAttribute('class', objectMixinId);
      placedObjectEl.setAttribute('position', positionXYString + ' ' + j);
  
      if (length) {
        placedObjectEl.addEventListener('loaded', (evt) => {
          evt.target.setAttribute('geometry', 'height', length);
          evt.target.setAttribute('atlas-uvs', 'c', 1);
        });
      }
  
      if (randomY) {
        placedObjectEl.setAttribute(
          'rotation',
          '0 ' + Math.floor(randomTestable() * 361) + ' 0'
        );
      } else {
        placedObjectEl.setAttribute('rotation', rotation);
      }
      // add the new elmement to DOM
      parentEl.append(placedObjectEl);
      // could be good to use geometry merger https://github.com/supermedium/superframe/tree/master/components/geometry-merger
    }
  }

function randomTestable() {
    return Math.random();
  }
  
  // this function takes a list of segments and adds lane markings or "separator segments"
  // these are 0 width segments inserted into the street json prior to rendering
  // the basic logic is: if there are two adjacent "lane-ish" segments, then add lane separators
export function insertSeparatorSegments(segments) {
    // first, let's define what is a lane that will likely need adajcent striping?
    function isLaneIsh(typeString) {
      return (
        typeString.slice(typeString.length - 4) === 'lane' ||
        typeString === 'light-rail' ||
        typeString === 'streetcar' ||
        typeString === 'flex-zone'
      );
    }
  
    // then let's go through the segments array and build a new one with inserted separators
    const newValues = segments.reduce(
      (newArray, currentValue, currentIndex, arr) => {
        // don't insert a lane marker before the first segment
        if (currentIndex === 0) {
          return newArray.concat(currentValue);
        }
  
        const previousValue = arr[currentIndex - 1];
  
        // if both adjacent lanes are "laneish"
        if (isLaneIsh(currentValue.type) && isLaneIsh(previousValue.type)) {
          // if in doubt start with a solid line
          var variantString = 'solid';
  
          // if adjacent lane types are identical, then used dashed lines
          if (currentValue.type === previousValue.type) {
            variantString = 'dashed';
          }
  
          // Or, if either is a drive lane or turn lane then use dashed
          // Using dash vs solid for turn lanes along approach to intersections may need to be user defined
          if (
            (currentValue.type === 'drive-lane' &&
              previousValue.type === 'turn-lane') ||
            (previousValue.type === 'drive-lane' &&
              currentValue.type === 'turn-lane')
          ) {
            variantString = 'dashed';
          }
  
          // if adjacent segments in opposite directions then use double yellow
          if (
            currentValue.variantString.split('|')[0] !==
            previousValue.variantString.split('|')[0]
          ) {
            variantString = 'doubleyellow';
            // if adjacenet segments are both bike lanes, then use yellow short dash
            if (
              currentValue.type === 'bike-lane' &&
              previousValue.type === 'bike-lane'
            ) {
              variantString = 'shortdashedyellow';
            }
            if (
              currentValue.type === 'flex-zone' ||
              previousValue.type === 'flex-zone'
            ) {
              variantString = 'solid';
            }
          }
  
          // special case -- if either lanes are turn lane shared, then use solid and long dash
          if (
            currentValue.type === 'turn-lane' &&
            currentValue.variantString.split('|')[1] === 'shared'
          ) {
            variantString = 'soliddashedyellow';
          } else if (
            previousValue.type === 'turn-lane' &&
            previousValue.variantString.split('|')[1] === 'shared'
          ) {
            variantString = 'soliddashedyellowinverted';
          }
  
          // if adjacent to parking lane with markings, do not draw white line
          if (
            currentValue.type === 'parking-lane' ||
            previousValue.type === 'parking-lane'
          ) {
            variantString = 'invisible';
          }
  
          newArray.push({
            type: 'separator',
            variantString: variantString,
            width: 0,
            elevation: currentValue.elevation
          });
        }
  
        // if a *lane segment and divider are adjacent, use a solid separator
        if (
          (isLaneIsh(currentValue.type) && previousValue.type === 'divider') ||
          (isLaneIsh(previousValue.type) && currentValue.type === 'divider')
        ) {
          newArray.push({
            type: 'separator',
            variantString: 'solid',
            width: 0,
            elevation: currentValue.elevation
          });
        }
  
        newArray.push(currentValue);
        return newArray;
      },
      []
    );
  
    // console.log('newValues =', newValues)
    // console.log(segments);
  
    return newValues;
  }
  
export function createStencilsParentElement(position) {
    const placedObjectEl = document.createElement('a-entity');
    placedObjectEl.setAttribute('class', 'stencils-parent');
    placedObjectEl.setAttribute('position', position); // position="1.043 0.100 -3.463"
    return placedObjectEl;
  }
  
function createRailsElement(length, railsPosX) {
    const placedObjectEl = document.createElement('a-entity');
    const railsGeometry = {
      primitive: 'box',
      depth: length,
      width: 0.1,
      height: 0.2
    };
    const railsMaterial = {
      // TODO: Add environment map for reflection on metal rails
      color: '#8f8f8f',
      metalness: 1,
      emissive: '#828282',
      emissiveIntensity: 0.5,
      roughness: 0.1
    };
    placedObjectEl.setAttribute('geometry', railsGeometry);
    placedObjectEl.setAttribute('material', railsMaterial);
    placedObjectEl.setAttribute('class', 'rails');
    placedObjectEl.setAttribute('shadow', 'receive:true; cast: true');
    placedObjectEl.setAttribute('position', railsPosX + ' 0.2 0'); // position="1.043 0.100 -3.463"
  
    return placedObjectEl;
  }
  
  // createTracksParentElement - create a parent element with a 2 rails
export function createTracksParentElement(length, objectMixinId) {
    const placedObjectEl = document.createElement('a-entity');
    placedObjectEl.setAttribute('class', 'track-parent');
    placedObjectEl.setAttribute('position', '0 -0.2 0'); // position="1.043 0.100 -3.463"
    // add rails
    const railsWidth = {
      // width as measured from center of rail, so 1/2 actual width
      tram: 0.7175, // standard gauge 1,435 mm
      trolley: 0.5335 // sf cable car rail gauge 1,067 mm
    };
    const railsPosX = railsWidth[objectMixinId];
    placedObjectEl.append(createRailsElement(length, railsPosX));
    placedObjectEl.append(createRailsElement(length, -railsPosX));
  
    return placedObjectEl;
  }
  
export function createSafehitsParentElement() {
    const placedObjectEl = document.createElement('a-entity');
    placedObjectEl.setAttribute('class', 'safehit-parent');
    return placedObjectEl;
  }
  
function createParentElement(className) {
    const parentEl = document.createElement('a-entity');
    parentEl.setAttribute('class', className);
    return parentEl;
  }
  
export function createDividerVariant(variantName, clonedObjectRadius, step = 2.25) {
    const dividerParentEl = createParentElement(`dividers-${variantName}-parent`);
    cloneMixinAsChildren({
      objectMixinId: `dividers-${variantName}`,
      parentEl: dividerParentEl,
      step: step,
      radius: clonedObjectRadius
    });
    return dividerParentEl;
  }
  
  /*
   create a parent element with a variantName-parent class,
   create cloned variants of the object with mixin variantName
   under the parent
  */
export function createClonedVariants(
    variantName,
    clonedObjectRadius,
    step = 2.25,
    rotation = '0 0 0'
  ) {
    const dividerParentEl = createParentElement(`${variantName}-parent`);
    cloneMixinAsChildren({
      objectMixinId: variantName,
      parentEl: dividerParentEl,
      step: step,
      radius: clonedObjectRadius,
      rotation: rotation
    });
    return dividerParentEl;
  }
  
export function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min);
  }
  
function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
  }
  
function getZPositions(start, end, step) {
    const len = Math.floor((end - start) / step) + 1;
    var arr = Array(len)
      .fill()
      .map((_, idx) => start + idx * step);
    return arr.sort(() => 0.5 - Math.random());
  }
  
function getDimensions(object3d) {
    var box = new THREE.Box3().setFromObject(object3d);
    var x = box.max.x - box.min.x;
    var y = box.max.y - box.min.y;
    var z = box.max.z - box.min.z;
  
    return { x, y, z };
  }
  
function getStartEndPosition(streetLength, objectLength) {
    // get the start and end position for placing an object on a line
    // computed by length of the street and object's length
    const start = -0.5 * streetLength + 0.5 * objectLength;
    const end = 0.5 * streetLength - 0.5 * objectLength;
    return { start, end };
  }
  
  /*
   create a parent element .pedestrians-parent,
   create pedestrians under the parent with density (number of pedestrians per meter):
      empty: 0,
      sparse: 0.03,
      normal: 0.125,
      dense: 0.25
  */
export function createSidewalkClonedVariants(
    segmentWidthInMeters,
    density,
    elevationPosY = 0,
    streetLength,
    direction = 'random',
    animated = false
  ) {
    const xValueRange = [
      -(0.37 * segmentWidthInMeters),
      0.37 * segmentWidthInMeters
    ];
    const zValueRange = getZPositions(
      -0.5 * streetLength,
      0.5 * streetLength,
      1.5
    );
    const densityFactors = {
      empty: 0,
      sparse: 0.03,
      normal: 0.125,
      dense: 0.25
    };
    const totalPedestrianNumber = parseInt(
      densityFactors[density] * streetLength,
      10
    );
    const dividerParentEl = createParentElement('pedestrians-parent');
    dividerParentEl.setAttribute('position', { y: elevationPosY });
    // Randomly generate avatars
    for (let i = 0; i < totalPedestrianNumber; i++) {
      const variantName =
        animated === true
          ? 'a_char' + String(getRandomIntInclusive(1, 8))
          : 'char' + String(getRandomIntInclusive(1, 16));
      const xVal = getRandomArbitrary(xValueRange[0], xValueRange[1]);
      const zVal = zValueRange.pop();
      const yVal = 0;
      // y = 0.2 for sidewalk elevation
      const placedObjectEl = document.createElement('a-entity');
      let animationDirection = 'inbound';
      placedObjectEl.setAttribute('position', { x: xVal, y: yVal, z: zVal });
      placedObjectEl.setAttribute('mixin', variantName);
      // Roughly 50% of traffic will be incoming
      if (Math.random() < 0.5 && direction === 'random') {
        placedObjectEl.setAttribute('rotation', '0 180 0');
        animationDirection = 'outbound';
      }
  
      if (animated) {
        addLinearStreetAnimation(
          placedObjectEl,
          1.4,
          streetLength,
          xVal,
          yVal,
          zVal,
          animationDirection
        );
      }
      dividerParentEl.append(placedObjectEl);
    }
  
    return dividerParentEl;
  }
  
export function getBikeLaneMixin(variant) {
    if (variant === 'red') {
      return 'surface-red bike-lane';
    }
    if (variant === 'blue') {
      return 'surface-blue bike-lane';
    }
    if (variant === 'green') {
      return 'surface-green bike-lane';
    }
    return 'bike-lane';
  }
  
export function getBusLaneMixin(variant) {
    if ((variant === 'colored') | (variant === 'red')) {
      return 'surface-red bus-lane';
    }
    if (variant === 'blue') {
      return 'surface-blue bus-lane';
    }
    if (variant === 'grass') {
      return 'surface-green bus-lane';
    }
    return 'bus-lane';
  }
  
function randomPosition(entity, axis, length, objSizeAttr = undefined) {
    // place randomly an element on a line length='length' on the axis 'axis'
    // Need to call from 'model-loaded' event if objSizeAttr is undefined
    // existEnts - array with existing entities (for prevent intersection)
    const newObject = entity.object3D;
    const objSize = objSizeAttr || getDimensions(newObject)[axis];
    const { start, end } = getStartEndPosition(length, objSize);
    const setFunc = `set${axis.toUpperCase()}`;
    const newPosition = getRandomArbitrary(start, end);
    newObject.position[setFunc](newPosition);
    return newPosition;
  }
  
  // create tram or trolley element
export function createChooChooElement(
    variantList,
    objectMixinId,
    length,
    showVehicles
  ) {
    if (!showVehicles) {
      return;
    }
    const rotationY = variantList[0] === 'inbound' ? 0 : 180;
    const placedObjectEl = document.createElement('a-entity');
    const tramLength = 23;
    placedObjectEl.setAttribute('rotation', '0 ' + rotationY + ' 0');
    placedObjectEl.setAttribute('mixin', objectMixinId);
    placedObjectEl.setAttribute('class', objectMixinId);
    const positionZ = randomPosition(placedObjectEl, 'z', length, tramLength);
    placedObjectEl.setAttribute('position', '0 0 ' + positionZ);
    return placedObjectEl;
  }
  
  // create a bus parent element, and add a bus under the parent
export function createBusElement(variantList, length, showVehicles) {
    if (!showVehicles) {
      return;
    }
    const rotationY = variantList[0] === 'inbound' ? 0 : 180;
    const busParentEl = document.createElement('a-entity');
    const busLength = 12;
    const busObjectEl = document.createElement('a-entity');
    busObjectEl.setAttribute('rotation', '0 ' + rotationY + ' 0');
    busObjectEl.setAttribute('mixin', 'bus');
    const positionZ = randomPosition(busObjectEl, 'z', length, busLength);
    busObjectEl.setAttribute('position', '0 0 ' + positionZ);
    busParentEl.append(busObjectEl);
  
    return busParentEl;
  }
  
  /*
   add a linear loop animation to an object
   reusableObjectEl - the object to add the animation to
   speed - the speed of the animation, meters per second
   streetLength - the length of the street
   xPos - the initial x position of the object
   yVal - the y position of the object (elevation level)
   zPos - the initial z position of the object
   direction - the direction of the animation: inbound or outbound
  */
function addLinearStreetAnimation(
    reusableObjectEl,
    speed,
    streetLength,
    xPos,
    yVal = 0,
    zPos,
    direction
  ) {
    const totalStreetDuration = (streetLength / speed) * 1000; // time in milliseconds
    const halfStreet =
      direction === 'outbound' ? -streetLength / 2 : streetLength / 2;
    const startingDistanceToTravel = Math.abs(halfStreet - zPos);
    const startingDuration = (startingDistanceToTravel / speed) * 1000;
  
    const animationAttrs1 = {
      property: 'position',
      easing: 'linear',
      loop: 'false',
      from: { x: xPos, y: yVal, z: zPos },
      to: { z: halfStreet },
      dur: startingDuration
    };
    const animationAttrs2 = {
      property: 'position',
      easing: 'linear',
      loop: 'true',
      from: { x: xPos, y: yVal, z: -halfStreet },
      to: { x: xPos, y: yVal, z: halfStreet },
      delay: startingDuration,
      dur: totalStreetDuration
    };
    reusableObjectEl.setAttribute('animation__1', animationAttrs1);
    reusableObjectEl.setAttribute('animation__2', animationAttrs2);
  
    return reusableObjectEl;
  }
  
  /* create a drive-lane parent element with a drive-lane-parent class,
   create a clone of the object under the parent with possible car types or pedestrian:
   'car', 'pedestrian', 'sedan-rig', 'suv-rig', 'box-truck-rig', 'self-driving-cruise-car-rig', 'sedan-taxi-rig'.
   Function parameters:
   variantList - array of strings, each string is a variant of the drive-lane
   segmentWidthInMeters - the width of the segment
   streetLength - the length of the street
   animated - boolean, if true, add a linear animation to the object
   showVehicles - boolean, if true, add vehicles to the object
   count - number of vehicles to add
   carStep - the step size of the vehicles
  */
export function createDriveLaneElement(
    variantList,
    segmentWidthInMeters,
    streetLength,
    animated = false,
    showVehicles = true,
    count = 1,
    carStep = undefined
  ) {
    if (!showVehicles) {
      return;
    }
    let speed = 0;
    let [lineVariant, direction, carType] = variantList;
    if (variantList.length === 2) {
      carType = direction;
      direction = lineVariant;
    }
  
    const rotationVariants = {
      inbound: 0,
      outbound: 180,
      sideways: {
        left: -90,
        right: 90
      },
      'angled-front-left': -60,
      'angled-front-right': 60,
      'angled-rear-left': -120,
      'angled-rear-right': 120
    };
    let rotationY;
    if (lineVariant === 'sideways') {
      rotationY = rotationVariants['sideways'][direction];
    } else {
      rotationY = rotationVariants[lineVariant];
    }
  
    if (carType === 'pedestrian') {
      return createSidewalkClonedVariants(
        segmentWidthInMeters,
        'normal',
        0,
        streetLength,
        direction,
        animated
      );
    }
  
    const driveLaneParentEl = document.createElement('a-entity');
  
    if (variantList.length === 1) {
      // if there is no cars
      return driveLaneParentEl;
    }
  
    const carParams = {
      car: {
        mixin: 'sedan-rig',
        wheelDiameter: 0.76,
        length: 5.17,
        width: 2
      },
      microvan: {
        mixin: 'suv-rig',
        wheelDiameter: 0.84,
        length: 5,
        width: 2
      },
      truck: {
        mixin: 'box-truck-rig',
        wheelDiameter: 1.05,
        length: 6.95,
        width: 2.5
      },
      // autonomous vehicle
      av: {
        mixin: 'self-driving-cruise-car-rig',
        wheelDiameter: 0.76,
        length: 5.17,
        width: 2
      }
    };
  
    // default drive-lane variant if selected variant (carType) is not supported
    if (!carParams[carType]) {
      carType = 'car';
    }
    function createCar(positionZ = undefined, carType = 'car') {
      const params = carParams[carType];
  
      const reusableObjectEl = document.createElement('a-entity');
  
      if (!positionZ) {
        positionZ = randomPosition(
          reusableObjectEl,
          'z',
          streetLength,
          params['length']
        );
      }
      reusableObjectEl.setAttribute('position', `0 0 ${positionZ}`);
      reusableObjectEl.setAttribute('mixin', params['mixin']);
      reusableObjectEl.setAttribute('rotation', `0 ${rotationY} 0`);
  
      if (animated) {
        speed = 5; // meters per second
        reusableObjectEl.setAttribute('wheel', {
          speed: speed,
          wheelDiameter: params['wheelDiameter']
        });
        addLinearStreetAnimation(
          reusableObjectEl,
          speed,
          streetLength,
          0,
          0,
          positionZ,
          direction
        );
      }
      driveLaneParentEl.append(reusableObjectEl);
      return reusableObjectEl;
    }
  
    // create one or more randomly placed cars
  
    if (count > 1) {
      const halfStreet = streetLength / 2;
      const halfParkingLength = carStep / 2 + carStep;
      const allPlaces = getZPositions(
        -halfStreet + halfParkingLength,
        halfStreet - halfParkingLength,
        carStep
      );
      const randPlaces = allPlaces.slice(0, count);
      const carSizeZ =
        lineVariant === 'sideways' || lineVariant.includes('angled')
          ? 'width'
          : 'length';
  
      const carSizeValueZ = carParams[carType][carSizeZ];
  
      randPlaces.forEach((randPositionZ) => {
        const maxDist = carStep - carSizeValueZ - 0.2;
        // randOffset is for randomly displacement in a parking space (+/- maxDist)
        const randOffset = -maxDist / 2 + maxDist * Math.random();
        if (maxDist > 0) {
          // if the car fits in the parking space
          const positionZ = randPositionZ + randOffset;
          createCar(positionZ, carType);
        }
      });
    } else {
      createCar(undefined, carType);
    }
  
    return driveLaneParentEl;
  }
  
  // create a food truck parent element, and add a food truck element under the parent
export function createFoodTruckElement(variantList, length) {
    const foodTruckParentEl = document.createElement('a-entity');
  
    const reusableObjectEl = document.createElement('a-entity');
    const foodTruckLength = 7;
    const rotationY = variantList[0] === 'left' ? 0 : 180;
    reusableObjectEl.setAttribute('rotation', '0 ' + rotationY + ' 0');
    reusableObjectEl.setAttribute('mixin', 'food-trailer-rig');
  
    const positionZ = randomPosition(
      reusableObjectEl,
      'z',
      length,
      foodTruckLength
    );
    reusableObjectEl.setAttribute('positon', '0 0 ' + positionZ);
    foodTruckParentEl.append(reusableObjectEl);
  
    return foodTruckParentEl;
  }
  
  // create a magic carpet parent element, and add a magic carpet element under the parent
export function createMagicCarpetElement(showVehicles) {
    if (!showVehicles) {
      return;
    }
    const magicCarpetParentEl = document.createElement('a-entity');
  
    const reusableObjectEl1 = document.createElement('a-entity');
    reusableObjectEl1.setAttribute('position', '0 1.75 0');
    reusableObjectEl1.setAttribute('rotation', '0 0 0');
    reusableObjectEl1.setAttribute('mixin', 'magic-carpet');
    magicCarpetParentEl.append(reusableObjectEl1);
    const reusableObjectEl2 = document.createElement('a-entity');
    reusableObjectEl2.setAttribute('position', '0 1.75 0');
    reusableObjectEl2.setAttribute('rotation', '0 0 0');
    reusableObjectEl2.setAttribute('mixin', 'Character_1_M');
    magicCarpetParentEl.append(reusableObjectEl2);
  
    return magicCarpetParentEl;
  }
  
  // return an array of random positions for an object
  function randPlacedElements(streetLength, objLength, count) {
    const placeLength = objLength / 2 + objLength;
    const allPlaces = getZPositions(
      -streetLength / 2 + placeLength / 2,
      streetLength / 2 - placeLength / 2,
      placeLength
    );
    return allPlaces.slice(0, count);
  }
  
  // create an outdoor dining parent element, and add an outdoor dining element under the parent
export function createOutdoorDining(length, posY) {
    const outdoorDiningParentEl = document.createElement('a-entity');
    const outdorDiningLength = 2.27;
  
    const randPlaces = randPlacedElements(length, outdorDiningLength, 5);
    randPlaces.forEach((randPosZ) => {
      const reusableObjectEl = document.createElement('a-entity');
      reusableObjectEl.setAttribute('mixin', 'outdoor_dining');
  
      // const positionZ = randomPosition(reusableObjectEl, 'z', length, outdorDiningLength);
      reusableObjectEl.setAttribute('position', { y: posY, z: randPosZ });
      outdoorDiningParentEl.append(reusableObjectEl);
    });
  
    return outdoorDiningParentEl;
  }
  
  /* create a micro-mobility parent element, add micro-mobility elements under the parent
   with possible cyclist types: 'cyclist-cargo', 'cyclist1', 'cyclist2', 'cyclist3', 'cyclist-dutch', 'cyclist-kid'
   or 'ElectricScooter_1' if segmentType is 'scooter'
  */
 export function createMicroMobilityElement(
    variantList,
    segmentType,
    posY = 0,
    length,
    showVehicles,
    animated = false
  ) {
    if (!showVehicles) {
      return;
    }
    const microMobilityParentEl = document.createElement('a-entity');
  
    const bikeLength = 2.03;
    const bikeCount = getRandomIntInclusive(2, 5);
  
    const cyclistMixins = [
      'cyclist-cargo',
      'cyclist1',
      'cyclist2',
      'cyclist3',
      'cyclist-dutch',
      'cyclist-kid'
    ];
  
    const countCyclist = cyclistMixins.length;
    let mixinId = 'Bicycle_1';
    const randPlaces = randPlacedElements(length, bikeLength, bikeCount);
    randPlaces.forEach((randPosZ) => {
      const reusableObjectEl = document.createElement('a-entity');
      const rotationY = variantList[0] === 'inbound' ? 0 : 180;
      reusableObjectEl.setAttribute('rotation', '0 ' + rotationY + ' 0');
      reusableObjectEl.setAttribute('position', { y: posY, z: randPosZ });
  
      if (animated) {
        reusableObjectEl.setAttribute('animation-mixer', '');
        const speed = 5;
        addLinearStreetAnimation(
          reusableObjectEl,
          speed,
          length,
          0,
          posY,
          randPosZ,
          variantList[0]
        );
      }
      if (segmentType === 'bike-lane') {
        mixinId = cyclistMixins[getRandomIntInclusive(0, countCyclist)];
      } else {
        mixinId = 'ElectricScooter_1';
      }
  
      reusableObjectEl.setAttribute('mixin', mixinId);
      microMobilityParentEl.append(reusableObjectEl);
    });
  
    return microMobilityParentEl;
  }
  
  // create a flex zone parent element, and add a flex zone elements under the parent
  // with possible car types: 'sedan-rig', 'sedan-taxi-rig'
export function createFlexZoneElement(variantList, length, showVehicles = true) {
    if (!showVehicles) {
      return;
    }
    const flexZoneParentEl = document.createElement('a-entity');
    const carLength = 5;
    const carCount = getRandomIntInclusive(2, 4);
    const randPlaces = randPlacedElements(length, carLength, carCount);
    randPlaces.forEach((randPosZ) => {
      const reusableObjectEl = document.createElement('a-entity');
      const rotationY = variantList[1] === 'inbound' ? 0 : 180;
      reusableObjectEl.setAttribute('rotation', '0 ' + rotationY + ' 0');
      if (variantList[0] === 'taxi') {
        reusableObjectEl.setAttribute('mixin', 'sedan-taxi-rig');
      } else if (variantList[0] === 'rideshare') {
        reusableObjectEl.setAttribute('mixin', 'sedan-rig');
      }
      reusableObjectEl.setAttribute('position', { z: randPosZ });
      flexZoneParentEl.append(reusableObjectEl);
    });
  
    return flexZoneParentEl;
  }
  
export function createWayfindingElements() {
    const wayfindingParentEl = document.createElement('a-entity');
    let reusableObjectEl;
  
    reusableObjectEl = document.createElement('a-entity');
    reusableObjectEl.setAttribute('position', '0 1 0');
    reusableObjectEl.setAttribute('mixin', 'wayfinding-box');
    wayfindingParentEl.append(reusableObjectEl);
  
    reusableObjectEl = document.createElement('a-entity');
    reusableObjectEl.setAttribute('position', '0 1.2 0.06');
    reusableObjectEl.setAttribute(
      'geometry',
      'primitive: plane; width: 0.8; height: 1.6'
    );
    reusableObjectEl.setAttribute('material', 'src:#wayfinding-map');
    wayfindingParentEl.append(reusableObjectEl);
  
    reusableObjectEl = document.createElement('a-entity');
    reusableObjectEl.setAttribute('position', '0 1.2 -0.06');
    reusableObjectEl.setAttribute('rotation', '0 180 0');
    reusableObjectEl.setAttribute(
      'geometry',
      'primitive: plane; width: 0.8; height: 1.6'
    );
    reusableObjectEl.setAttribute('material', 'src:#wayfinding-map');
    wayfindingParentEl.append(reusableObjectEl);
  
    return wayfindingParentEl;
  }
  
export function createBenchesParentElement() {
    const placedObjectEl = document.createElement('a-entity');
    placedObjectEl.setAttribute('class', 'bench-parent');
    // y = 0.2 for sidewalk elevation
    placedObjectEl.setAttribute('position', '0 0.2 3.5');
    return placedObjectEl;
  }
  
export function createBikeRacksParentElement(posY) {
    const placedObjectEl = document.createElement('a-entity');
    placedObjectEl.setAttribute('class', 'bikerack-parent');
    placedObjectEl.setAttribute('position', { y: posY, z: -3.5 });
    return placedObjectEl;
  }
  
export function createBikeShareStationElement(variantList, posY) {
    const placedObjectEl = document.createElement('a-entity');
    placedObjectEl.setAttribute('class', 'bikeshare');
    placedObjectEl.setAttribute('mixin', 'bikeshare');
    const rotationCloneY = variantList[0] === 'left' ? 90 : 270;
    placedObjectEl.setAttribute('rotation', '0 ' + rotationCloneY + ' 0');
    placedObjectEl.setAttribute('position', { y: posY });
    return placedObjectEl;
  }
  
export function createParkletElement(length, variantList) {
    const parkletParent = document.createElement('a-entity');
    const parkletLength = 4.03;
    const parkletCount = 3;
    const randPlaces = randPlacedElements(length, parkletLength, parkletCount);
    randPlaces.forEach((randPosZ) => {
      const placedObjectEl = document.createElement('a-entity');
      placedObjectEl.setAttribute('class', 'parklet');
      placedObjectEl.setAttribute('position', { x: 0, y: 0.02, z: randPosZ });
      placedObjectEl.setAttribute('mixin', 'parklet');
      const rotationY = variantList[0] === 'left' ? 90 : 270;
      placedObjectEl.setAttribute('rotation', { y: rotationY });
      parkletParent.append(placedObjectEl);
    });
    return parkletParent;
  }
  
export function createTreesParentElement() {
    const placedObjectEl = document.createElement('a-entity');
    placedObjectEl.setAttribute('class', 'tree-parent');
    // y = 0.2 for sidewalk elevation
    placedObjectEl.setAttribute('position', '0 0.2 7');
    return placedObjectEl;
  }
  
export function createLampsParentElement() {
    const placedObjectEl = document.createElement('a-entity');
    placedObjectEl.setAttribute('class', 'lamp-parent');
    // y = 0.2 for sidewalk elevation
    placedObjectEl.setAttribute('position', '0 0.2 0'); // position="1.043 0.100 -3.463"
    return placedObjectEl;
  }
  
export function createBusStopElement(rotationBusStopY, posY) {
    const placedObjectEl = document.createElement('a-entity');
    placedObjectEl.setAttribute('class', 'bus-stop');
    placedObjectEl.setAttribute('rotation', '0 ' + rotationBusStopY + ' 0');
    placedObjectEl.setAttribute('mixin', 'bus-stop');
    placedObjectEl.setAttribute('position', { y: posY });
    return placedObjectEl;
  }
  
export function createBrtStationElement() {
    const placedObjectEl = document.createElement('a-entity');
    placedObjectEl.setAttribute('class', 'brt-station');
    placedObjectEl.setAttribute('mixin', 'brt-station');
    return placedObjectEl;
  }
  
  // offset to center the street around global x position of 0
export function createCenteredStreetElement(segments) {
    const streetEl = document.createElement('a-entity');
    const streetWidth = segments.reduce(
      (streetWidth, segmentData) => streetWidth + segmentData.width,
      0
    );
    const offset = 0 - streetWidth / 2;
    streetEl.setAttribute('position', offset + ' 0 0');
    return streetEl;
  }
  
export function createSegmentElement(
    segmentWidthInMeters,
    positionY,
    mixinId,
    length,
    repeatCount,
    elevation = 0
  ) {
    var segmentEl = document.createElement('a-entity');
    const heightLevels = [0.2, 0.4, 0.6];
    const height = heightLevels[elevation];
    if (elevation === 0) {
      positionY = -0.1;
    } else if (elevation === 2) {
      positionY = 0.1;
    }
  
    segmentEl.setAttribute(
      'geometry',
      `primitive: box; 
      height: ${height}; 
      depth: ${length};
      width: ${segmentWidthInMeters};`
    );
  
    segmentEl.setAttribute('position', { y: positionY });
    segmentEl.setAttribute('mixin', mixinId);
  
    if (repeatCount.length !== 0) {
      segmentEl.setAttribute(
        'material',
        `repeat: ${repeatCount[0]} ${repeatCount[1]}`
      );
    }
  
    return segmentEl;
  }
  
export function createSeparatorElement(
    positionY,
    rotationY,
    mixinId,
    length,
    repeatCount,
    elevation = 0
  ) {
    var segmentEl = document.createElement('a-entity');
    const scaleY = length / 150;
    const scalePlane = '1 ' + scaleY + ' 1';
  
    segmentEl.setAttribute('rotation', '270 ' + rotationY + ' 0');
    segmentEl.setAttribute('scale', scalePlane);
  
    segmentEl.setAttribute('position', '0 ' + positionY + ' 0');
    segmentEl.setAttribute('mixin', mixinId);
  
    if (repeatCount.length !== 0) {
      segmentEl.setAttribute(
        'material',
        `repeat: ${repeatCount[0]} ${repeatCount[1]}`
      );
    }
  
    return segmentEl;
  }
  