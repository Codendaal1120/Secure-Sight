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
 */
const trainSVM = async function() {   

    // The training directory of training images, each class should be stored in a sub folder with the class name, for example ./train/cat, ./train/dog

    // var issuePath = "E:\\Development\\BSC\\Sem7\\CM3070-Final Project\\.SecureSight\\server\\test\\files\\ml\\input\\human\\150.jpg"

    // //hogTEMP.TEMP_hogLib(issuePath);
    // //return;

    // var img = imgModule.getImageDataFromFile(issuePath);
    // var data = hog.extractHogFeatures(img.data, img.width, img.height);
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
                trainingLabels.push(labels[i]);
            }
            
        }        
    }

    var ker = new Kernel('polynomial', {degree: 3, scale: 1 / trainingData.length});
    var kTrain = ker.compute(trainingData).addColumn(0, range(1, trainingData.length + 1));

    await trainModel(kTrain, trainingLabels);


/*
 let models = JSON.parse(fs.readFileSync('E:\\Development\\BSC\\Final\\POC-repo\\JS-POC\\libsvm-poc\\data\\export-predicted-images.json'));
   


 
    console.log('............ predicting....')
    for (let i = 0; i < models.length; i++) {
        let p = svm.predictOne(models[i]);
        console.log(i + " = " + p)
    }
*/

    // classes.forEach(async label => {
        
    //     files.forEach(async file => {
    //         console.log(file);
    //     });
    //     //path.join(__dirname, 'files', 'ml', 'input');
        
        
    // });
    
    

    // for (let index = 0; index < array.length; index++) {
    //     const element = array[index];
        
    // }

    // const data = await fs.readFile('monolitic.txt');

 



    // console.log('traning....')
    // 
   

    // let models = JSON.parse(fs.readFileSync('E:\\Development\\BSC\\Final\\POC-repo\\JS-POC\\libsvm-poc\\data\\export-predicted-images.json'));
   


 
    // console.log('............ predicting....')
    // for (let i = 0; i < models.length; i++) {
    //     let p = svm.predictOne(models[i]);
    //     console.log(i + " = " + p)
    // }
   
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

    // let variance = math.variance(_features);
    // //1 / (n_features * X.var()) as value of gamma
    // let gamma = 1 / (_features[0].length * variance);

    let options = {
        type: SVM.SVM_TYPES.NU_SVC, 
        kernel : SVM.KERNEL_TYPES.PRECOMPUTED,
        degree : 3,
        nu : 0.1,
        shrinking : false
    };

    const svm = new SVM(options);

    // const svm = new SVM({
    //     kernel: SVM.KERNEL_TYPES.RBF, // The type of kernel I want to use
    //     type: SVM.SVM_TYPES.C_SVC,    // The type of SVM I want to run
    //     gamma: gamma,                 // RBF kernel gamma parameter
    //     cost: 2.67                    // C_SVC cost parameter
    // }); 

    svm.train(_features, _labels);  // train the model

    var model = svm.serializeModel();
    fs.writeFileSync('svm', model);

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

    // let fc = fs.readFileSync('E:\\Development\\BSC\\Sem7\\CM3070-Final Project\\POC-repo\\JS-POC\\libsvm-poc\\data\\export-predicted-images.json');
    // let models = JSON.parse(fc);
    // console.log('............ predicting....')
    // for (let i = 0; i < models.length; i++) {
    //     let p = svm.predictOne(models[i]);
    //     console.log(i + " = " + p)
    // }

    /*
    
   


 
 
*/

}

/**
 * Trains the svm model
 * @param {Array} _features - Training data
 * @param {Array} _labels - Training data labels
 * @see https://github.com/mljs/libsvm
 */
testModel = async function(_features, _labels) {   

    // let variance = math.variance(_features);
    // //1 / (n_features * X.var()) as value of gamma
    // let gamma = 1 / (_features[0].length * variance);

    let options = {
        type: SVM.SVM_TYPES.NU_SVC, 
        kernel : SVM.KERNEL_TYPES.PRECOMPUTED,
        degree : 3,
        nu : 0.1,
        shrinking : false
    };

    const svm = new SVM(options);

    // const svm = new SVM({
    //     kernel: SVM.KERNEL_TYPES.RBF, // The type of kernel I want to use
    //     type: SVM.SVM_TYPES.C_SVC,    // The type of SVM I want to run
    //     gamma: gamma,                 // RBF kernel gamma parameter
    //     cost: 2.67                    // C_SVC cost parameter
    // }); 

    svm.train(_features, _labels);  // train the model

    var model = svm.serializeModel();
    fs.writeFileSync('svm', model);

    // test

    var testImages = await readdir("E:\\Development\\BSC\\Sem7\\CM3070-Final Project\\.SecureSight\\server\\test\\files\\ml\\test_images");

    for (let i = 0; i < testImages.length; i++) {

        //var img = imgModule.getImageDataFromFile("E:\\Development\\BSC\\Sem7\\CM3070-Final Project\\.SecureSight\\server\\test\\files\\ml\\test_images\\" + testImages[i]);
        var data = await loadImageAndGetHog("E:\\Development\\BSC\\Sem7\\CM3070-Final Project\\.SecureSight\\server\\test\\files\\ml\\test_images\\" + testImages[i]);
        //var data = hog.extractHogFeatures(img.data, img.width, img.height);

        let p = svm.predictOne(data);
        console.log(testImages[i] + " = " + p);
    }

    // let fc = fs.readFileSync('E:\\Development\\BSC\\Sem7\\CM3070-Final Project\\POC-repo\\JS-POC\\libsvm-poc\\data\\export-predicted-images.json');
    // let models = JSON.parse(fc);
    // console.log('............ predicting....')
    // for (let i = 0; i < models.length; i++) {
    //     let p = svm.predictOne(models[i]);
    //     console.log(i + " = " + p)
    // }

    /*
    
   


 
 
*/

}



module.exports.trainSVM = trainSVM;