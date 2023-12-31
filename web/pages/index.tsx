
import { NextPage } from "next";
import React, { useEffect, useState } from "react";
import { API, Camera } from "services/api";
import dynamic from 'next/dynamic'

const DynamicComponentWithNoSSR = dynamic(
  () => import('../components/CamViewer'),
  { ssr: false }
)

const pageStyle = {
  paddingTop : '30px',
  height : '100%'
}

const camerasStyle = {
  transition: 'all .3s ease-in',
  maxWidth: '93%',
  verticalAlign: 'baseline' as const,
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(470px, 1fr))',
  gap: '2rem',
  margin: '0 auto auto'
}

const HomePage: NextPage = () => {

  const [cameras, setCameras] = useState<Camera[]>([]);

  useEffect(() => {
    API.getCameras().then((tryCams) => {
      if (tryCams.success){
        setCameras(tryCams.payload!);
      }
      else{
        console.error(`Unable to get cameras: ${tryCams.error}`);
      }
      
    })
  }, []);
  
  return (
    <div id="main" className="container" style={pageStyle}>
       <section style={camerasStyle} className="cameras">
       {cameras.map((cam, i) => {      
          let name = cam.detectionMethod == 'tf' ? cam.name + ' (Tensor flow)' : cam.name + ' (SVM)';
          return (<DynamicComponentWithNoSSR key={i.toString()} cameraName={name} cameraId={cam.id} ></DynamicComponentWithNoSSR>) 
        })}
       </section>        
    </div>
  );
};

export default HomePage;
