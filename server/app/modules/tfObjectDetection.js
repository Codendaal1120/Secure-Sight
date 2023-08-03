const tf = require('@tensorflow/tfjs-node');
const coco_ssd = require('@tensorflow-models/coco-ssd');

let model = undefined;

(async () => {
  model = await coco_ssd.load({
    base: "mobilenet_v1",
  });
})();

const processImage = async function(jpegImage, data) {    

    const image = tf.node.decodeImage(jpegImage.data);
    const predictions = await model.detect(image, 3, 0.25);
    let detections = [];

    predictions.forEach(element => {      
      if (element.class === "person"){
        detections.push({ element: element, imageWidth: data.width, imageHeight: data.height  });
      }
    });

    return detections;
}

module.exports.processImage = processImage;