const SVM = require('libsvm-js/asm');
const hog = require("./hogModule");
const imgModule  = require("./imageModule");
const fs = require("fs");
const path = require('path');
const Kernel = require('ml-kernel');
const range = require('lodash.range');
const {default: Image} = require('image-js');
const logger = require('../modules/loggingModule').getLogger('svmDetector');
const math = require('mathjs');
const dataService = require('../services/dataService');
const collectionName = 'svm';

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

    var imageDir = path.join(__dirname, '../ml', `${prefix}`);
    var mlData = await loadMlData(imageDir, 0.8);

    if (kernel == null){
        kernel = new Kernel('polynomial', {degree: 3, scale: 1 / mlData.train.data.length});
    }
    var kData = kernel.compute(mlData.train.data).addColumn(0, range(1, mlData.train.data.length + 1));    

    var testResults = await trainModel(kData, mlData);
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

    //logger.log('debug', 'Predicting');

    img = await img.scale({width: IMG_SCALE_WIDTH, height: IMG_SCALE_HEIGHT});
    var desc = hog.extractHogFeatures(img.data, img.width, img.height);
    if (kernel == null){
        kernel = new Kernel('polynomial', {degree: 3, scale: 1 / desc.length});
    }
    kc = kernel.compute(desc).addColumn(0, range(1, desc.length + 1))
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
/**
 * Test the saved svm model
 * @param {object} _model - Model to test load
 * @param {object} _mlData - The training/test data object from the load function
 * @return {Object} Test results
 */
async function testModel(_model, _mlData) {      

    var svm = null;
    // load the saved model
    if (!_model){
        svm = loadModelFromFile();
    }
    else{
        svm = SVM.load(_model);
    }

    // load test files
    // var imageDir = path.join(__dirname, '../ml', `${_prefix}_test_images`);
    // var mlTestData = await getMlData(imageDir);

    var kData = kernel.compute(_mlData.test.data, _mlData.train.data).addColumn(0, range(1, _mlData.test.data.length + 1));  

    var predictions = [];
    let results = svm.predict(kData);
    var correct = 0;

    for (let i = 0; i < results.length; i++) {
        predictions.push({ file: _mlData.test.fileNames[i], preidcted: results[i], actual: _mlData.test.labels[i] }); 
        logger.log('info', _mlData.test.fileNames[i], 'actual =', _mlData.test.labels[i], 'predicted =', results[i]);
        correct += _mlData.test.labels[i] == results[i] ? 1 : 0;
    }

    var acc = (correct / predictions.length) * 100;

    return { accuracy: acc, predictions: predictions };
}

/**
 * Trains the svm model
 * @param {Array} _kernelData - Training data
 * @param {object} _mlData - The training/test data object from the load function
 * @see https://github.com/mljs/libsvm
 */
async function trainModel(_kernelData, _mlData) { 
   
    let variance = math.variance(_kernelData);
    let gamma = 1 / (_kernelData[0].length * variance);

    const svm = createModel(gamma);

    logger.log('info', "Training model");

    svm.train(_kernelData, _mlData.train.labels);  // train the model

    var model = svm.serializeModel();
    var outPath = path.join(__dirname, '../ml', 'svm.model');
    fs.writeFileSync(outPath, model, { encoding: 'utf8'});

    var results = await testModel(model, _mlData);
    await saveTrainingResults(results, _mlData);
    return results;
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
 * Loops the input directory, loads the images and extracts the features of each
 * This also randomly splits the data into training and validation
 * @param {Array} _features - Training data
 * @param {Array} _features - Training data
 * @return {Object} Data and labels
 */
async function loadMlData(_imageDirectory, _trainDataSize){

    if (_trainDataSize > 1){
        _trainDataSize = 1;
    }
   
    var labels = fs.readdirSync(_imageDirectory);   
    var mlData = {
        train: {
            fileNames: [],
            data: [],
            labels: [],
        },
        test: {
            fileNames: [],
            data: [],
            labels: [],
        }
    }

    for (let i = 0; i < labels.length; i++) {

        var labelDirectory = _imageDirectory + '/' + labels[i];
        var files = fs.readdirSync(labelDirectory);
        files = shuffle(files);
        var trainSize = Math.floor(files.length * _trainDataSize);

        for (let j = 0; j < files.length; j++) {
            logger.log('info', 'Loading ' + files[j]);   
            
            // apply grayscale to the original dataset images, named 0.jpg, but not to the ones from tf
            var applyGray = files[j].length <= 6;
            var loadHog = await loadImageAndGetHog(labelDirectory + '/' + files[j], applyGray);
            if (loadHog.success){

                if (j <= trainSize){
                    //var ker = new Kernel('polynomial', {degree: 3, scale: 1 / loadHog.payload.length});
                    //var kTrain = ker.compute(loadHog.payload).addColumn(0, range(1, loadHog.payload.length + 1));
                    mlData.train.fileNames.push(files[j]);
                    mlData.train.data.push(loadHog.payload);
                    mlData.train.labels.push(labels[i]);
                }
                else{
                    mlData.test.fileNames.push(files[j]);
                    mlData.test.data.push(loadHog.payload);
                    mlData.test.labels.push(labels[i]);
                }
            }            
        }        
    }   

    return mlData;
}

/** Starts the SVM retraining job */
async function startSvmTraining(){
    setInterval(async function(){
      var now = new Date();   

      if (now.getHours() < 20){
        return;
      }

      now.setHours(0);
      now.setMinutes(0);
      var lastResults = await getLastResults();
      if (lastResults != null && lastResults.executedOn > now){
       return; 
      }

      await trainSVM('persons');

    }, 60 * 60 * 1000);
}

function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}

/**
 * Loads the image and gets the hog features
 * @param {string} _imagePath - Path to file
 * @param {boolean} _grayScale - Indicate if grayscale should be applied to the image
 * @return {Array} HOG features
 */
async function loadImageAndGetHog(_imagePath, _grayScale){
    try{

        var decodedImage = imgModule.decodeImage(_imagePath);
        decodedImage = applyProcessing(decodedImage);
        _grayScale = false;
        var desc = hog.extractHogFeatures(decodedImage.imageObject);

        return { success : true, payload : desc };
    }
    catch(err){
        console.error(err.stack);
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

async function getLastResults(){
    let document = await dataService.getOneAsync(collectionName, null, null, { executedOn : 1 });    
    if (document.success){
        return document.payload;
    }
}

async function saveTrainingResults(_results, _mlData){

    _results.executedOn = new Date();
    _results.trainingFiles = _mlData.train.data.length;
    _results.testFiles = _mlData.test.data.length;

    let document = await dataService.insertOneAsync(collectionName, _results);    
    if (!document.success){
        return { success : false, error : `Could not create a training results entry : ${document.error}` };
    }

    return { success : true, payload : document.payload };
}

//https://huningxin.github.io/opencv.js/samples/video-processing/index.html
function applyProcessing(_decodedImage){

    var imgWrapper = imgModule.resizeImage(_decodedImage, IMG_SCALE_WIDTH, IMG_SCALE_HEIGHT);
    imgWrapper = imgModule.applyGrayScale(imgWrapper);
    //imgWrapper = imgModule.applyCannyEdge(imgWrapper);
    //imgWrapper = imgModule.applyAdaptiveThreshold(imgWrapper);

    // if (imgWrapper.filePath.endsWith('1/18.png')){
    //     imgModule.saveImageDataToFile(_decodedImage, 'temp/original.png');
    //     imgModule.saveImageDataToFile(imgWrapper, 'temp/processed.png');        
    // } 

    return imgWrapper;
}

module.exports.trainSVM = trainSVM;
module.exports.parseTrainingFiles = parseTrainingFiles;
module.exports.predict = predict;
module.exports.testModel = testModel;
module.exports.processImage = processImage;
module.exports.startSvmTraining = startSvmTraining;
