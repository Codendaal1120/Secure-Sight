const chai = require('chai');
const path = require('path');
const vaService = require("../app/services/videoAnalysisService");
const fs = require("fs");

const { createCanvas, loadImage } = require('canvas');

let run = false;

process.env.NODE_ENV = 'unit_test'  
if (process.env.MODE == 'single'){
    run = true;
}

describe('Test Video processing', () => {
    
    //Test creating event gif
    it('Test creating event gif', async () => {

        try{

            var testFile = 'test/files/unit_test1.gif';

            if (fs.existsSync(testFile)){
                fs.unlinkSync(testFile);
            }

            const predictions = [
                {
                    detectedOn : new Date("2023-08-21 10:00:00"),
                    x: 100, 
                    y: 300,
                    width : 100,
                    height : 200,
                    c : 'red'
                },
                {
                    detectedOn : new Date("2023-08-21 10:00:05"),
                    x: 110, 
                    y: 320,
                    width : 100,
                    height : 200,
                    c : 'green'
                },
                {
                    detectedOn : new Date("2023-08-21 10:00:20"),
                    x: 110, 
                    y: 320,
                    width : 100,
                    height : 200,
                    c : 'blue'
                }
            ]
            vaService.createEventGif(predictions, "x-test-cam", 30 * 1000, testFile);

            chai.expect( fs.existsSync(testFile)).to.equal(true);
        }
        catch(err){
            console.error(err);
        }   
    }).timeout(5000);   
});

(run ? describe : describe.skip)('Experimental tests to figure out how to create the tracking overlay on the video', () => {
   
    it('Test gif encoder', async () => {
        
        //var Canvas = require('canvas');
        //https://video.stackexchange.com/questions/12105/add-an-image-overlay-in-front-of-video-using-ffmpeg
        //https://www.npmjs.com/package/canvas
        //https://www.npmjs.com/package/gifencoder
        const GIFEncoder = require('gif-encoder-2')
        var encoder = new GIFEncoder(1280, 720);
    
        const predictions = [
            {
                startTime : new Date("2023-08-21 10:00:00"),
                x: 100, 
                y: 300,
                width : 100,
                height : 200,
                c : 'red'
            },
            {
                startTime : new Date("2023-08-21 10:00:05"),
                x: 110, 
                y: 320,
                width : 100,
                height : 200,
                c : 'green'
            },
            {
                startTime : new Date("2023-08-21 10:00:15"),
                x: 200, 
                y: 320,
                width : 100,
                height : 200,
                c : 'blue'
            },
            {
                startTime : new Date("2023-08-21 10:00:17"),
                x: 250, 
                y: 350,
                width : 100,
                height : 200,
                c : 'black'
            }
        ]

        try{
            //encoder.createReadStream().pipe(fs.createWriteStream('test/files/rect-animated.gif'));

            encoder.start();
            encoder.setTransparent(true);
            encoder.setRepeat(0);   
            //encoder.setDelay(500);  
            encoder.setQuality(10); 

            var canvas = createCanvas(1280, 720);
            var ctx = canvas.getContext('2d');

            // ctx.fillStyle = '#FFFFFF';
            // ctx.fillRect(0, 0, 1280, 720);
            //encoder.addFrame(ctx);
            

          

            

            

            for (let i = 0; i < predictions.length; i++) {

            

                // var dayMs = 1000*60*60*24;
                // var t1 = predictions[i + 1].startTime.getTime();
                // var t2 = predictions[i].startTime.getTime();
                // var t3 = Math.round((t1 - t2) / (dayMs));
                // var d = (predictions[i + 1].startTime - predictions[i].startTime);

                ctx.strokeStyle = predictions[i].c;  
                var diff = i == predictions.length - 1
                    ? 5 // debug
                    : predictions[i + 1].startTime - predictions[i].startTime;
                
                encoder.setDelay(diff); 
                ctx.strokeRect(predictions[i].x, predictions[i].y, predictions[i].width, predictions[i].height);                
                encoder.addFrame(ctx);

                encoder.setDelay(0);  
                ctx.clearRect(0, 0, 1280, 720);
                encoder.addFrame(ctx);

                //encoder.setDelay(diff); 
            }

            encoder.finish();

            const buffer = encoder.out.getData()
 
            fs.writeFileSync('test/files/rect-animated.gif', buffer);
            // writeFile('test/files/rect-animated.gif', buffer, error => {
            //     // gif drawn or error
            // })
        }
        catch(err){
            console.error(err);
        }
   
    });   
});





