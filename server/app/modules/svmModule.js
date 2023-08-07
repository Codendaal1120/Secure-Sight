const SVM = require('libsvm-js/asm');
const hog = require("./hogDetector");
const fs = require("fs");
const path = require('path');
const Kernel = require('ml-kernel');
const range = require('lodash.range');
const {default: Image} = require('image-js');

/**
 * Loads the files in the specified directory, extracts the HOG features and trains the SVM model
 * Training data from https://www.kaggle.com/datasets/saravananchandran/pedestrian-detection-data-set?resource=download
 */
async function trainSVM() {   
    // The training directory of training images, each class should be stored in a sub folder with the class name, for example ./input/cat, ./input/dog
    var imageDir = path.join(__dirname, '../ml', 'input');
    var mlData = await getMlData(imageDir);
    var testResults = await trainModel(mlData.data, mlData.labels);
}

/**
 * The dataset downloaded from https://www.kaggle.com/datasets/saravananchandran/pedestrian-detection-data-set?resource=download
 * stores the label in the annotation xml, we need to parse it and move the files accordingly
 */
async function parseTrainingFiles()
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
 * Predicts the image class using the pre trained model
 * @param {Array} _imageData - Imagedata
 * @param {Number} _imageHeight - Image height
 * @param {Number} _imageWidth - Image width
 * @return {Object} Prediction results
 */
async function predict(_imageData, _imageWidth, _imageHeight){
    var img = new Image(_imageWidth, _imageHeight, _imageData);
    console.log('Predicting');

    let svm = loadModelFromFile();

    img = await img.scale({width:100, height:100});
    var desc = hog.extractHogFeatures(img.data, img.width, img.height);
    let p = svm.predictOne(desc);

    return { label: p == 1 ? 'human' : 'non_human' };
}

/**
 * Loads the image and gets the hog features
 * @param {string} _imagePath - Path to file
 * @return {Array} HOG features
 */
async function loadImageAndGetHog(_imagePath){
    try{
        var img = await Image.load(_imagePath);
        img = await img.scale({width:100, height:100});
        var desc = hog.extractHogFeatures(img.data, img.width, img.height);
        return { success : true, payload : desc };
    }
    catch(err){
        console.error(`ERROR loading ${_imagePath} : ${err}`)
        return { success : false, error : err };
    }    
}

/**
 * Test the saved svm model
 * @return {Object} Test results
 */
async function testModel(model) {      

    // load the saved model
    if (!model){
        model = loadModelFromFile();
    }

    // load test files
    var imageDir = path.join(__dirname, '../ml', 'test_images');
    var mlData = await getMlData(imageDir);
    var predictions = [];

    for (let i = 0; i < mlData.data.length; i++) {

        let p = model.predictOne(mlData.data[i]);
        predictions.push({ file:mlData.files[i], preidcted:p, actual:mlData.labels[i] }); 
        console.log(mlData.files[i], 'predicted =', p, 'actual =', mlData.labels[i])       ;
    }

    return predictions;
}

/**
 * Trains the svm model
 * @param {Array} _features - Training data
 * @param {Array} _labels - Training data labels
 * @see https://github.com/mljs/libsvm
 */
async function trainModel(_features, _labels) { 
    const svm = createModel();

    console.log("Training model");

    svm.train(_features, _labels);  // train the model

    var model = svm.serializeModel();
    var outPath = path.join(__dirname, '../ml', 'svm.model');
    fs.writeFileSync(outPath, model, { encoding: 'utf8'});

    await testModel(model);
}

/**
 * Instantiates the SVM model
 * @return {Object} SVM model
 */
function createModel(){
    let options = {
        type: SVM.SVM_TYPES.NU_SVC, 
        kernel : SVM.KERNEL_TYPES.PRECOMPUTED,
        degree : 3,
        nu : 0.1,
        shrinking : false
    };

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
            console.log('Loading ', files[j]);        
            var loadHog = await loadImageAndGetHog(labelDirectory + '\\' + files[j]);
            if (loadHog.success){
                fileNames.push(files[j]);
                xData.push(loadHog.payload);
                yData.push(labels[i] == "human" ? 1 : 0);
            }
            
        }        
    }

    var ker = new Kernel('polynomial', {degree: 3, scale: 1 / xData.length});
    var kTrain = ker.compute(xData).addColumn(0, range(1, xData.length + 1));

    return { data: kTrain, labels: yData, files: fileNames };
}

/**
 * Loads the saved model from file
 * @return {Object} - SVM model
 */
loadModelFromFile = function() {   
    var modelPath = path.join(__dirname, '../ml', 'svm.model');
    var trainedModel = fs.readFileSync(modelPath);
    const svm = SVM.load(trainedModel.toString());
    return svm;
}

module.exports.trainSVM = trainSVM;
module.exports.parseTrainingFiles = parseTrainingFiles;
module.exports.predict = predict;
module.exports.testModel = testModel;
