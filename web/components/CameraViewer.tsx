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

  //let socket: Socket<DefaultEventsMap, DefaultEventsMap> | null = null;
  const [loaded, setLoaded] = useState<boolean>();
  const [player, setPlayer] = useState<JSMpeg>();
  //const [player, setPlayer] = useState();
  const [img, setImg] = useState<string>();  
  const [open, setOpen] = useState(false);
  const [socket, setSocket] = useState<Socket<DefaultEventsMap, DefaultEventsMap>>();
  const ref = useRef(null);
  const streamCanvas = useRef<HTMLCanvasElement>(null);
  let jsmpegPlayer = null;

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
      setLoaded(true);
      return imageObjectURL;
    } catch(err){
      console.error(`Unable to load preview :${err}`)
    }  
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
    getCameraSnapshot(cameraId).then((res) => setImg(res));
  }, []);   

  useEffect(() => {
    //console.log(streamCanvas);
    if (streamCanvas?.current){
      
      console.log('init player');
     
    }
    
    //}, [camera.id, drawCanvas, ioClient]);
  }, []);

  useEffect(() => {
    let p = new JSMpeg.Player(null, {
      source: JSMpegWritableSource,
      canvas: streamCanvas.current,
      audio: true,
      pauseWhenHidden: false,
      videoBufferSize: 1024 * 1024,
    });

    setPlayer(p);



  
  }, []);

  const click = () => {
    if (document.activeElement != ref.current) {
      console.log('cameraId', `[${cameraId}-stream]`);
      console.log('inside', player);
      setOpen(!open);
      // connect to socket
      let s = io(process.env.NEXT_PUBLIC_API!, {  });
      s.on(`${cameraId}-stream`, async (data) => {
        player.source.write(data);
        console.log('stream');

        //console.log(data);
        
      });
      setSocket(s);

    }
    else{
      setOpen(false);
    }
  }

  const handleClose = () => {
    //socket?.disconnect();
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
        </div>
      </Modal>
    </div>      
  )
}

export default CameraViewer;