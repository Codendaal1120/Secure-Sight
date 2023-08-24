const tf = require('@tensorflow/tfjs-node');
const coco_ssd = require('@tensorflow-models/coco-ssd');
const logger = require('../modules/loggingModule').getLogger('tfDetector');
const utility = require('./utility');

let model = undefined;

(async () => {
  logger.log('info', 'Loading model');
  model = await coco_ssd.load({
    base: "mobilenet_v1",
  });
})();

/**
 * Processes image and performs object identification
 * @param {Buffer} _imgData - image data to detect objects
 * @param {Number} _imgWidth - width of the image
 * @param {Number} _imgHeight - heigth of the image
 * @param {Date} _detectedOn - Datetime when the frame was captured 
 * @return {Array} Detected objects
 */
async function processImage(_imgData, _imgWidth, _imgHeight, _detectedOn) {    

    const image = tf.node.decodeImage(_imgData);
    const predictions = await model.detect(image, 3, 0.25);
    let detections = [];

    predictions.forEach(element => {     
      //console.log(element.class, 'detected') ;
      if (element.class === "person"){
        detections.push(createObject(element, _imgWidth, _imgHeight, _detectedOn));
      }
      else if (element.class === "couch"){
        detections.push(createObject(element, _imgWidth, _imgHeight, _detectedOn));
      }
      else if (element.class === "cup"){
        detections.push(createObject(element, _imgWidth, _imgHeight, _detectedOn));
      }
      else{
        //logger.log('info', element.class);
      }
    });

    return detections;
}

/*
TP - 2304x1296
eufy - 1920x1088
revo - 2880x1616
*/

/**
 * Instantiate the return object
 * @param {Object} _element - Detected object
 * @param {Number} _imgWidth - Width of the image
 * @param {Number} _imgHeight - heigth of the image
 * @param {Date} _detectedOn - Datetime when the frame was captured
 * @return {Object} Return object
 */
function createObject(_element, _imgWidth, _imgHeight, _detectedOn){
  return { 
    detectedOn: _detectedOn, 
    x: utility.mapRange(_element.bbox[0], 0, _imgWidth, 0, 1),
    y: utility.mapRange(_element.bbox[1], 0, _imgHeight, 0, 1), 
    width: utility.mapRange(_element.bbox[2], 0, _imgWidth, 0, 1), 
    height: utility.mapRange(_element.bbox[3], 0, _imgHeight, 0, 1),
  }
}

module.exports.processImage = processImage;