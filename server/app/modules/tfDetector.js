const tf = require('@tensorflow/tfjs-node');
const coco_ssd = require('@tensorflow-models/coco-ssd');

let model = undefined;

(async () => {
  model = await coco_ssd.load({
    base: "mobilenet_v1",
  });
})();

const processImage = async function(imageData, imageWidth, imageHeight) {    

    const image = tf.node.decodeImage(imageData);
    const predictions = await model.detect(image, 3, 0.25);
    let detections = [];

    predictions.forEach(element => {      
      if (element.class === "person"){
        detections.push(createObject(element, imageWidth, imageHeight));
      }
      else if (element.class === "couch"){
        detections.push(createObject(element, imageWidth, imageHeight));
      }
      else if (element.class === "cup"){
        detections.push(createObject(element, imageWidth, imageHeight));
      }
      else{
        //console.log(element.class);
      }
    });

    return detections;
}

function createObject(element, imageWidth, imageHeight){
  return { 
    detectedOn: new Date(), 
    x: element.bbox[0], 
    y: element.bbox[1], 
    width: element.bbox[2], 
    height: element.bbox[3],
    imageWidth : imageWidth,
    imageHeight : imageHeight
  }
}

module.exports.processImage = processImage;