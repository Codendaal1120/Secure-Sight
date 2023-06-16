import { useRef, useEffect  } from 'react';
import { loadPlayer } from 'rtsp-relay/browser';
interface Props {
  cameraName: string;
  cameraUrl: string;
  camera : Camera;
}



export interface Camera {
  name :string;
  url :string;
}

function CameraViewer ({ camera } : Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!canvas.current) throw new Error('Ref is null');

    loadPlayer({
      url: 'ws://localhost:3002/api/stream',
      canvas: canvas.current,
    });
  }, []);

  return (
    <canvas ref={canvas} />
  )
}

export default CameraViewer;