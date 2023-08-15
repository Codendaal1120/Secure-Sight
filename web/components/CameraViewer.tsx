import { useRef, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import {Box, Typography, Modal } from '@mui/material';
import { api } from "services/api";
//import api2 from "services/api2";
import JSMpegWritableSource from './JSMpegWritableSource.ts'
import { Socket, io } from 'socket.io-client';
import dynamic from "next/dynamic";

import { DefaultEventsMap } from '@socket.io/component-emitter';
import JSMpeg from '@seydx/jsmpeg/lib/index.js';
// import JsmpegPlayer from './JsmpegPlayer.js'

interface Props {
  cameraId: string;
  cameraName: string;
//   cameraUrl: string;
//   camera : Camera;
}

export interface Camera {
  id :string;
  name :string;
  url :string;
}

const API_URL = process.env.NEXT_PUBLIC_API;

// const JSMpeg = dynamic(
//   () => {
//     return import("@seydx/jsmpeg/lib/index.js");
//   },
//   { ssr: false }
// );


const drawStyle = {
    // width: '640px',
    // height: '360px',    
  };

  const style = {
    position: 'absolute' as 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    // bgcolor: 'background.paper',
    background : 'black',
    // border: '2px solid #000',
    boxShadow: 24,
    p: 4,
  };


function CameraViewer ({ cameraId, cameraName } : Props) {

  const streamCanvas = useRef<HTMLCanvasElement>(null);
  const drawCanvas = useRef<HTMLCanvasElement>(null); 
  //let socket: Socket<DefaultEventsMap, DefaultEventsMap> | null = null;
  const [loaded, setLoaded] = useState<boolean>();
  const [drawingCtx, setDrawingCtx] = useState<CanvasRenderingContext2D>();
 // let loaded = false;
  const [player, setPlayer] = useState<JSMpeg>();
  //const [player, setPlayer] = useState();
  const [img, setImg] = useState<string>();  
  const [open, setOpen] = useState(false);
  const [socket, setSocket] = useState<Socket<DefaultEventsMap, DefaultEventsMap>>();
  const ref = useRef(null);

  

  // const socket2 = io(process.env.NEXT_PUBLIC_API!, {  });
  // socket2.disconnect();

  // componentDidMount() {
  
  //   // Changing the state after 2 sec
  //   // from the time when the component
  //   // is rendered
  //   setTimeout(() => {
  //     this.setState({ color: 'wheat' });
  //   }, 2000);
  // }
  
  async function getCameraSnapshot(camId: string)  { 
    try{
      const response = await fetch(`${API_URL}/api/cameras/${camId}/snapshot`);
      const imageBlob = await response.blob();
      const imageObjectURL = URL.createObjectURL(imageBlob); 
      //setLoaded(true);
      return imageObjectURL;
    } catch(err){
      console.error(`Unable to load preview :${err}`)
    }  
  };

  const drawStyle = {
    width: '640px',
    height: '360px',
    position: 'absolute' as const,
    background: 'blue',
    left: '0',
    top: '0',
    zIndex: '1'
  };

  const streamStyle = {
    width: '640px',
    height: '360px',
    background: 'black',
    
    // position: 'absolute' as const,
    // left: '50%',
    // top: 0,
    // zIndex: 0
  };

  useEffect(() => {    
    const s = io(process.env.NEXT_PUBLIC_API!, {  });
    s.disconnect();    
    setSocket(s);
  }, []);

  useEffect(() => {
    getCameraSnapshot(cameraId).then((res) => setImg(res));
    setLoaded(true);
  }, []);   

  useEffect(() => {
    const ctx = drawCanvas.current?.getContext("2d");
    console.log(drawCanvas);
    if (ctx){
      console.log('setting context')
      setDrawingCtx(ctx);
    }
    
  }, [drawCanvas]);   

  useEffect(() => {
    //console.log(streamCanvas);
    if (streamCanvas?.current){
      
      console.log('init player');
     
    }
    
    //}, [camera.id, drawCanvas, ioClient]);
  }, []);

  // componentDidMount() {
  //   this.setState({ bodyHeight: this.calendarBodyRef.current.clientHeight });
  // };

  useEffect(() => {
    //console.log('streamCanvas', streamCanvas.current)
    let p = new JSMpeg.Player(null, {
      source: JSMpegWritableSource,
      canvas: streamCanvas.current,
      audio: true,
      pauseWhenHidden: false,
      videoBufferSize: 1024 * 1024,
    });

    setPlayer(p);

    const ctx = drawCanvas.current?.getContext("2d");
    if (drawCanvas.current){
      console.log('HERE')
    }
    //const ctx = null;

    //let s = io(process.env.NEXT_PUBLIC_API!, {  });
    //s.disconnect();
    socket?.on(`${cameraId}-stream`, async (data) => {
        player.source.write(data);
        //console.log('--stream1', drawingCtx);

        if (!ctx){
          return;
        }

        console.log('drawing');

        ctx.strokeStyle = "red";  
        ctx.strokeRect(50, 50, 100, 100);


        //console.log(data);
        
      });

      // socket2?.on(`${cameraId}-stream`, async (data) => {
      //   //player.source.write(data);
      //   console.log('--stream2', drawCanvas);

      //   if (!ctx){
      //     return;
      //   }

      //   console.log('drawing');

      //   ctx.strokeStyle = "red";  
      //   ctx.strokeRect(50, 50, 100, 100);


      //   //console.log(data);
        
      // });

      //setSocket(s);
    
      //socket.disconnect();    



  
  }, [socket, drawCanvas ]);

  const click = () => {
    //console.log('ref', ref.current);
    //console.log('document.activeElement', document.activeElement);
   

    if (document.activeElement != ref.current) {
      console.log('cameraId', `[${cameraId}-stream]`);
      //console.log('inside', player);
      console.log('inside1', socket);
      console.log('open1', open);
      setOpen(!open);
      console.log('open2', open);
      if (!open){
        socket?.connect();
        //console.log('inside2', socket);
        console.log('drawCanvas', drawCanvas.current);
        // socket?.on(`${cameraId}-stream`, async (data) => {
        //   player.source.write(data);
        //   console.log('--stream1', drawingCtx);
  
        //   if (!ctx){
        //     return;
        //   }
  
        //   console.log('drawing');
  
        //   ctx.strokeStyle = "red";  
        //   ctx.strokeRect(50, 50, 100, 100);
  
  
        //   //console.log(data);
          
        // });

      }

     

      // connect to socket
      // let s = io(process.env.NEXT_PUBLIC_API!, {  });
      // s.on(`${cameraId}-stream`, async (data) => {
      //   player.source.write(data);
      //   console.log('-stream');

      //   if (!ctx){
      //     return;
      //   }

      //   console.log('drawing');

      //   ctx.strokeStyle = "red";  
      //   ctx.strokeRect(50, 50, 100, 100);


      //   //console.log(data);
        
      // });
      // setSocket(s);

    }
    else{
      console.log('drawCanvas3', drawCanvas.current);
       socket?.disconnect();
    
      console.log('close', socket);
      setOpen(false);
    }
  }

  const handleClose = () => {
    console.log('close', socket);
    socket?.disconnect();
    
    console.log('close', socket);
    setOpen(false);
  }

  const renderPreview = () => {
    if (loaded) {
      return <img className='cam-preview' src={img} alt="loader" />;
    } else {
      return <div id="cover-spin" className=''/>;
    }
  }

  function mapRange (value : number, inMin : number, inMax: number, outMin: number, outMax: number) {
    value = (value - inMin) / (inMax - inMin);
    return outMin + value * (outMax - outMin);
  }

  return (

    <div className='cam-wrapper' onClick={click} style={drawStyle}>
      {renderPreview()}
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <div className='stream-wrapper'  ref={ref}>
          <canvas ref={streamCanvas} style={streamStyle} /> 
          <canvas ref={drawCanvas} style={drawStyle} /> 
        </div>
      </Modal>
    </div>      
  )
}

export default CameraViewer;

function componentDidMount() {
  throw new Error('Function not implemented.');
}
