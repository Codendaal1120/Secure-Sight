import * as api from './services/Api';
import CameraViewer from './components/CameraViewer';
//import {Camera, CameraViewer}  from './components/CameraViewer';
import.meta.env

function App() {
 
  const cams = api.cameras();
  console.log(cams);  

  return (
    <CameraViewer cameraName={'Test'} cameraId={'648811f030e04fc1ff98568d'}/>
  )
}

export default App
