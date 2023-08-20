const chai = require('chai');
const path = require('path');

process.env.NODE_ENV = 'unit_test'  

describe('Test Video processor', () => {
    
    xit('Test creating animation', async () => {
        
        //var Canvas = require('canvas');
        //https://video.stackexchange.com/questions/12105/add-an-image-overlay-in-front-of-video-using-ffmpeg
        //https://www.npmjs.com/package/canvas
        //https://www.npmjs.com/package/gifencoder
        const { createCanvas, loadImage } = require('canvas')
        var GIFEncoder = require('gifencoder');
        var encoder = new GIFEncoder(320, 240);
        const fs = require("fs");

        try{
            encoder.createReadStream().pipe(fs.createWriteStream('myanimated.gif'));

            encoder.start();
            encoder.setRepeat(0);   
            encoder.setDelay(500);  
            encoder.setQuality(10); 

            var canvas = createCanvas(320, 240);
            var ctx = canvas.getContext('2d');

            // blue rectangle frame
            // red rectangle
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(0, 0, 320, 240);
            encoder.addFrame(ctx);
            
            // green rectangle
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(0, 0, 320, 240);
            encoder.addFrame(ctx);

            encoder.setDelay(5000); 
            
            // blue rectangle
            ctx.fillStyle = '#0000ff';
            ctx.fillRect(0, 0, 320, 240);
            encoder.addFrame(ctx);

            // image frame
            // var data = fs.readFileSync(__dirname + '\\image.jpg');
            // var img = new Canvas.Image; 
            // img.src = data;
            // ctx.drawImage(img, 0, 0, 320, 240);
            // encoder.addFrame(ctx);

            encoder.finish();
        }
        catch(err){
            console.error(err);
        }

   
    });   
});





