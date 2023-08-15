import { useRef, useEffect, useState } from 'react';
import classNames from "classnames";
import JSMpegWritableSource from './JSMpegWritableSource.ts'
import JSMpeg from '@seydx/jsmpeg/lib/index.js';
import { Socket, io } from 'socket.io-client';
import { DefaultEventsMap } from '@socket.io/component-emitter';


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

function CameraViewerAlt ({ cameraId, cameraName } : Props) {
  // TODO: get address from config
  //const ioClient = io('http://localhost:3002', {  });   
  const streamCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [isHover, setIsHover] = useState(false);
  const [preview, setPreview] = useState<string>();
  const [socket, setSocket] = useState<Socket<DefaultEventsMap, DefaultEventsMap>>();
 // const [player, setPlayer] = useState<JSMpeg>();
 

  useEffect(() => {
    // Create player
    // let p = new JSMpeg.Player(null, {
    //   source: JSMpegWritableSource,
    //   canvas: streamCanvasRef.current,
    //   audio: true,
    //   pauseWhenHidden: false,
    //   videoBufferSize: 1024 * 1024,
    // });
    // setPlayer(p);
  }, []);

  useEffect(() => {
    //console.log('drawCanvas', drawCanvasRef);
    getCameraSnapshot(cameraId).then((res) => setPreview(res));
  }, []);

  useEffect(() => {
    if (!socket){
      startStream();
    }

    if (open){
      //console.log('connecting to ', socket?.id);
      socket?.connect();
    }
    else{
      //console.log('Disconnecting socket', sock.id);
      socket?.disconnect();
    }
  }, [open]);


  async function getCameraSnapshot(_camId: string)  { 
    try{
      const response = await fetch(`${process.env.NEXT_PUBLIC_API}/api/cameras/${_camId}/snapshot`);
      const imageBlob = await response.blob();
      const imageObjectURL = URL.createObjectURL(imageBlob); 
      return imageObjectURL;
    } catch(err){
      console.error(`Unable to load preview :${err}`)
    }  
  };

  const renderPreview = () => {
    if (preview) {
      return <img className='cam-preview' src={preview} alt="loader" />;
    } else {
      return <div id="cover-spin" className=''/>;
    }
  }

  const startStream = () =>{

    // create player
    const player = new JSMpeg.Player(null, {
      source: JSMpegWritableSource,
      canvas: streamCanvasRef.current,
      audio: true,
      pauseWhenHidden: false,
      videoBufferSize: 1024 * 1024
    });

    // Start socket
    const s = io(process.env.NEXT_PUBLIC_API!, {  });
    //console.log('Created socket', s.id);
    s.disconnect();    

    s?.on(`${cameraId}-stream`, async (data) => {
      //console.log('--stream2', player);      
      player.source.write(data);
    }); 

    setSocket(s);

    const ctx = drawCanvasRef.current?.getContext("2d");

    s.on(`${cameraId}-detect`, async (data) => {

      if (!ctx){
        return;
      }

      ctx.strokeStyle = "red";  
      const canvasWidth = drawCanvasRef.current?.width || 0;
      const canvasHeight = drawCanvasRef.current?.height || 0;

      if (data.length > 0){
          ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      }

      requestAnimationFrame(function () {
        for (let i = 0; i < data.length; i++) {
          ctx.font = "10px Arial";
          ctx.fillText(data[i].aveDiff, 5, 15);

          const x = mapRange(data[i].x, 0, data[i].imageWidth, 0, canvasWidth);
          const y = mapRange(data[i].y, 0, data[i].imageHeight, 0, canvasHeight);
          const w = mapRange(data[i].width, 0, data[i].imageWidth, 0, canvasWidth);
          const h = mapRange(data[i].height, 0, data[i].imageHeight, 0, canvasHeight);

          //console.log(x, y, w, h, data[i]);
          ctx.strokeRect(x, y, w, h);
        }
      });
    });
  }

  /**** Styles */
  const camWrapperStyle = {
    background: 'gray',
    textAlign: 'center'as const,
    display: 'block',
    position: 'relative'as const,
    maxWidth: '470px',
    height: '352px',
    borderRadius: '10px',
    objectFit: 'cover' as const,
    overflow: 'hidden',
    cursor: 'pointer',
    boxShadow: isHover ? '1px 2px 9px #545452' : 'none',
  }

  const modalStyle = {
    width: '1280px',
    height: '720px',
    position: 'absolute' as const, 
    left: '25%',
    top: '15%',
  }

  const streamStyle = {
    background: 'black',
    zIndex: 10
  };

  const drawStyle = {
    background: 'none',
    opacity : '5%',
    zIndex: 11
  };

  const closeModal = () => {
    setOpen(false);    
  }

  const openModal = () => {
    setOpen(true);
  }

  const camWrapperMouseEnter = () => {
    setIsHover(true);
  };

  const camWrapperMouseLeave = () => {
    setIsHover(false);
  };

  return (
    <div className='component-wrapper'>
      <div className='cam-wrapper' onClick={openModal} style={camWrapperStyle}  onMouseEnter={camWrapperMouseEnter} onMouseLeave={camWrapperMouseLeave}>
        { renderPreview() }
      </div>
      <div className={classNames({
        "overlay": true, 
        "visible": open, 
        })} onClick={closeModal} ref={overlayRef}>        
      
      </div>   
      <canvas className={classNames({"stream": true, "hidden": !open, "visible": open, })} ref={streamCanvasRef} style={Object.assign(modalStyle, streamStyle)} /> 
      <canvas className={classNames({"draw": true, "hidden": !open, "visible": open, })} ref={drawCanvasRef} style={Object.assign(modalStyle, drawStyle)} />
    </div>
  )
}

function mapRange (value : number, inMin : number, inMax: number, outMin: number, outMax: number) {
  value = (value - inMin) / (inMax - inMin);
  return outMin + value * (outMax - outMin);
}



export default CameraViewerAlt;