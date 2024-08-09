// create segment component by provided type and variantString
AFRAME.registerComponent('street-segment', {
  schema: {
    type: { type: 'string' },
    variant: { type: 'string' },
    length: { type: 'number', default: 50 },
    widht: { type: 'number', default: 3 }
  },
  init: function () {
  },
  update: function () {

  }
 });
