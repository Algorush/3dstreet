/* global THREE */
// Orientation - default model orientation is "outbound" (away from camera)
var {
  createClonedVariants,
  cloneMixinAsChildren,
  createSidewalkClonedVariants,
  createCenteredStreetElement,
  createBrtStationElement,
  createBusElement,
  createBusStopElement,
  createChooChooElement,
  createDividerVariant,
  createDriveLaneElement,
  createFoodTruckElement,
  createLampsParentElement,
  createMagicCarpetElement,
  createMicroMobilityElement,
  createTracksParentElement,
  createOutdoorDining,
  createParkletElement,
  createSafehitsParentElement,
  createSegmentElement,
  createSeparatorElement,
  createStencilsParentElement,
  createTreesParentElement,
  createWayfindingElements,
  insertSeparatorSegments,
  createBenchesParentElement,
  createBikeRacksParentElement,
  createBikeShareStationElement,
  getBikeLaneMixin,
  getBusLaneMixin,
  getRandomIntInclusive
} = require('./create-elements.js');

var streetmixParsersTested = require('./tested/aframe-streetmix-parsers-tested');
var { segmentVariants } = require('./segments-variants.js');

// show warning message if segment or variantString are not supported
function supportCheck(segmentType, segmentVariantString) {
  if (segmentType === 'separator') return;
  // variants supported in 3DStreet
  const supportedVariants = segmentVariants[segmentType];
  if (!supportedVariants) {
    STREET.notify.warningMessage(
      `The '${segmentType}' segment type is not yet supported in 3DStreet`
    );
    console.log(
      `The '${segmentType}' segment type is not yet supported in 3DStreet`
    );
  } else if (!supportedVariants.includes(segmentVariantString)) {
    STREET.notify.warningMessage(
      `The '${segmentVariantString}' variant of segment '${segmentType}' is not yet supported in 3DStreet`
    );
    console.log(
      `The '${segmentVariantString}' variant of segment '${segmentType}' is not yet supported in 3DStreet`
    );
  }
}

// OLD: takes a street's `segments` (array) from streetmix and a `streetElementId` (string) and places objects to make up a street with all segments
// NEW: takes a `segments` (array) from streetmix and return an element and its children which represent the 3D street scene
function processSegments(
  segments,
  showStriping,
  length,
  globalAnimated,
  showVehicles
) {
  var clonedObjectRadius = length / 2;
  //  Adjust clonedObjectRadius so that objects do not repeat
  if (length > 12) {
    clonedObjectRadius = (length - 12) / 2;
  }
  // add additional 0-width segments for stripes (painted markers)
  if (showStriping) {
    segments = insertSeparatorSegments(segments);
  }

  // create and center offset to center the street around global x position of 0
  var streetParentEl = createCenteredStreetElement(segments);
  streetParentEl.classList.add('street-parent');
  streetParentEl.setAttribute('data-layer-name', 'Street Segments Container');

  var cumulativeWidthInMeters = 0;
  for (var i = 0; i < segments.length; i++) {
    var segmentParentEl = document.createElement('a-entity');
    segmentParentEl.classList.add('segment-parent-' + i);

    var segmentWidthInMeters = segments[i].width;
    // console.log('Type: ' + segments[i].type + '; Width: ' + segmentWidthInFeet + 'ft / ' + segmentWidthInMeters + 'm');

    cumulativeWidthInMeters = cumulativeWidthInMeters + segmentWidthInMeters;
    var segmentPositionX = cumulativeWidthInMeters - 0.5 * segmentWidthInMeters;
    var positionY = 0;

    // get variantString
    var variantList = segments[i].variantString
      ? segments[i].variantString.split('|')
      : '';

    // show warning message if segment or variantString are not supported
    supportCheck(segments[i].type, segments[i].variantString);

    // elevation property from streetmix segment
    const elevation = segments[i].elevation;

    const elevationLevels = [0, 0.2, 0.4];
    const elevationPosY = elevationLevels[elevation];

    // add y elevation position as a data attribute to segment entity
    segmentParentEl.setAttribute('data-elevation-posY', elevationPosY);

    // Note: segment 3d models are outbound by default
    // If segment variant inbound, rotate segment model by 180 degrees
    var rotationY =
      variantList[0] === 'inbound' || variantList[1] === 'inbound' ? 180 : 0;
    var isOutbound =
      variantList[0] === 'outbound' || variantList[1] === 'outbound' ? 1 : -1;

    // the A-Frame mixin ID is often identical to the corresponding streetmix segment "type" by design, let's start with that
    var groundMixinId = segments[i].type;

    // repeat value for material property - repeatCount[0] is x texture repeat and repeatCount[1] is y texture repeat
    const repeatCount = [];

    // look at segment type and variant(s) to determine specific cases
    if (segments[i].type === 'drive-lane' && variantList[1] === 'sharrow') {
      // make a parent entity for the stencils
      const stencilsParentEl = createStencilsParentElement({
        y: elevationPosY + 0.015
      });
      // clone a bunch of stencil entities (note: this is not draw call efficient)
      cloneMixinAsChildren({
        objectMixinId: 'stencils sharrow',
        parentEl: stencilsParentEl,
        rotation: '-90 ' + rotationY + ' 0',
        step: 10,
        radius: clonedObjectRadius
      });
      // add this stencil stuff to the segment parent
      segmentParentEl.append(stencilsParentEl);
    } else if (
      segments[i].type === 'bike-lane' ||
      segments[i].type === 'scooter'
    ) {
      // make a parent entity for the stencils
      const stencilsParentEl = createStencilsParentElement({
        y: elevationPosY + 0.015
      });
      // get the mixin id for a bike lane
      groundMixinId = getBikeLaneMixin(variantList[1]);
      // clone a bunch of stencil entities (note: this is not draw call efficient)
      cloneMixinAsChildren({
        objectMixinId: 'stencils bike-arrow',
        parentEl: stencilsParentEl,
        rotation: '-90 ' + rotationY + ' 0',
        step: 20,
        radius: clonedObjectRadius
      });
      // add this stencil stuff to the segment parent
      segmentParentEl.append(stencilsParentEl);
      segmentParentEl.append(
        createMicroMobilityElement(
          variantList,
          segments[i].type,
          elevationPosY,
          length,
          showVehicles,
          globalAnimated
        )
      );
    } else if (
      segments[i].type === 'light-rail' ||
      segments[i].type === 'streetcar'
    ) {
      // get the mixin id for a bus lane
      groundMixinId = getBusLaneMixin(variantList[1]);
      // get the mixin id for the vehicle (is it a trolley or a tram?)
      var objectMixinId = segments[i].type === 'streetcar' ? 'trolley' : 'tram';
      // create and append a train element
      segmentParentEl.append(
        createChooChooElement(variantList, objectMixinId, length, showVehicles)
      );
      // make the parent for all the objects to be cloned
      const tracksParentEl = createTracksParentElement(length, objectMixinId);
      // add these trains to the segment parent
      segmentParentEl.append(tracksParentEl);
    } else if (segments[i].type === 'turn-lane') {
      groundMixinId = 'drive-lane'; // use normal drive lane road material
      var markerMixinId = variantList[1]; // set the mixin of the road markings to match the current variant name

      // Fix streetmix inbound turn lane orientation (change left to right) per: https://github.com/streetmix/streetmix/issues/683
      if (variantList[0] === 'inbound') {
        markerMixinId = markerMixinId.replace(/left|right/g, function (m) {
          return m === 'left' ? 'right' : 'left';
        });
      }
      if (variantList[1] === 'shared') {
        markerMixinId = 'left';
      }
      if (variantList[1] === 'left-right-straight') {
        markerMixinId = 'all';
      }
      var mixinString = 'stencils ' + markerMixinId;

      // make the parent for all the objects to be cloned
      const stencilsParentEl = createStencilsParentElement({
        y: elevationPosY + 0.015
      });
      cloneMixinAsChildren({
        objectMixinId: mixinString,
        parentEl: stencilsParentEl,
        rotation: '-90 ' + rotationY + ' 0',
        step: 15,
        radius: clonedObjectRadius
      });
      // add this stencil stuff to the segment parent
      segmentParentEl.append(stencilsParentEl);
      if (variantList[1] === 'shared') {
        // add an additional marking to represent the opposite turn marking stencil (rotated 180º)
        const stencilsParentEl = createStencilsParentElement({
          y: elevationPosY + 0.015,
          z: -3 * isOutbound
        });
        cloneMixinAsChildren({
          objectMixinId: mixinString,
          parentEl: stencilsParentEl,
          rotation: '-90 ' + (rotationY + 180) + ' 0',
          step: 15,
          radius: clonedObjectRadius
        });
        // add this stencil stuff to the segment parent
        segmentParentEl.append(stencilsParentEl);
      }
    } else if (segments[i].type === 'divider' && variantList[0] === 'bollard') {
      groundMixinId = 'divider';
      // make some safehits
      const safehitsParentEl = createSafehitsParentElement();
      cloneMixinAsChildren({
        objectMixinId: 'safehit',
        parentEl: safehitsParentEl,
        step: 4,
        radius: clonedObjectRadius
      });
      // add the safehits to the segment parent
      segmentParentEl.append(safehitsParentEl);
      repeatCount[0] = 1;
      repeatCount[1] = parseInt(length) / 4;
    } else if (segments[i].type === 'divider' && variantList[0] === 'flowers') {
      groundMixinId = 'grass';
      segmentParentEl.append(
        createDividerVariant('flowers', clonedObjectRadius, 2.25)
      );
    } else if (
      segments[i].type === 'divider' &&
      variantList[0] === 'planting-strip'
    ) {
      groundMixinId = 'grass';
      segmentParentEl.append(
        createDividerVariant('planting-strip', clonedObjectRadius, 2.25)
      );
    } else if (
      segments[i].type === 'divider' &&
      variantList[0] === 'planter-box'
    ) {
      groundMixinId = 'grass';
      segmentParentEl.append(
        createDividerVariant('planter-box', clonedObjectRadius, 2.45)
      );
    } else if (
      segments[i].type === 'divider' &&
      variantList[0] === 'palm-tree'
    ) {
      groundMixinId = 'grass';
      const treesParentEl = createTreesParentElement();
      cloneMixinAsChildren({
        objectMixinId: 'palm-tree',
        parentEl: treesParentEl,
        randomY: true,
        radius: clonedObjectRadius
      });
      segmentParentEl.append(treesParentEl);
    } else if (
      segments[i].type === 'divider' &&
      variantList[0] === 'big-tree'
    ) {
      groundMixinId = 'grass';
      const treesParentEl = createTreesParentElement();
      cloneMixinAsChildren({
        objectMixinId: 'tree3',
        parentEl: treesParentEl,
        randomY: true,
        radius: clonedObjectRadius
      });
      segmentParentEl.append(treesParentEl);
    } else if (segments[i].type === 'divider' && variantList[0] === 'bush') {
      groundMixinId = 'grass';
      segmentParentEl.append(
        createDividerVariant('bush', clonedObjectRadius, 2.25)
      );
    } else if (segments[i].type === 'divider' && variantList[0] === 'dome') {
      groundMixinId = 'divider';
      segmentParentEl.append(
        createDividerVariant('dome', clonedObjectRadius, 2.25)
      );
      repeatCount[0] = 1;
      repeatCount[1] = parseInt(length) / 4;
    } else if (segments[i].type === 'divider') {
      groundMixinId = 'divider';
      repeatCount[0] = 1;
      repeatCount[1] = parseInt(length) / 4;
    } else if (
      segments[i].type === 'temporary' &&
      variantList[0] === 'barricade'
    ) {
      groundMixinId = 'drive-lane';
      segmentParentEl.append(
        createClonedVariants('temporary-barricade', clonedObjectRadius, 2.25)
      );
    } else if (
      segments[i].type === 'temporary' &&
      variantList[0] === 'traffic-cone'
    ) {
      groundMixinId = 'drive-lane';
      segmentParentEl.append(
        createClonedVariants('temporary-traffic-cone', clonedObjectRadius, 2.25)
      );
    } else if (
      segments[i].type === 'temporary' &&
      variantList[0] === 'jersey-barrier-plastic'
    ) {
      groundMixinId = 'drive-lane';
      segmentParentEl.append(
        createClonedVariants(
          'temporary-jersey-barrier-plastic',
          clonedObjectRadius,
          2.25
        )
      );
    } else if (
      segments[i].type === 'temporary' &&
      variantList[0] === 'jersey-barrier-concrete'
    ) {
      groundMixinId = 'drive-lane';
      segmentParentEl.append(
        createClonedVariants(
          'temporary-jersey-barrier-concrete',
          clonedObjectRadius,
          2.93
        )
      );
    } else if (
      segments[i].type === 'bus-lane' ||
      segments[i].type === 'brt-lane'
    ) {
      groundMixinId = getBusLaneMixin(variantList[1]);

      segmentParentEl.append(
        createBusElement(variantList, length, showVehicles)
      );

      // create parent for the bus lane stencils to rotate the phrase instead of the word
      let reusableObjectStencilsParentEl;

      reusableObjectStencilsParentEl = createStencilsParentElement({
        y: elevationPosY + 0.015
      });
      cloneMixinAsChildren({
        objectMixinId: 'stencils word-bus',
        parentEl: reusableObjectStencilsParentEl,
        rotation: '-90 ' + rotationY + ' 0',
        step: 50,
        radius: clonedObjectRadius
      });
      // add this stencil stuff to the segment parent
      segmentParentEl.append(reusableObjectStencilsParentEl);

      reusableObjectStencilsParentEl = createStencilsParentElement({
        y: elevationPosY + 0.015,
        z: 10
      });
      cloneMixinAsChildren({
        objectMixinId: 'stencils word-taxi',
        parentEl: reusableObjectStencilsParentEl,
        rotation: '-90 ' + rotationY + ' 0',
        step: 50,
        radius: clonedObjectRadius
      });
      // add this stencil stuff to the segment parent
      segmentParentEl.append(reusableObjectStencilsParentEl);

      reusableObjectStencilsParentEl = createStencilsParentElement({
        y: elevationPosY + 0.015,
        z: 20
      });
      cloneMixinAsChildren({
        objectMixinId: 'stencils word-only',
        parentEl: reusableObjectStencilsParentEl,
        rotation: '-90 ' + rotationY + ' 0',
        step: 50,
        radius: clonedObjectRadius
      });
      // add this stencil stuff to the segment parent
      segmentParentEl.append(reusableObjectStencilsParentEl);
    } else if (segments[i].type === 'drive-lane') {
      const isAnimated = variantList[2] === 'animated' || globalAnimated;
      const count = getRandomIntInclusive(2, 3);
      const carStep = 7.3;
      segmentParentEl.append(
        createDriveLaneElement(
          variantList,
          segmentWidthInMeters,
          length,
          isAnimated,
          showVehicles,
          count,
          carStep
        )
      );
    } else if (segments[i].type === 'food-truck') {
      groundMixinId = 'drive-lane';
      segmentParentEl.append(createFoodTruckElement(variantList, length));
    } else if (segments[i].type === 'flex-zone') {
      groundMixinId = 'bright-lane';
      segmentParentEl.append(
        createFlexZoneElement(variantList, length, showVehicles)
      );

      let reusableObjectStencilsParentEl;

      reusableObjectStencilsParentEl = createStencilsParentElement({
        y: elevationPosY + 0.015,
        z: 5
      });
      cloneMixinAsChildren({
        objectMixinId: 'stencils word-loading-small',
        parentEl: reusableObjectStencilsParentEl,
        rotation: '-90 ' + rotationY + ' 0',
        step: 50,
        radius: clonedObjectRadius
      });
      // add this stencil stuff to the segment parent
      segmentParentEl.append(reusableObjectStencilsParentEl);

      reusableObjectStencilsParentEl = createStencilsParentElement({
        y: elevationPosY + 0.015,
        z: -5
      });
      cloneMixinAsChildren({
        objectMixinId: 'stencils word-only-small',
        parentEl: reusableObjectStencilsParentEl,
        rotation: '-90 ' + rotationY + ' 0',
        step: 50,
        radius: clonedObjectRadius
      });
      // add this stencil stuff to the segment parent
      segmentParentEl.append(reusableObjectStencilsParentEl);
    } else if (segments[i].type === 'sidewalk' && variantList[0] !== 'empty') {
      // handles variantString with value sparse, normal, or dense sidewalk
      const isAnimated = variantList[1] === 'animated' || globalAnimated;
      segmentParentEl.append(
        createSidewalkClonedVariants(
          segmentWidthInMeters,
          variantList[0],
          elevationPosY,
          length,
          'random',
          isAnimated
        )
      );
    } else if (segments[i].type === 'sidewalk-wayfinding') {
      segmentParentEl.append(createWayfindingElements());
    } else if (segments[i].type === 'sidewalk-bench') {
      // make the parent for all the benches
      const benchesParentEl = createBenchesParentElement();

      const rotationCloneY = variantList[0] === 'right' ? -90 : 90;
      if (variantList[0] === 'center') {
        cloneMixinAsChildren({
          objectMixinId: 'bench_orientation_center',
          parentEl: benchesParentEl,
          rotation: '0 ' + rotationCloneY + ' 0',
          radius: clonedObjectRadius
        });
        // add benches to the segment parent
        segmentParentEl.append(benchesParentEl);
      } else {
        // `right` or `left` bench
        cloneMixinAsChildren({
          objectMixinId: 'bench',
          parentEl: benchesParentEl,
          rotation: '0 ' + rotationCloneY + ' 0',
          radius: clonedObjectRadius
        });
        // add benches to the segment parent
        segmentParentEl.append(benchesParentEl);
      }
    } else if (segments[i].type === 'sidewalk-bike-rack') {
      // make the parent for all the bike racks
      const bikeRacksParentEl = createBikeRacksParentElement(elevationPosY);

      const rotationCloneY = variantList[1] === 'sidewalk-parallel' ? 90 : 0;
      cloneMixinAsChildren({
        objectMixinId: 'bikerack',
        parentEl: bikeRacksParentEl,
        rotation: '0 ' + rotationCloneY + ' 0',
        radius: clonedObjectRadius
      });
      // add bike racks to the segment parent
      segmentParentEl.append(bikeRacksParentEl);
    } else if (segments[i].type === 'magic-carpet') {
      groundMixinId = 'drive-lane';
      segmentParentEl.append(createMagicCarpetElement(showVehicles));
    } else if (segments[i].type === 'outdoor-dining') {
      groundMixinId = variantList[1] === 'road' ? 'drive-lane' : 'sidewalk';
      segmentParentEl.append(createOutdoorDining(length, elevationPosY));
    } else if (segments[i].type === 'parklet') {
      groundMixinId = 'drive-lane';
      segmentParentEl.append(createParkletElement(length, variantList));
    } else if (segments[i].type === 'bikeshare') {
      // make the parent for all the stations
      segmentParentEl.append(
        createBikeShareStationElement(variantList, elevationPosY)
      );
    } else if (segments[i].type === 'utilities') {
      var rotation = variantList[0] === 'right' ? '0 180 0' : '0 0 0';
      const utilityPoleElems = createClonedVariants(
        'utility_pole',
        clonedObjectRadius,
        15,
        rotation
      );
      segmentParentEl.append(utilityPoleElems);
    } else if (segments[i].type === 'sidewalk-tree') {
      // make the parent for all the trees
      const treesParentEl = createTreesParentElement();
      if (variantList[0] === 'palm-tree') {
        objectMixinId = 'palm-tree';
      } else {
        objectMixinId = 'tree3';
      }
      // clone a bunch of trees under the parent
      cloneMixinAsChildren({
        objectMixinId: objectMixinId,
        parentEl: treesParentEl,
        randomY: true,
        radius: clonedObjectRadius
      });
      segmentParentEl.append(treesParentEl);
    } else if (
      segments[i].type === 'sidewalk-lamp' &&
      (variantList[1] === 'modern' || variantList[1] === 'pride')
    ) {
      // Make the parent object for all the lamps
      const lampsParentEl = createLampsParentElement();
      if (variantList[0] === 'both') {
        cloneMixinAsChildren({
          objectMixinId: 'lamp-modern-double',
          parentEl: lampsParentEl,
          rotation: '0 0 0',
          radius: clonedObjectRadius
        });
        segmentParentEl.append(lampsParentEl);
      } else {
        var rotationCloneY = variantList[0] === 'right' ? 0 : 180;
        cloneMixinAsChildren({
          objectMixinId: 'lamp-modern',
          parentEl: lampsParentEl,
          rotation: '0 ' + rotationCloneY + ' 0',
          radius: clonedObjectRadius
        });
        segmentParentEl.append(lampsParentEl);
      }
      // Add the pride flags to the lamp posts
      if (
        variantList[1] === 'pride' &&
        (variantList[0] === 'right' || variantList[0] === 'both')
      ) {
        cloneMixinAsChildren({
          objectMixinId: 'pride-flag',
          parentEl: lampsParentEl,
          positionXYString: '0.409 5',
          radius: clonedObjectRadius
        });
      }
      if (
        variantList[1] === 'pride' &&
        (variantList[0] === 'left' || variantList[0] === 'both')
      ) {
        cloneMixinAsChildren({
          objectMixinId: 'pride-flag',
          parentEl: lampsParentEl,
          rotation: '0 -180 0',
          positionXYString: '-0.409 5',
          radius: clonedObjectRadius
        });
      }
    } else if (
      segments[i].type === 'sidewalk-lamp' &&
      variantList[1] === 'traditional'
    ) {
      // make the parent for all the lamps
      const lampsParentEl = createLampsParentElement();
      // clone a bunch of lamps under the parent
      cloneMixinAsChildren({
        objectMixinId: 'lamp-traditional',
        parentEl: lampsParentEl,
        radius: clonedObjectRadius
      });
      segmentParentEl.append(lampsParentEl);
    } else if (segments[i].type === 'transit-shelter') {
      var rotationBusStopY = variantList[0] === 'left' ? 90 : 270;
      segmentParentEl.append(
        createBusStopElement(rotationBusStopY, elevationPosY)
      );
    } else if (segments[i].type === 'brt-station') {
      segmentParentEl.append(createBrtStationElement());
    } else if (
      segments[i].type === 'separator' &&
      variantList[0] === 'dashed'
    ) {
      groundMixinId = 'markings dashed-stripe';
      positionY = elevationPosY + 0.01; // make sure the lane marker is above the asphalt
      // for all markings material property repeat = "1 25". So every 150/25=6 meters put a dash
      repeatCount[0] = 1;
      repeatCount[1] = parseInt(length / 6);
    } else if (segments[i].type === 'separator' && variantList[0] === 'solid') {
      groundMixinId = 'markings solid-stripe';
      positionY = elevationPosY + 0.01; // make sure the lane marker is above the asphalt
    } else if (
      segments[i].type === 'separator' &&
      variantList[0] === 'doubleyellow'
    ) {
      groundMixinId = 'markings solid-doubleyellow';
      positionY = elevationPosY + 0.01; // make sure the lane marker is above the asphalt
    } else if (
      segments[i].type === 'separator' &&
      variantList[0] === 'shortdashedyellow'
    ) {
      groundMixinId = 'markings yellow short-dashed-stripe';
      positionY = elevationPosY + 0.01; // make sure the lane marker is above the asphalt
      // for short-dashed-stripe every 3 meters put a dash
      repeatCount[0] = 1;
      repeatCount[1] = parseInt(length / 3);
    } else if (
      segments[i].type === 'separator' &&
      variantList[0] === 'soliddashedyellow'
    ) {
      groundMixinId = 'markings yellow solid-dashed';
      positionY = elevationPosY + 0.01; // make sure the lane marker is above the asphalt
    } else if (
      segments[i].type === 'separator' &&
      variantList[0] === 'soliddashedyellowinverted'
    ) {
      groundMixinId = 'markings yellow solid-dashed';
      positionY = elevationPosY + 0.01; // make sure the lane marker is above the asphalt
      rotationY = '180';
      repeatCount[0] = 1;
      repeatCount[1] = parseInt(length / 6);
    } else if (segments[i].type === 'parking-lane') {
      let reusableObjectStencilsParentEl;

      groundMixinId = 'bright-lane';
      let parkingMixin = 'stencils parking-t';

      const carCount = 5;
      let carStep = 6;

      const rotationVars = {
        outbound: 90,
        inbound: 90,
        sideways: 0,
        'angled-front-left': 30,
        'angled-front-right': -30,
        'angled-rear-left': -30,
        'angled-rear-right': 30
      };
      let markingsRotZ = rotationVars[variantList[0]];
      let markingLength;

      // calculate position X and rotation Z for T-markings
      let markingPosX = segmentWidthInMeters / 2;
      if (markingsRotZ === 90 && variantList[1] === 'right') {
        markingsRotZ = -90;
        markingPosX = -markingPosX + 0.75;
      } else {
        markingPosX = markingPosX - 0.75;
      }

      if (variantList[0] === 'sideways' || variantList[0].includes('angled')) {
        carStep = 3;
        markingLength = segmentWidthInMeters;
        markingPosX = 0;
        parkingMixin = 'markings solid-stripe';
      }
      const markingPosXY = markingPosX + ' 0';
      const clonedStencilRadius = length / 2 - carStep;

      segmentParentEl.append(
        createDriveLaneElement(
          [...variantList, 'car'],
          segmentWidthInMeters,
          length,
          false,
          showVehicles,
          carCount,
          carStep
        )
      );
      if (variantList[1] === 'left') {
        reusableObjectStencilsParentEl = createStencilsParentElement({
          y: elevationPosY + 0.015
        });
        cloneMixinAsChildren({
          objectMixinId: parkingMixin,
          parentEl: reusableObjectStencilsParentEl,
          positionXYString: markingPosXY,
          rotation: '-90 ' + '90 ' + markingsRotZ,
          length: markingLength,
          step: carStep,
          radius: clonedStencilRadius
        });
      } else {
        reusableObjectStencilsParentEl = createStencilsParentElement({
          y: elevationPosY + 0.015
        });
        cloneMixinAsChildren({
          objectMixinId: parkingMixin,
          parentEl: reusableObjectStencilsParentEl,
          positionXYString: markingPosXY,
          rotation: '-90 ' + '90 ' + markingsRotZ,
          length: markingLength,
          step: carStep,
          radius: clonedStencilRadius
        });
      }
      // add the stencils to the segment parent
      segmentParentEl.append(reusableObjectStencilsParentEl);
    }

    if (streetmixParsersTested.isSidewalk(segments[i].type)) {
      groundMixinId = 'sidewalk';
      repeatCount[0] = segmentWidthInMeters / 1.5;
      // every 2 meters repeat sidewalk texture
      repeatCount[1] = parseInt(length / 2);
    }

    // add new object
    if (segments[i].type !== 'separator') {
      segmentParentEl.append(
        createSegmentElement(
          segmentWidthInMeters,
          positionY,
          groundMixinId,
          length,
          repeatCount,
          elevation
        )
      );
    } else {
      segmentParentEl.append(
        createSeparatorElement(
          positionY,
          rotationY,
          groundMixinId,
          length,
          repeatCount,
          elevation
        )
      );
    }
    // returns JSON output instead
    // append the new surfaceElement to the segmentParentEl
    streetParentEl.append(segmentParentEl);
    segmentParentEl.setAttribute('position', segmentPositionX + ' 0 0');
    segmentParentEl.setAttribute(
      'data-layer-name',
      'Segment • ' + segments[i].type + ', ' + variantList[0]
    );
  }
  // create new brown box to represent ground underneath street
  const dirtBox = document.createElement('a-box');
  const xPos = cumulativeWidthInMeters / 2;
  dirtBox.setAttribute('position', `${xPos} -1.1 0`); // what is x? x = 0 - cumulativeWidthInMeters / 2
  dirtBox.setAttribute('height', 2); // height is 2 meters from y of -0.1 to -y of 2.1
  dirtBox.setAttribute('width', cumulativeWidthInMeters);
  dirtBox.setAttribute('depth', length - 0.2); // depth is length - 0.1 on each side
  dirtBox.setAttribute('material', 'color: #664B00;');
  dirtBox.setAttribute('data-layer-name', 'Underground');
  streetParentEl.append(dirtBox);
  return streetParentEl;
}
module.exports.processSegments = processSegments;

// test - for streetObject of street 44 and buildingElementId render 2 building sides
function processBuildings(left, right, streetWidth, showGround, length) {
  const buildingElement = document.createElement('a-entity');
  const clonedObjectRadius = 0.45 * length;
  buildingElement.classList.add('buildings-parent');
  buildingElement.setAttribute(
    'data-layer-name',
    'Buildings & Blocks Container'
  );
  buildingElement.setAttribute('position', '0 0.2 0');
  const buildingsArray = [left, right];

  // TODO: Sound temporarily disabled
  // var ambientSoundJSONString = JSON.stringify(streetmixParsersTested.getAmbientSoundJSON(buildingsArray));
  // var soundParentEl = document.createElement('a-entity');
  // soundParentEl.setAttribute('create-from-json', 'jsonString', ambientSoundJSONString);
  // buildingElement.appendChild(soundParentEl);

  function createBuilding(buildingType, sideMultiplier) {
    // Make buildings
    const buildingsArray = streetmixParsersTested.createBuildingsArray(
      length,
      buildingType
    );
    const buildingJSONString = JSON.stringify(buildingsArray);
    const placedObjectEl = document.createElement('a-entity');

    placedObjectEl.setAttribute('rotation', '0 ' + 90 * sideMultiplier + ' 0');
    placedObjectEl.setAttribute(
      'create-from-json',
      'jsonString',
      buildingJSONString
    );
    return placedObjectEl;
  }

  // possible 'block' type input values: grass, fence, narrow, wide, waterfront, residential, parking-lot, (new: archway, wall sp?)
  buildingsArray.forEach((currentValue, index) => {
    if (currentValue.length === 0) {
      return;
    } // if empty string then skip
    const side = index === 0 ? 'left' : 'right';
    const sideMultiplier = side === 'left' ? -1 : 1;

    const groundPositionX = (length / 4 + streetWidth / 2) * sideMultiplier;
    const buildingPositionX = (150 / 2 + streetWidth / 2) * sideMultiplier;

    // this is the logic to make the ground box
    if (showGround) {
      const variantToMaterialMapping = {
        grass: 'ground-grass-material',
        fence: 'ground-grass-material',
        'parking-lot': 'ground-parking-lot-material',
        residential: 'ground-grass-material',
        narrow: 'ground-asphalt-material',
        wide: 'ground-asphalt-material',
        arcade: 'ground-tiled-concrete-material',
        'compound-wall': 'ground-asphalt-material'
      };

      let groundParentEl;
      if (currentValue === 'waterfront') {
        groundParentEl = document.createElement('a-ocean-box');
        groundParentEl.setAttribute('geometry', {
          primitive: 'box',
          depth: length,
          width: length / 2,
          height: 2,
          segmentsHeight: 1,
          segmentsDepth: 10,
          segmentsWidth: 10
        });
        groundParentEl.setAttribute('position', { y: -3 });
      } else {
        groundParentEl = document.createElement('a-box');
        groundParentEl.setAttribute('depth', length);
        groundParentEl.setAttribute('height', 2);
        groundParentEl.setAttribute('width', length / 2);
        groundParentEl.setAttribute('shadow', '');
        // groundParentEl.setAttribute('material', 'src:#grass-texture;repeat:5 5;roughness:0.8;');
        groundParentEl.setAttribute(
          'mixin',
          variantToMaterialMapping[currentValue]
        ); // case grass, fence
        groundParentEl.setAttribute('position', { y: -1 });
      }

      if (side === 'right') {
        // groundParentEl.setAttribute('position', groundPositionX + ' -1 0');
        groundParentEl.setAttribute('position', { x: groundPositionX });
      } else {
        groundParentEl.setAttribute('position', { x: groundPositionX });
      }
      groundParentEl.classList.add('ground-' + side);
      groundParentEl.setAttribute(
        'data-layer-name',
        'Ground ' + side + ' • ' + currentValue
      );
      buildingElement.appendChild(groundParentEl);
    }

    // make building
    const buildingPos = {
      x: buildingPositionX,
      y: 0,
      z: index === 1 ? length / 2 : -length / 2
    };

    switch (currentValue) {
      case 'narrow':
      case 'wide':
        buildingPos.x += sideMultiplier * -72;
        break;
      case 'residential':
        buildingPos.x += sideMultiplier * -64;
        buildingPos.y = -0.58;
        // the grass should be slightly lower than the path - 0.17 instead of 0.2 for other buildings
        buildingElement.setAttribute('position', '0 0.17 0');
        break;
      case 'arcade':
        buildingPos.x += sideMultiplier * -70.5;
    }
    const newBuildings = createBuilding(currentValue, sideMultiplier);
    newBuildings.setAttribute(
      'data-layer-name',
      'Buildings ' + side + ' • ' + currentValue
    );

    newBuildings.setAttribute('position', buildingPos);
    buildingElement.append(newBuildings);

    if (currentValue === 'waterfront' || currentValue === 'compound-wall') {
      const objectPositionX = buildingPositionX - (sideMultiplier * 150) / 2;
      const placedObjectEl = document.createElement('a-entity');
      placedObjectEl.setAttribute('class', 'seawall-parent');
      placedObjectEl.setAttribute('position', { x: objectPositionX, z: 4.5 }); // position="1.043 0.100 -3.463"
      let rotationCloneY;
      if (currentValue === 'compound-wall') {
        placedObjectEl.setAttribute('position', { y: 3 });
        placedObjectEl.setAttribute('position', {
          x: objectPositionX + 1.5 * sideMultiplier
        });
        rotationCloneY = side === 'left' ? 90 : -90;
      } else {
        rotationCloneY = side === 'left' ? -90 : 90;
      }
      placedObjectEl.classList.add('seawall-parent-' + side);
      buildingElement.appendChild(placedObjectEl);
      // clone a bunch of seawalls under the parent
      cloneMixinAsChildren({
        objectMixinId: 'seawall',
        parentEl: placedObjectEl,
        rotation: '0 ' + rotationCloneY + ' 0',
        step: 15,
        radius: clonedObjectRadius
      });
    }

    if (currentValue === 'fence' || currentValue === 'parking-lot') {
      const objectPositionX = buildingPositionX - (sideMultiplier * 150) / 2;
      // make the parent for all the objects to be cloned
      const placedObjectEl = document.createElement('a-entity');
      placedObjectEl.setAttribute('class', 'fence-parent');
      placedObjectEl.setAttribute('position', objectPositionX + ' 0 4.625'); // position="1.043 0.100 -3.463"
      placedObjectEl.classList.add('fence-parent-' + buildingPositionX);
      // clone a bunch of fences under the parent
      const rotationCloneY = side === 'right' ? -90 : 90;
      cloneMixinAsChildren({
        objectMixinId: 'fence',
        parentEl: placedObjectEl,
        rotation: '0 ' + rotationCloneY + ' 0',
        step: 9.25,
        radius: clonedObjectRadius
      });
      buildingElement.appendChild(placedObjectEl);
    }
  });
  return buildingElement;
}
module.exports.processBuildings = processBuildings;
