const SVM = require('libsvm-js/asm');
const hog = require("./hogDetector");
const hogTEMP = require("./hogDetectorTEMP");
const imgModule = require("./imageModule");
const fs = require("fs");
//const util = require('util');
//const readdir = util.promisify(fs.readdir);
const path = require('path');
const math = require('mathjs');
const Kernel = require('ml-kernel');
const range = require('lodash.range');
const {default: Image} = require('image-js');

/**
 * Loads the files in the specified directory, extracts the HOG features and trains the SVM model
 * Training data from https://www.kaggle.com/datasets/saravananchandran/pedestrian-detection-data-set?resource=download
 */
const trainSVM = async function() {   
    // The training directory of training images, each class should be stored in a sub folder with the class name, for example ./train/cat, ./train/dog

    var imageDir = path.join(__dirname, '../ml', 'input');
    var labels = fs.readdirSync(imageDir);    
    var trainingData = [];
    var trainingLabels = [];

    for (let i = 0; i < labels.length; i++) {

        var labelDirectory = imageDir + '/' + labels[i];
        var files = fs.readdirSync(labelDirectory);

        for (let j = 0; j < files.length; j++) {
            console.log('Loading ', files[j]);        
            
            //var img = await imgModule.getImageDataFromFile(labelDirectory + '/' + files[j]);
            //var img = await Image.load(labelDirectory + '/' + files[j]);
            //img = await img.scale({width:100, height:100});
            //return hog.extractHogFeatures(img.data, img.width, img.height);

            var loadHog = await loadImageAndGetHog(labelDirectory + '/' + files[j]);
            if (loadHog.success){
                trainingData.push(loadHog.payload);
                trainingLabels.push(labels[i] == "human" ? 1 : 0);
            }
            
        }        
    }

    var ker = new Kernel('polynomial', {degree: 3, scale: 1 / trainingData.length});
    var kTrain = ker.compute(trainingData).addColumn(0, range(1, trainingData.length + 1));

    await trainModel(kTrain, trainingLabels);
}

/**
 * The dataset downloaded from https://www.kaggle.com/datasets/saravananchandran/pedestrian-detection-data-set?resource=download
 * stores the label in the annotation xml, we need to parse it and move the files accordingly
 */
const parseTrainingFiles = async function()
{
    var parser = require('xml2json');
    var humanPath = path.join(__dirname, '../ml', 'input', 'human');
    var nonHumanPath = path.join(__dirname, '../ml', 'input', 'non_human');
    var dataSetPath = path.join(__dirname, '../ml', 'data_set', 'JPEGImages');
    var annotationsPath = path.join(__dirname, '../ml', 'data_set', 'Annotations');
    var files = fs.readdirSync(dataSetPath);

    for (let i = 0; i < files.length; i++) {
        var xmlFile = files[i].substring(0, files[i].length - 4) + ".xml";
        var xml = fs.readFileSync(annotationsPath + "\\" + xmlFile);
        var json = JSON.parse(parser.toJson(xml));
        var isHuman = false;

        if (Array.isArray(json.annotation.object)){           
            for (let j = 0; j < json.annotation.object.length; j++) {
                if (json.annotation.object[j].name == "person"){
                    isHuman = true;
                    break;
                }                
            }
            continue;
        }

        if (json.annotation.object.name == "person"){
            isHuman = true;
        }

        if (isHuman){
            fs.renameSync(dataSetPath + "\\" + files[i], humanPath + "\\" + files[i]);
        }
        else{
            fs.renameSync(dataSetPath + "\\" + files[i], nonHumanPath + "\\" + files[i]);
        }
    }
}

/**
 * Loads the image and gets the hog features
 * @param {string} _imagePath - Path to file
 * @return {Array} HOG features
 */
loadImageAndGetHog = async function(_imagePath){
    //var img = await imgModule.getImageDataFromFile(_imagePath);
    try{
        var img = await Image.load(_imagePath);
        img = await img.scale({width:100, height:100});
        var desc = hog.extractHogFeatures(img.data, img.width, img.height);
        return { success : true, payload : desc };
    }catch(err){
        console.error(`ERROR loading ${_imagePath} : ${err}`)
        return { success : false, error : err };
    }    
}

/**
 * Trains the svm model
 * @param {Array} _features - Training data
 * @param {Array} _labels - Training data labels
 * @see https://github.com/mljs/libsvm
 */
trainModel = async function(_features, _labels) { 

    let options = {
        type: SVM.SVM_TYPES.NU_SVC, 
        kernel : SVM.KERNEL_TYPES.PRECOMPUTED,
        degree : 3,
        nu : 0.1,
        shrinking : false
    };

    const svm = new SVM(options);

    console.log("Training model");

    svm.train(_features, _labels);  // train the model

    var model = svm.serializeModel();
    var outPath = path.join(__dirname, '../ml', 'svm.model');
    fs.writeFileSync(outPath, model);

    

    // let fc = fs.readFileSync('E:\\Development\\BSC\\Sem7\\CM3070-Final Project\\POC-repo\\JS-POC\\libsvm-poc\\data\\export-predicted-images.json');
    // let models = JSON.parse(fc);
    // console.log('............ predicting....')
    // for (let i = 0; i < models.length; i++) {
    //     let p = svm.predictOne(models[i]);
    //     console.log(i + " = " + p)
    // }

    /*
    
   


 https://www.kaggle.com/datasets/saravananchandran/pedestrian-detection-data-set?resource=download
 
*/

}

/**
 * Trains the svm model
 * @param {Array} _features - Training data
 * @param {Array} _labels - Training data labels
 * @see https://github.com/mljs/libsvm
 */
testModel = async function(_features, _labels) {   

    // test
    var imageDir = path.join(__dirname, '../ml', 'test_images');
    var testImages = fs.readdirSync(imageDir);

    for (let i = 0; i < testImages.length; i++) {

        //var img = imgModule.getImageDataFromFile("E:\\Development\\BSC\\Sem7\\CM3070-Final Project\\.SecureSight\\server\\test\\files\\ml\\test_images\\" + testImages[i]);
        var loadHog = await loadImageAndGetHog(imageDir + "\\" + testImages[i]);
        if (loadHog.success){
            let p = svm.predictOne(loadHog.payload);
            console.log(testImages[i] + " = " + p);
        }
        //var data = hog.extractHogFeatures(img.data, img.width, img.height);

       
    }

}



module.exports.trainSVM = trainSVM;
module.exports.parseTrainingFiles = parseTrainingFiles;
