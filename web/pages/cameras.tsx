import React, { useEffect, useState } from "react";
import { useLocation, useSearchParams, useParams  } from "react-router-dom";
import { API, Camera, CameraEvent, PaginatedResults } from "services/api";
import moment from 'moment';
import dynamic from 'next/dynamic'
import { AiOutlineDownload, AiFillPlayCircle } from "react-icons/ai";
import { FaTrash } from "react-icons/fa";
import { Notifier } from "../components/Notifier";
import QuestionModal from "components/QuestionModal";
import classNames from "classnames";
import CameraConfig from "components/CameraConfig";
import {
  Accordion,
  AccordionHeader,
  AccordionBody,
} from "@material-tailwind/react";


export default function CamerasPage() {

  const [cameras, setCameras] = useState<Camera[]>([]);
  const [hover, setHover] = useState('none');
  const [selectedCam, setSelectedCam] = useState<Camera>(cameras[0]);
	
  useEffect(() => {
    API.getCameras().then((tryCams) => {
      if (tryCams.success){
        console.log('cams', tryCams.payload);
        setCameras(tryCams.payload!);
      }
      else{
        console.error(`Unable to get cameras: ${tryCams.error}`);
      }
      
    })
  }, []); 

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
    // console.log('cancel');
    // await getConfig();
    // Do something with the form data
  }

  const onSubmit = (cam:Camera) => {
    console.log('sibmit', cam);
    // Do something with the form data
  }

  const accAnimation = {
    mount: { scale: 1 },
    unmount: { scale: 0.9 },
  };

	return (
		<div className="container mx-auto max-w-7xl py-12 sm:px-6 lg:px-8" >
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
                <CameraConfig camera={cam} saveCamera={onSubmit} cancelEdit={onCancel}></CameraConfig>
            </AccordionBody>
          </Accordion>
        )
      })}
		</div>   
	);
}
