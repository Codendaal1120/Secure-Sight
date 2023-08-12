import { useRef, useEffect } from 'react';
// import '../../styles/cameraviewer.css'
// import JSMpegWritableSource from './JSMpegWritableSource.ts'
// import { io } from 'socket.io-client';
// import JSMpeg from '@seydx/jsmpeg/lib/index.js';
//import {AppStyles} from "../../styles/AppStyles.styles.tw";

interface Props {
  cameraName: string;
//   cameraUrl: string;
//   camera : Camera;
}

export interface Camera {
  id :string;
  name :string;
  url :string;
}

const drawStyle = {
    // width: '640px',
    // height: '360px',
    
  };

function CameraViewer ({ cameraName } : Props) {

  useEffect(() => {
 

  //}, [camera.id, drawCanvas, ioClient]);
    }, []);

  return (
//<AppStyles>
        <div className='cam-wrapper' style={drawStyle}><h1 className='cam-label'>CAM {cameraName}</h1></div>    
  //  </AppStyles>    
  )


    function mapRange (value : number, inMin : number, inMax: number, outMin: number, outMax: number) {
    value = (value - inMin) / (inMax - inMin);
    return outMin + value * (outMax - outMin);
    }
}

export default CameraViewer;