import { useRef, useEffect } from 'react';
import JSMpegWritableSource from './JSMpegWritableSource.ts'
import { io } from 'socket.io-client';
import JSMpeg from '@seydx/jsmpeg/lib/index.js';

interface Props {
  cameraName: string;
  cameraUrl: string;
  camera : Camera;
}

export interface Camera {
  id :string;
  name :string;
  url :string;
}

function CameraViewer ({ camera } : Props) {
  // TODO: get address from config
  const ioClient = io('http://localhost:3002', {  });   
  const canvas = useRef<HTMLCanvasElement>(null);
 
  useEffect(() => {
    const player = new JSMpeg.Player(null, {
      source: JSMpegWritableSource,
      canvas: canvas.current,
      audio: true,
      pauseWhenHidden: false,
      videoBufferSize: 1024 * 1024,
      onSourcePaused: () => {
        // todo
      },
      onSourceEstablished: () => {
        // todo
      },
    });

    ioClient.on(`${camera.id}-stream`, async (data) => {
      player.source.write(data.stream); 
    });    

  }, [camera.id, ioClient]);

  return (
    <canvas ref={canvas} />
  )
}

export default CameraViewer;