// import { useRef, useEffect } from 'react';
// import JSMpegWritableSource from './JSMpegWritableSource.ts'
// import { io } from 'socket.io-client';
// import JSMpeg from '@seydx/jsmpeg/lib/index.js';
// //import JSMpeg from './JSMpeg.js'


// var JSMpegLoad = () => {
//     var aScript = document.createElement('script');
//     aScript.type = 'text/javascript';
//     aScript.src = "./JSMpeg.js";

//     document.head.appendChild(aScript);
//     aScript.onload = () => {
//     };
// };

// interface Props {
//   cameraName: string;
//   cameraId: string;
// //   camera : Camera;
// }

// export interface Camera {
//   id :string;
//   name :string;
//   url :string;
// }

// function CameraViewerAlt ({ cameraId, cameraName } : Props) {
//   // TODO: get address from config
//   const ioClient = io('http://192.168.86.9:3002', {  });   
//   const streamCanvas = useRef<HTMLCanvasElement>(null);
//   const drawCanvas = useRef<HTMLCanvasElement>(null);

//   console.log('xxxx');

//   const streamStyle = {
//     width: '640px',
//     height: '360px',
//     position: 'absolute' as const,
//     background: 'black',
//     left: 0,
//     top: 0,
//     zIndex: 0
//   };

//   const drawStyle = {
//     width: '640px',
//     height: '360px',
//     position: 'absolute' as const,
//     left: '0',
//     top: '0',
//     zIndex: '1'
//   };

  
 
//   useEffect(() => {
    
//     // var aScript = document.createElement('script');
//     // aScript.type = 'text/javascript';
//     // aScript.src = "./JSMpeg.js";

//     // document.head.appendChild(aScript);
//     // aScript.onload = () => {
//     // };

//     const player = new JSMpeg.Player(null, {
//         source: JSMpegWritableSource,
//         canvas: streamCanvas.current,
//         audio: true,
//         pauseWhenHidden: false,
//         videoBufferSize: 1024 * 1024
//       });
   

//     //https://stackoverflow.com/questions/61182258/jsmpeg-play-video-in-alongside-canvas

//     ioClient.on(`${cameraId}-stream`, async (data) => {
//         //console.log('stream');
//         player.source.write(data); 
      
//     });    

//     const ctx = drawCanvas.current?.getContext("2d");

//     ioClient.on(`${cameraId}-detect`, async (data) => {
           
//       if (!ctx){
//         return;
//       }
//       //console.log(data);

//       ctx.strokeStyle = "red";  
//       const canvasWidth = drawCanvas.current?.width || 0;
//       const canvasHeight = drawCanvas.current?.height || 0;

//       if (data.length > 0){
//           ctx.clearRect(0, 0, canvasWidth, canvasHeight);
//       }

//       requestAnimationFrame(function () {
//         for (let i = 0; i < data.length; i++) {

//           // const x = mapRange(data[i].element.bbox[0], 0, data[i].imageWidth, 0, canvasWidth)
//           // const y = mapRange(data[i].element.bbox[1], 0, data[i].imageHeight, 0, canvasHeight)
//           // const w = mapRange(data[i].element.bbox[2], 0, data[i].imageWidth, 0, canvasWidth)
//           // const h = mapRange(data[i].element.bbox[3], 0, data[i].imageHeight, 0, canvasHeight)

//           ctx.font = "20px Arial";
//           ctx.fillText(data[i].aveDiff, 5, 15);

//           const x = mapRange(data[i].x, 0, data[i].imageWidth, 0, canvasWidth);
//           const y = mapRange(data[i].y, 0, data[i].imageHeight, 0, canvasHeight);
//           const w = mapRange(data[i].width, 0, data[i].imageWidth, 0, canvasWidth);
//           const h = mapRange(data[i].height, 0, data[i].imageHeight, 0, canvasHeight);

//           console.log(x, y, w, h, data[i]);
//           ctx.strokeRect(x, y, w, h);

        

//         }
//       });
      
      

//     });  

//   }, [cameraId, drawCanvas, ioClient]);



//   return (
//     <div>
//       <canvas ref={drawCanvas} style={drawStyle}/>
//       <canvas ref={streamCanvas} style={streamStyle} />    
//     </div>    
//   )
// }

// function mapRange (value : number, inMin : number, inMax: number, outMin: number, outMax: number) {
//   value = (value - inMin) / (inMax - inMin);
//   return outMin + value * (outMax - outMin);
// }

// export default CameraViewerAlt;