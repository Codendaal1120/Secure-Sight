//import CameraViewer from "components/layout/CameraViewer";
import { Button } from "@mui/material";
import { NextPage } from "next";
import React, { useState } from "react";
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';



import dynamic from 'next/dynamic'

//const [cameras, setCameras] = useState([]);

const DynamicComponentWithNoSSR = dynamic(
  () => import('../components/CamViewer'),
  { ssr: false }
)

const compStyle = {
  position: 'absolute' as const,
  background: 'blue',
  left: 100,
  top: 100,
};

const click = () => {
  //console.log('parent click');
}


const style = {
  position: 'absolute' as 'absolute',
  // top: '50%',
  // left: '50%',
  // transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

export default function ConfigPage() {
  return (
    <div onClick={click} className="container">
       <section className="cameras">
        <DynamicComponentWithNoSSR cameraName={"TEST"} cameraId={"648811f030e04fc1ff98568d"}></DynamicComponentWithNoSSR>
        <DynamicComponentWithNoSSR cameraName={"TEST"} cameraId={"648811f030e04fc1ff98568d"}></DynamicComponentWithNoSSR>
       </section>
      
    </div>
  );
}
