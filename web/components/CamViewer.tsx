import { useRef, useEffect, useState, useContext } from 'react';
import classNames from "classnames";
import JSMpegWritableSource from './JSMpegWritableSource'
import JSMpeg from '@seydx/jsmpeg/lib/index.js';
import { BsRecordCircleFill } from "react-icons/bs";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { API } from "services/api";
import { SocketContext } from 'context/socket';
import { Notifier } from "./Notifier";

interface Props {
  cameraName: string;
  cameraId: string;
}

function CameraViewer ({ cameraId, cameraName } : Props) { 
  const streamCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const socket = useContext(SocketContext);

  const [open, setOpen] = useState(false);
  const [isHover, setIsHover] = useState(false);
  const [recording, setRecording] = useState("Start recording");
  const [preview, setPreview] = useState<string>();
  
  useEffect(() => {
    //console.log('drawCanvas', drawCanvasRef);
    getCameraSnapshot(cameraId).then((res) => {
      if (res){
        setPreview(res);
      }      
    });
  }, []);

  useEffect(() => {
    if (open){
      startStream();
    }
    else{
      socket.off(`${cameraId}-stream`);
      socket.off(`${cameraId}-detect`);
    }
  }, [open]);

  async function getCameraSnapshot(_camId: string)  { 
    try{
      const response = await fetch(`${process.env.NEXT_PUBLIC_API}/api/cameras/${_camId}/snapshot`);
      const imageBlob = await response.blob();
      const imageObjectURL = URL.createObjectURL(imageBlob); 
      return imageObjectURL;
    } catch(err){
      console.error(`Unable to load preview :${err}`);
      return null;
    }  
  };

  const renderPreview = () => {
    if (preview) {
      return <img className='cam-preview' src={preview} alt="loader" />;
    } else {
      return <div id="cover-spin" className=''/>;
    }
  }

  const isRecording = () =>{
    return recording == "Stop recording";
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

    const ctx = drawCanvasRef.current?.getContext("2d");
    const canvasWidth = drawCanvasRef.current?.width || 0;
    const canvasHeight = drawCanvasRef.current?.height || 0;

    socket.on(`${cameraId}-stream`, async (data) => { 
      player.source.write(data);      
    });   

    socket.on(`${cameraId}-detect-clear`, async (data:string | undefined) => {
   
      if (data == null || ctx == null){
        return;
      }

      var thresh = new Date(new Date().getTime() - 7 * 1000).getTime();
      var lastDetection = Date.parse(data);
      if (lastDetection < thresh){
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);  
      }
    });

    socket.on(`${cameraId}-detect`, async (data) => {

      if (!ctx){
        return;
      }

      ctx.strokeStyle = "red";
      
      if (data == null){
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);     
        return;
      }

      if (data.length > 0){
          ctx.clearRect(0, 0, canvasWidth, canvasHeight);          
      }
      
      requestAnimationFrame(function () {
        for (let i = 0; i < data.length; i++) {
          // ctx.font = "10px Arial";
          // ctx.fillText(data[i].aveDiff, 5, 15);

          const x = mapRange(data[i].x, 0, 1, 0, canvasWidth);
          const y = mapRange(data[i].y, 0, 1, 0, canvasHeight);
          const w = mapRange(data[i].width, 0, 1, 0, canvasWidth);
          const h = mapRange(data[i].height, 0, 1, 0, canvasHeight);

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
    height: '264px',
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
    border : '1px solid #565555',
    boxShadow: '1px 2px 9px #545452',
    background: 'black',
    zIndex: 10
  };

  const drawStyle = {
    background: 'none',
    opacity : '5%',
    zIndex: 11
  };

  const statusBarStyles = {
    statusBar : {
        
        background: 'none' as const,
        width: '1280px',
        position: 'absolute' as const, 
        left: '25%',
        top: '15%',
        height: '50px',
        zIndex: 12,
        opacity : '5%',
        color : '#C4C2C2'   
    },
    statusBarItemRight :{
        float : 'right' as const,        
        marginRight : '10px',
        marginTop : '5px',
        textAlign: 'right' as const,
        display : isRecording() ? 'block' : 'none'
    },
    statusBarItemLeft :{
        float : 'left' as const,
        marginLeft : '10px',
        marginTop : '5px',
        textAlign: 'left' as const,
       
    }
  }

  const controlBarStyles = {
    controlBar : {
        paddingLeft : '15px',
        paddingBottom : '15px',
        background: 'none',
        width: '1280px',
        position: 'absolute' as const, 
        left: '25%',
        top: 'calc(15% + 670px)',
        height: '50px',
        zIndex: 12,
        opacity : '5%',
      },
      controlButton : {
        // background : '#00AFB5'
      }
  };

  /** Functions */

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

  const toggleRecord = () => {
    if (recording == "Start recording"){
        setRecording("Stop recording"); 
        API.startCameraRecording(cameraId, 20).then(async (res:any) => {
            if (res.success){ Notifier.notifySuccess(res.payload); }
            else{ Notifier.notifyFail(res.error); }
        }); 
    }
    else{
        setRecording("Start recording"); 
        API.stopCameraRecording(cameraId).then(async (res:any) => {
          if (res.success){ Notifier.notifySuccess(res.payload); }
          else{ Notifier.notifyFail(res.error); }
      });         
    }    
  }

  const mapRange = (value : number, inMin : number, inMax: number, outMin: number, outMax: number) => {
    value = (value - inMin) / (inMax - inMin);
    return outMin + value * (outMax - outMin);
  };

  return (
    <div className='component-wrapper'>
        <ToastContainer />
        <div className='cam-wrapper' onClick={openModal} style={camWrapperStyle}  onMouseEnter={camWrapperMouseEnter} onMouseLeave={camWrapperMouseLeave}>
            { renderPreview() }
        </div>
        <div className={classNames({
            "overlay": true, 
            "visible": open, 
            })} onClick={closeModal} ref={overlayRef}>        
        
        </div>   
        <div className={classNames({"hidden": !open, "visible": open, })} style={statusBarStyles.statusBar}>
            <div style={statusBarStyles.statusBarItemLeft}>{cameraName}</div>
            <div style={statusBarStyles.statusBarItemRight}>
                <BsRecordCircleFill fill='#EF2F00' stroke='green' className="w-6 h-6" />
            </div>
        </div>
        <canvas className={classNames({"stream": true, "hidden": !open, "visible": open, })} ref={streamCanvasRef} style={Object.assign(modalStyle, streamStyle)} /> 
        <canvas className={classNames({"draw": true, "hidden": !open, "visible": open, })} ref={drawCanvasRef} style={Object.assign(modalStyle, drawStyle)} />
        <div className={classNames({"hidden": !open, "visible": open, })} style={controlBarStyles.controlBar}>
            <button className='bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded inline-flex items-center' style={controlBarStyles.controlButton} onClick={toggleRecord}>{recording}</button>
        </div>
    </div>
  )
}

export default CameraViewer;;