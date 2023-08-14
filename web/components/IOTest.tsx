import { useRef, useEffect } from 'react';
import JSMpegWritableSource from './JSMpegWritableSource.js'
import { io } from 'socket.io-client';
//import JSMpeg from './JSMpeg.js'


interface Props {
  cameraName: string;
  cameraId: string;
//   camera : Camera;
}

export interface Camera {
  id :string;
  name :string;
  url :string;
}

function IOTest ({ cameraId, cameraName } : Props) {
  // TODO: get address from config
  const ioClient = io('http://localhost:3002', {  });   
  const streamCanvas = useRef<HTMLCanvasElement>(null);
  const drawCanvas = useRef<HTMLCanvasElement>(null);

  const streamStyle = {
    width: '640px',
    height: '360px',
    position: 'absolute' as const,
    background: 'black',
    left: 0,
    top: 0,
    zIndex: 0
  };

  const drawStyle = {
    width: '640px',
    height: '360px',
    position: 'absolute' as const,
    left: '0',
    top: '0',
    zIndex: '1'
  };

  
 
  useEffect(() => {

    // var aScript = document.createElement('script');
    // aScript.type = 'text/javascript';
    // aScript.src = "./JSMpeg.js";

    // document.head.appendChild(aScript);
    // aScript.onload = () => {
    // };

    //https://stackoverflow.com/questions/61182258/jsmpeg-play-video-in-alongside-canvas

    ioClient.on(`${cameraId}-stream`, async (data) => {
        //console.log('stream');
        
      
    });    

    const ctx = drawCanvas.current?.getContext("2d");

    ioClient.on(`${cameraId}-detect`, async (data) => {
           
      if (!ctx){
        return;
      }
      //console.log(data);

      

    });  

  }, [cameraId, drawCanvas, ioClient]);



  return (
    <div>
      <canvas ref={drawCanvas} style={drawStyle}/>
      <canvas ref={streamCanvas} style={streamStyle} />    
    </div>    
  )
}


export default IOTest;