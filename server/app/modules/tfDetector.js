const tf = require('@tensorflow/tfjs-node');
const coco_ssd = require('@tensorflow-models/coco-ssd');

let model = undefined;

(async () => {
  console.log('Loading model');
  model = await coco_ssd.load({
    base: "mobilenet_v1",
  });
})();

/**
 * Processes image and performs object identification
 * @param {Buffer} _imgData - image data to detect objects
 * @param {Number} _imgWidth - width of the image
 * @param {Number} _imgHeight - heigth of the image
 * @return {Array} Detected objects
 */
async function processImage(_imgData, _imgWidth, _imgHeight) {    

    const image = tf.node.decodeImage(_imgData);
    const predictions = await model.detect(image, 3, 0.25);
    let detections = [];

    predictions.forEach(element => {      
      if (element.class === "person"){
        detections.push(createObject(element, _imgWidth, _imgHeight));
      }
      else if (element.class === "couch"){
        detections.push(createObject(element, _imgWidth, _imgHeight));
      }
      else if (element.class === "cup"){
        detections.push(createObject(element, _imgWidth, _imgHeight));
      }
      else{
        //console.log(element.class);
      }
    });

    return detections;
}

/**
 * Instantiate the return object
 * @param {Object} _element - Detected object
 * @param {Number} _imgWidth - Width of the image
 * @param {Number} _imgHeight - heigth of the image
 * @return {Object} Return object
 */
function createObject(_element, _imgWidth, _imgHeight){
  return { 
    detectedOn: new Date(), 
    x: _element.bbox[0], 
    y: _element.bbox[1], 
    width: _element.bbox[2], 
    height: _element.bbox[3],
    imageWidth : _imgWidth,
    imageHeight : _imgHeight
  }
}

module.exports.processImage = processImage;