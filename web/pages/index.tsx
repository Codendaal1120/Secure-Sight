
import { NextPage } from "next";
import React, { useEffect, useState } from "react";
import { api } from "services/api";
import dynamic from 'next/dynamic'

const DynamicComponentWithNoSSR = dynamic(
  () => import('../components/CamViewer'),
  { ssr: false }
)
interface Camera {
  id: string;
  name: string;
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

/*
 transition: all .3s ease-in;
    max-width: 93%;
    vertical-align: baseline;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(470px, 1fr));
    gap: 2rem;
    margin: 0 auto auto;
*/


const HomePage: NextPage = () => {

  const [cameras, setCameras] = useState<Camera[]>([]);

  useEffect(() => {
    api.get("/api/cameras").then((res) => {
      const cameras = res.data.map((camera: Camera) => {
        return {
          id: camera.id,
          name: camera.name,
        };
      });
      setCameras(cameras);
    });
  }, []);
  
  return (
    <div id="main" className="container">
       <section style={camerasStyle} className="cameras">
       {cameras.map((cam, i) => {      
           return (<DynamicComponentWithNoSSR key={i.toString()} cameraName={cam.name} cameraId={cam.id} ></DynamicComponentWithNoSSR>) 
        })}
       </section>        
    </div>
  );
};

export default HomePage;
