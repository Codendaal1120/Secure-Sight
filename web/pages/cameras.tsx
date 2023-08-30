import React, { useEffect, useState } from "react";
import { API, Camera } from "services/api";
import CameraConfig from "components/CameraConfig";
import {
  Accordion,
  AccordionHeader,
  AccordionBody,
} from "@material-tailwind/react";
import NewCameraModal from "components/NewCameraModal";


export default function CamerasPage() {

  const [cameras, setCameras] = useState<Camera[]>([]);
  const [hover, setHover] = useState('none');
  const [selectedCam, setSelectedCam] = useState<Camera>(cameras[0]);
  const [newCamModalopen, setNewCamModalopen] = useState(false);

  const cam: Camera = {
    id: '',
    name: '',
    url: '',
    snapshotUrl: '',
    snapshotType: '',
    transport: '',
    detectionMethod: '',
    videoProcessingEnabled: false,
    streamResolution: { width: 0, height : 0 },
    eventConfig: {
      recordEvents: false,
      schedule : []
    }
  };
	
  useEffect(() => {
    loadCameras();
  }, []); 

  const loadCameras = () =>{
    API.getCameras().then((tryCams) => {
      if (tryCams.success){
        setCameras(tryCams.payload!);
      }
      else{
        console.error(`Unable to get cameras: ${tryCams.error}`);
      }      
    })
  }

  const onMouseOver = (item:string) =>{
		setHover(item);
	}

  const addButtonStyle = {
    background: hover == 'newSchedule' ? '#BBD686' : '#3DA5D9'  
  }

	const onMouseLeave = () =>{
    setHover('none');
	}

  const onCancel = async (cam:Camera) => {
    // no need to do anything
  }

  const onSubmit = (cam:Camera) => {
    loadCameras();
  }

  const openNewCamModal = () => {
		setNewCamModalopen(true);
	}

  const cancelNewCamModal = () =>{
    setNewCamModalopen(false);
	}

	const confirmNewCamModal = (data:any) =>{
		setNewCamModalopen(false);
    loadCameras();
	}

  const accAnimation = {
    mount: { scale: 1 },
    unmount: { scale: 0.9 },
  };

	return (
		<div className="container mx-auto max-w-7xl py-12 sm:px-6 lg:px-8" >
      
      <NewCameraModal confirmModal={confirmNewCamModal} cancelModal={cancelNewCamModal} isOpen={newCamModalopen} camera={cam}></NewCameraModal>
      <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 content-start border-b border-gray-900/10">
        <div className="sm:col-span-5 ">
          <h2 className={"text-base font-semibold leading-7 text-gray-800 dark:text-gray-500"}>Camera Config</h2>
          <p className={"mt-2 text-sm leading-6 mb-8 text-gray-400 dark:text-gray-200"}>
            The following section contains config related to the cameras as well as the config for each camera.
          </p>
        </div>
        <div className="sm:col-span-1 ">
          <div className="mt-6 flex items-center justify-end gap-x-6">
            <button
              type="button"
              onClick={openNewCamModal}
              onMouseOver={() => onMouseOver('newCam')}
              onMouseLeave={onMouseLeave}
              style={addButtonStyle}
              className="rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">            
              New
            </button>
          </div>

        </div>
      </div>
      {cameras.map((cam, i) => {      
        return (
          <Accordion key={cam.id} open={selectedCam?.id === cam.id} animate={accAnimation} className={`border-b border-gray-900/10`}>
            <AccordionHeader onClick={() => setSelectedCam(cam)} className={`border-b-0 transition-colors ${selectedCam?.id === cam.id ? 'text-cyan-500 hover:!text-cyan-500 py-0 mb-2' : 'text-gray-800 py-2 mb-1'}`}>Edit {cam.name} </AccordionHeader>
            <AccordionBody>
                <CameraConfig camera={cam} confirmModal={onSubmit} cancelModal={onCancel}></CameraConfig>
            </AccordionBody>
          </Accordion>
        )
      })}
		</div>   
	);
}
