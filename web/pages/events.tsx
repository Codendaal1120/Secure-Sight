//import CameraViewer from "components/layout/CameraViewer";
// import { Button } from "@mui/material";
// import { NextPage } from "next";
import React from "react";
// import Box from '@mui/material/Box';
// import Typography from '@mui/material/Typography';
// import Modal from '@mui/material/Modal';
//import CameraViewerAlt from "components/CameraViewerAlt";

import dynamic from 'next/dynamic'

const DynamicComponentWithNoSSR = dynamic(
  () => import('../components/CameraViewerAltAlt'),
  { ssr: false }
)

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

export default function EventsPage() {
  return (
    <div>
      <DynamicComponentWithNoSSR cameraName={"TEST"} cameraId={"648811f030e04fc1ff98568d"}></DynamicComponentWithNoSSR>
    </div>
  );
}
