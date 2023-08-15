import { useRef, useEffect, useState } from 'react';
import classNames from "classnames";
import JSMpegWritableSource from './JSMpegWritableSource.ts'
import { io } from 'socket.io-client';
import JSMpeg from '@seydx/jsmpeg/lib/index.js';
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

async function CameraViewer ({ cameraId, cameraName } : Props) {
  // TODO: get address from config
  //const ioClient = io('http://localhost:3002', {  });   
  const streamCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  
  const [open, setOpen] = useState(false);
  const [isHover, setIsHover] = useState(false);
  const [loaded, setLoaded] = useState<boolean>();
  
  useEffect(() => {
    console.log('drawCanvas', drawCanvasRef)
    
  
  }, []);

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

  const renderPreview = async () => {
    console.log('render');
    var img = await getCameraSnapshot(cameraId);
    if (img) {
      return <img className='cam-preview' src={img} alt="loader" />;
    } else {
      return <div id="cover-spin" className=''/>;
    }
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
    background: 'pink',
    zIndex: 11
  };

  const closeModal = () => {
    console.log('close');
    setOpen(false);
  }

  const openModal = () => {
    console.log('open');
    console.log('open', drawCanvasRef);
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
        {/* <div id="cover-spin" className=''  />     */}
        {await renderPreview()}
      </div>
      <div className={classNames({
        "overlay": true, 
        "visible": open, 
        })} onClick={closeModal} ref={overlayRef}>        
      
      </div>   
      <canvas className={classNames({"video": false, "hidden": !open, "visible": open, })} ref={streamCanvasRef} style={Object.assign(modalStyle, streamStyle)} /> 
      <canvas className={classNames({"video": false, "hidden": !open, "visible": open, })} ref={drawCanvasRef} style={Object.assign(modalStyle, drawStyle)} />
    </div>
  )
}

function mapRange (value : number, inMin : number, inMax: number, outMin: number, outMax: number) {
  value = (value - inMin) / (inMax - inMin);
  return outMin + value * (outMax - outMin);
}



export default CameraViewer;