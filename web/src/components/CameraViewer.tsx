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
  return (
    <div>{camera.name}</div>
  )
}

export default CameraViewer;