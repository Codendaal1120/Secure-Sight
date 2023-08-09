const SVM = require('libsvm-js/asm');
const hog = require("./hogModule");
const fs = require("fs");
const path = require('path');
const Kernel = require('ml-kernel');
const range = require('lodash.range');
const {default: Image} = require('image-js');
const logger = require('../modules/loggingModule').getLogger('svmDetector');

//const IMG_SCALE_WIDTH = 100;
//const IMG_SCALE_HEIGHT = 100;

const IMG_SCALE_WIDTH = 64;
const IMG_SCALE_HEIGHT = 128;

const ML_PREFIX = "persons";

let svm = null;
let kernel = null;

/**
 * Performs object detection from the image data using HOG and SVM
 * @param {Buffer} _imgData - image data to transform into a HOG descriptor
 * @param {Number} _imgWidth - width of the image
 * @param {Number} _imgHeight - heigth of the image
 * @return {Array} Array of gradient vectors
 */
async function processImage(_imgData, _imgWidth, _imgHeight) {    
    if (!svm){
        logger.log('info', 'Loading model');
        svm = loadModelFromFile();
    }    

    return await predict(_imgData, _imgWidth, _imgHeight);
}

/**
 * Loads the files in the specified directory, extracts the HOG features and trains the SVM model
 * Training data from https://www.kaggle.com/datasets/constantinwerner/human-detection-dataset
 * The training directory of training images, each class should be stored in a sub folder with the class name, for example ./input/cat, ./input/dog
 */
async function trainSVM(prefix) {   
    if (!prefix){
        prefix = `${ML_PREFIX}`;
    }

    var imageDir = path.join(__dirname, '../ml', `${prefix}_input`);
    var mlData = await getMlData(imageDir);

    if (kernel == null){
        kernel = new Kernel('polynomial', {degree: 3, scale: 1 / mlData.data.length});
    }
    var kData = kernel.compute(mlData.data).addColumn(0, range(1, mlData.data.length + 1));    

    var testResults = await trainModel(kData, mlData.labels, prefix, mlData.data);
    return testResults;
}

/**
 * The dataset downloaded from Github example stores labels in csv which is linked to one large directory
 */
async function parseTrainingFiles(source)
{
    if (source  == "kaggle"){
        await parseTrainingFiles_Kaggle();
    }    

    if (source == 'image-classification'){
        await parseTrainingFiles_GitHubExample();
    }
}

async function parseTrainingFiles_GitHubExample(){
    var dir = path.join(__dirname, '../ml', 'GHE_input');
    //var trainCsv 
}

/**
 * The dataset downloaded from https://www.kaggle.com/datasets/saravananchandran/pedestrian-detection-data-set?resource=download
 * stores the label in the annotation xml, we need to parse it and move the files accordingly
 */
async function parseTrainingFiles_Kaggle(){
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
 * Predicts the image class using the pre trained model
 * @param {Array} _imageData - Imagedata
 * @param {Number} _imageHeight - Image height
 * @param {Number} _imageWidth - Image width
 * @param {Array} _labels - Optional indexed labels
 * @return {Object} Prediction results
 */
async function predict(_imageData, _imageWidth, _imageHeight, _labels = ['non_human', 'human']){
    var img = new Image(_imageWidth, _imageHeight, _imageData);
        
    if (!svm){
        logger.log('info', 'Loading model');
        svm = loadModelFromFile();
    }    

    logger.log('info', 'Predicting');

    img = await img.scale({width: IMG_SCALE_WIDTH, height: IMG_SCALE_HEIGHT});
    //var desc = hog.extractHogFeatures(img.data, img.width, img.height);
    let options_hog = {
        cellSize: 4,
        blockSize: 2,
        blockStride: 1,
        bins: 6,
        norm: "L2"
    };
    var desc = hog2.extractHOG(img, options_hog);
    kc = kernel.compute(descriptor).addColumn(0, range(1, descriptor.length + 1))
    let p = svm.predictOne(desc);

    if (!_labels){
        return { label: p };
    }

    return { label: _labels[p] };
}

/**
 * Test the saved svm model
 * @param {object} _model - Model to test load
 * @param {string} _prefix - Prefix for test/training data
 * @return {Object} Test results
 */
async function testModel(_model, _prefix, _original) {      

    var svm = null;
    // load the saved model
    if (!_model){
        svm = loadModelFromFile();
    }
    else{
        svm = SVM.load(_model);
    }

    // load test files
    var imageDir = path.join(__dirname, '../ml', `${_prefix}_test_images`);
    var mlTestData = await getMlData(imageDir);

    var kData = kernel.compute(mlTestData.data, _original).addColumn(0, range(1, mlTestData.data.length + 1));  

    var predictions = [];
    let results = svm.predict(kData);
    var correct = 0;

    for (let i = 0; i < results.length; i++) {
        predictions.push({ file: mlTestData.files[i], preidcted: results[i], actual: mlTestData.labels[i] }); 
        logger.log('info', mlTestData.files[i], 'actual =', mlTestData.labels[i], 'predicted =', results[i]);
        correct += mlTestData.labels[i] == results[i] ? 1 : 0;
    }

    var acc = (correct / predictions.length) * 100;

    return { accuracy: acc, predictions: predictions };
}

/**
 * Trains the svm model
 * @param {Array} _features - Training data
 * @param {Array} _labels - Training data labels
 * @param {string} _prefix - The train/test data prefix
 * @param {Array} _originalFeatures - Original training features 
 * @see https://github.com/mljs/libsvm
 */
async function trainModel(_features, _labels, _prefix, _originalFeatures) { 

    const math = require('mathjs');
    let variance = math.variance(_features);
    let gamma = 1 / (_features[0].length * variance);

    const svm = createModel(gamma);

    logger.log('info', "Training model");

    svm.train(_features, _labels);  // train the model

    var model = svm.serializeModel();
    var outPath = path.join(__dirname, '../ml', 'svm.model');
    fs.writeFileSync(outPath, model, { encoding: 'utf8'});

    return await testModel(model, _prefix, _original);
}

/**
 * Instantiates the SVM model
 * @return {Object} SVM model
 */
function createModel(gamma){
    let options = {
        type: SVM.SVM_TYPES.NU_SVC, 
        kernel : SVM.KERNEL_TYPES.PRECOMPUTED,
        degree : 3,
        nu : 0.1,
        shrinking : false
    };

    // let options = {
    //     kernel: SVM.KERNEL_TYPES.RBF, // The type of kernel I want to use
    //     type: SVM.SVM_TYPES.C_SVC,    // The type of SVM I want to run
    //     gamma: gamma,                     // RBF kernel gamma parameter
    //     cost: 2.67  
    // }

    const svm = new SVM(options);
    return svm;
}

/**
 * Loops the given directory, loads the images and extracts the features of each
 * @param {Array} _features - Training data
 * @return {Object} Data and labels
 */
async function getMlData(_imageDirectory){
   
    var labels = fs.readdirSync(_imageDirectory);   
    var fileNames = []; 
    var xData = [];
    var yData = [];

    for (let i = 0; i < labels.length; i++) {

        var labelDirectory = _imageDirectory + '\\' + labels[i];
        var files = fs.readdirSync(labelDirectory);

        for (let j = 0; j < files.length; j++) {
            logger.log('info', 'Loading ', files[j]);        
            var loadHog = await loadImageAndGetHog(labelDirectory + '\\' + files[j]);
            if (loadHog.success){
                fileNames.push(files[j]);

                //var ker = new Kernel('polynomial', {degree: 3, scale: 1 / loadHog.payload.length});
                //var kTrain = ker.compute(loadHog.payload).addColumn(0, range(1, loadHog.payload.length + 1));

                xData.push(loadHog.payload);
                yData.push(labels[i]);
            }
            
        }        
    }   

    return { data: xData, labels: yData, files: fileNames };
}

/**
 * Loads the image and gets the hog features
 * @param {string} _imagePath - Path to file
 * @return {Array} HOG features
 */
async function loadImageAndGetHog(_imagePath){
    try{
        var img = await Image.load(_imagePath);
        img = await img.scale({width: IMG_SCALE_WIDTH, height: IMG_SCALE_HEIGHT});
        var desc = hog.extractHogFeatures(img.data, img.width, img.height);

        return { success : true, payload : desc };
    }
    catch(err){
        logger.log('error', `ERROR loading ${_imagePath} : ${err}`)
        return { success : false, error : err };
    }    
}

/**
 * Loads the saved model from file
 * @return {Object} - SVM model
 */
function loadModelFromFile() {   
    var modelPath = path.join(__dirname, '../ml', 'svm.model');
    var trainedModel = fs.readFileSync(modelPath);
    const svm = SVM.load(trainedModel.toString());
    return svm;
}

//TODO:: Training the model on startup as I need access to the 'landmark', not sure if this is correct tho.
//await trainSVM();

module.exports.trainSVM = trainSVM;
module.exports.parseTrainingFiles = parseTrainingFiles;
module.exports.predict = predict;
module.exports.testModel = testModel;
module.exports.processImage = processImage;
