// In this component, I am trying to render the RTSP stream, then read it and duplicate it on a second canvas (after drawing)
import { useRef, useEffect  } from 'react';
import { loadPlayer } from 'rtsp-relay/browser';
import '../App.css'
import * as tempmot from '../services/tmp_motion';
import { Context } from 'vm';
import { decode } from 'fast-png';
interface Props {
  cameraName: string;
  cameraId: string;
  //camera : Camera;
}

// export interface Camera {
//   name :string;
//   url :string;
// }

//https://vivaxyblog.github.io/2019/11/07/decode-a-png-image-with-javascript.html
//https://github.com/phoboslab/jsmpeg
  //https://github.com/k-yle/rtsp-relay/issues/97

  

function CameraViewer ({ cameraName, cameraId } : Props) {
  const requestRef = useRef<number>(0);
  const canvas = useRef<HTMLCanvasElement>(null);
  const canvasCopy = useRef<HTMLCanvasElement>(null);
  

  
  const animate2 = (ctx : Context, canvas: HTMLCanvasElement) => {

    // getting the context of the original does not work
    console.log()

    const d = new Date();
    const sec = d.getSeconds();

    const width = 1358;
    const height = 764;



    if (sec % 10 == 0 ){
      // try to get image from dataUrl, works on the second canvas, but not on the streaming one.
      const du = canvas.toDataURL();
      // console.log('canvas id = ', canvas.id);
      console.log('data = ', du);

      let max = 0;

      const pixels = ctx.getImageData(0, 0, width, height);
  
      for(let y = 0; y < height; y++){
        for(let x = 0; x < width; x++){
            const i = (y * 4) * width + x * 4;
            const avg = (pixels.data[i] + pixels.data[i + 1] + pixels.data[i + 2]) / 3;
            max = Math.max(max, pixels.data[i], pixels.data[i + 1], pixels.data[i + 2]);
  
            //console.log('ave', avg);        
        }
    }
  
    console.log('max', max);
    }
  }

  const animate3 = (ctx : Context, canvas: HTMLCanvasElement) => {

    // Get the pixels from the dataUrl
    console.log()

    const d = new Date();
    const sec = d.getSeconds();

    const width = 1358;
    const height = 764;

    if (sec % 10 == 0 ){
      console.log('animate3 interval');
      // try to get image from dataUrl, works on the second canvas, but not on the streaming one.
      const du = canvas.toDataURL();
      console.log('canvas id = ', canvas.id);
      console.log('data = ', du);
      // var picData = atob(du) 
      // const pixels = decode(picData);
      // var canvas = document.createElement('canvas');
      // canvas.width = image.width;
      // canvas.height = image.height;
      let max = 0;
      const image = new Image();
      image.src = du;
      const context = canvas.getContext('2d');
      context?.drawImage(image, 0, 0);
      const imageData = context?.getImageData(0, 0, canvas.width, canvas.height);

      for(let y = 0; y < height; y++){
        for(let x = 0; x < width; x++){
            const i = (y * 4) * width + x * 4;
            max = Math.max(max, imageData!.data[i], imageData!.data[i + 1], imageData!.data[i + 2]);

         
        }
    }

  
      // var imageData = context.getImageData(0, 0, canvas.width, canvas.height);

      // let jpegData = atob(du);
      // let pixels = decodeJPEG(jpegData);
      console.log("max = ", max);
    }

    
  }
 
  //const jpegasm = require('jpeg-asm');

  // Animate to capture frames from canvas, possibly temp
  const animate = (ctx : Context, canvas: HTMLCanvasElement) => {
    //tempmot.checkMotion(ctx);
    requestRef.current = requestAnimationFrame(() => animate(ctx, canvas));
    
    const d = new Date();
    const sec = d.getSeconds();

   

 
    // run every 10 seconds
    if (sec % 10 == 0){
      
      // try to create images from blob, does not work as the blob does not seem to have the image

      
     

      

      // ctx.fillStyle = '#000000'
      // ctx.beginPath()
      // ctx.arc(sec * 2, 100, 20, 0, 2*Math.PI)
      // ctx.fill()

      ctx.fillStyle = '#000000'
      ctx.beginPath()
      ctx.arc(sec * 2, 100, 20, 0, 2*Math.PI)
      ctx.fill()


      canvas?.toBlob(function(blob){
        //console.log(blob[0]);
        // for (let i = 0; i < blob.Blob.length; i++) {
        //   console.log(blob.Blob[i]);
        // }

        // We are NOT getting the blob from the canvas
       
        
        const width = 1358;
        const height = 764;
        let max : number;
        max = 0;
        
        const imageData = ctx.getImageData(0, 0, width, width);
          blob?.arrayBuffer().then((buff) => {
            const pixels = decode(buff);
            console.log("pixels", pixels);
  
            // try grayscale
           
            //var imgPixels = cnx.getImageData(0, 0, width, height);
  
            for(let y = 0; y < height; y++){
                for(let x = 0; x < width; x++){
                    const i = (y * 4) * width + x * 4;
                    const avg = (pixels.data[i] + pixels.data[i + 1] + pixels.data[i + 2]) / 3;
                    max = Math.max(max, pixels.data[i], pixels.data[i + 1], pixels.data[i + 2]);

                    //console.log('ave', avg);
                    imageData.data[i] = avg;
                    imageData.data[i + 1] = avg;
                    imageData.data[i + 2] = avg;
                }
            }
  
            //console.log('imageData', imageData);
            ctx.putImageData(imageData,0,0);

            //const imageData2 = ctx.getImageData(0, 0, width, width);

             
          });

          console.log('MAX = ', max);
          
          
          //https://github.com/image-js/fast-png
  
        })

      // if
    }
   
  }
  
  useEffect(() => {
    if (!canvas.current) throw new Error('Ref is null');

    console.log("canvas", canvas.current?.id)
    

    if (canvas.current?.id == "original"){
      loadPlayer({
        url: `ws://localhost:3002/api/cameras/${cameraId}/stream`,
        canvas: canvas.current,
        preserveDrawingBuffer: true,
        onVideoDecode : () => {
          //console.log('decode');
          //console.log("canvas.current", canvas.current);

          // canvas.current?.toBlob(function(blob){
          //   //console.log(blob[0]);
          //   // for (let i = 0; i < blob.Blob.length; i++) {
          //   //   console.log(blob.Blob[i]);
          //   // }
          //   if (!canvas.current) throw new Error('Ref is null');

           
           
          //   const width = 1358;
          //   const height = 764;
            
          //   const imageData = context.getImageData(0, 0, width, width);
          //     blob?.arrayBuffer().then((buff) => {
          //       const pixels = decode(buff);
          //       console.log("pixels", pixels);
      
          //       // try grayscale
               
          //       //var imgPixels = cnx.getImageData(0, 0, width, height);
      
          //       for(let y = 0; y < height; y++){
          //           for(let x = 0; x < width; x++){
          //               const i = (y * 4) * width + x * 4;
          //               const avg = (pixels.data[i] + pixels.data[i + 1] + pixels.data[i + 2]) / 3;
          //               imageData.data[i] = avg;
          //               imageData.data[i + 1] = avg;
          //               imageData.data[i + 2] = avg;
          //           }
          //       }
      
          //       context.putImageData(imageData,0,0);
          //     });
              
              
          //     //https://github.com/image-js/fast-png
      
          //   }
            //)

        }
      });

   
    }

   

  

    //const ctx = canvas.current.getContext('2d');
    //canvas.current.getImageData(0, 0, width, width);

    // var img = new Image();
    // img.src = strDataURI;

//     let jpegData = atob(dataUrl) 
// var pixels = decodeJPEG(jpegData)
// var color = pixels.slice((y * width + x) *4, 4)



    /*
      var width = input.width;
            var height = input.height;
            var imgPixels = cnx.getImageData(0, 0, width, height);

            for(var y = 0; y < height; y++){
                for(var x = 0; x < width; x++){
                    var i = (y * 4) * width + x * 4;
                    var avg = (imgPixels.data[i] + imgPixels.data[i + 1] + imgPixels.data[i + 2]) / 3;
                    imgPixels.data[i] = avg;
                    imgPixels.data[i + 1] = avg;
                    imgPixels.data[i + 2] = avg;
                }
            }
    */

    //https://stackoverflow.com/questions/44590999/extract-a-pixel-color-from-a-data-url-uri-image
    // const dataUrl = canvas.current.toDataURL().slice(22);
    // console.log('dataUrl', dataUrl);
    // const jpegData = atob(dataUrl);
    //const pixels = decode(jpegData)

    // https://github.com/phoboslab/jsmpeg/pull/106
    //const ctx = canvas.current.getContext('2d');

    // Animate to capture frames from canvas, possibly temp
    if (canvas.current){
      const ctx = canvasCopy.current?.getContext('2d') as CanvasRenderingContext2D;
      //const ctx2 = canvas.current?.getContext('2d') as CanvasRenderingContext2D;

      //animate2(ctx2, canvas.current);

      ctx.fillStyle = '#000000'
      ctx.beginPath()
      ctx.arc(50, 100, 20, 0, 2*Math.PI)
      ctx.fill()

      requestRef.current = requestAnimationFrame(() => animate3(ctx, canvas.current!)); 
      return () => cancelAnimationFrame(requestRef.current);     
    }

   
  }, [animate3]);

  return (
    <>
    <div className='camera-wrapper'>
      <canvas id='original' className='camera-canvas' ref={canvas} />
      <canvas id='copy' className='camera-canvas'  width='1358' height='764' ref={canvasCopy} />
      <div className='controls'>
        <button className='btn btn-primary' onClick={() => console.log('click')}>TEST</button>
      </div>
    </div>
    </>
  )
}

export default CameraViewer;

function decodeJPEG(jpegData: string) {
  throw new Error('Function not implemented.');
}
