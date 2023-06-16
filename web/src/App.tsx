import * as api from './services/Api';
import './App.css'
import CameraViewer from './components/CameraViewer';
//import {Camera, CameraViewer}  from './components/CameraViewer';
import.meta.env

function App() {
 
  const c2 = api.cameras();
  console.log(c2);
  const c = { name : 'Test-Cam', url: 'prop2'};

  return (
    <CameraViewer cameraName={'Test'} cameraUrl={'rtsp://192.168.86.50:8554/profile0'} camera={ c }/>
  )
}

export default App
