//import CameraViewer from "components/layout/CameraViewer";
import { Button } from "@mui/material";
import { NextPage } from "next";
import React, { useEffect, useState } from "react";
import classNames from "classnames";
import { useForm } from 'react-hook-form'
import moment from 'moment';
//import { TEInput, TERipple } from "tw-elements-react";
import { API, CamEventConfig, CamEventSchedule, CamEventScheduleRange, Camera, Config } from "services/api";
import { AiOutlineEdit } from "react-icons/ai";
import CameraConfigModal from '../components/CameraConfigModal';
import {
  Accordion,
  AccordionHeader,
  AccordionBody,
} from "@material-tailwind/react";


const formStyle = {
  padding : '30px'
};

const click = () => {
  //console.log('parent click');
}




const containerStyle = {
  padding : '10px'
};

export default function ConfigPage() {

  const [hover, setHover] = useState('none');
  const [config, setConfig] = useState<Config>();
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [selectedCam, setSelectedCam] = useState<Camera>();
  //const [accOpen, setAccOpen] = useState<string>('none');
  const [openModal, setOpenModal] = useState(false);
  //const handleAccOpen = (value: React.SetStateAction<string>) => setAccOpen(accOpen === value ? 'none' : value);

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

  useEffect(() => {    
    getConfig();
  }, []); 

  useEffect(() => {
    reset(config);
  }, [config]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    mode: 'all',  
  });

  const getConfig = async()=> {
    let c = await API.getConfig();
    //console.log(c);
    if (c){
      setConfig(c);
    }
  }

  const onMouseOver = (item:string) =>{
		setHover(item);
	}

	const okOnMouseLeave = () =>{
    setHover('none');
	}

  const onCancel = async () => {
    console.log('cancel');
    await getConfig();
    // Do something with the form data
  }

  const onSubmit = (data:any) => {
    console.log('sibmit');
    // Do something with the form data
  }

  const cancelPromptModal = () =>{
    //setToBeDeleted(undefined);
    setOpenModal(false);
  }

  const confirmPromptModal = () =>{
    setOpenModal(false);
    // if (toBeDeleted){
    //   API.delEvent(toBeDeleted).then((tryGet) => {
    //     if (tryGet.success){
    //       Notifier.notifySuccess(`Event deleted`);
    //       fetcRecordings(currentPage);      
    //       setToBeDeleted(undefined);         
    //     }
    //     else{
    //       Notifier.notifyFail(`Unable to delete: ${tryGet.error}`);
    //     }
    //   })
    // } 
  }

  const openModalPrompt = (item: Camera) => {
    if (item != null){
      setOpenModal(true);
    }
  }
  
  const okButtonStyle = {
    background: hover == 'submit' ? '#BBD686' : '#3DA5D9'  
  }

  const addButtonStyle = {
    background: hover == 'newCam' ? '#BBD686' : '#3DA5D9'  
  }

  const editCamButtonStyle = {
    //background: hover == 'editCam' ? '#BBD686' : '#3DA5D9'  
  }




// const isOpen = (item:string) => {
//   //selectedCam
//   if (item == "1"){
//     return true;
//   }
//   return false;
// }

// const getAccState = (item:string) => {
//   //selectedCam
//   if (item == "1"){
//     return "open";
//   }
//   return "collapse";
// }

/*
accOpen, setAccOpen] = useState<string>('none');
  const handleAccOpen
*/

  const accAnimation = {
    mount: { scale: 1 },
    unmount: { scale: 0.9 },
  };


  return (
    <div className="container mx-auto max-w-7xl py-12 sm:px-6 lg:px-8" >
      <CameraConfigModal confirmModal={confirmPromptModal} cancelModal={cancelPromptModal} isOpen={openModal} camera={selectedCam!}/>
      <form onSubmit={handleSubmit(onSubmit)} >
        <div className="space-y-12">

          {/* General */}
          <div className="border-b border-gray-900/10 pb-12">
            <h2 className={"text-base font-semibold leading-7 text-gray-900 dark:text-gray-500"}>General</h2>

            <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 content-start">
              <div className="sm:col-span-2 ">
                <label className="block text-sm leading-6 text-gray-400">
                  Indicate if files created temporarily should be deleted.
                </label>
              </div>
              <div className="sm:col-span-1">
                <label htmlFor="removeTempFiles" className="block text-sm font-medium leading-6 text-gray-900">
                  Remove temp files
                </label>
                <div className="mt-2">
                  <input  
                    id="removeTempFiles" 
                    {...register('removeTempFiles')}
                    type="checkbox" 
                    value="" 
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"></input>
                </div>
              </div>              
            </div>

            <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 content-start">
              <div className="sm:col-span-2 ">
                <label className="block text-sm leading-6 text-gray-400">
                  The amount of seconds to buffer, this also affects the maximum recording time.
                </label>
              </div>
              <div className="sm:col-span-1">
                <label htmlFor="cameraBufferSeconds" className="block text-sm font-medium leading-6 text-gray-900">
                  Buffer seconds
                </label>
                <div className="mt-2">
                  <input
                    type="number"
                    id="cameraBufferSeconds"
                    {...register('cameraBufferSeconds', { min: 30, max: 1200 })}
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-cyan-500 sm:text-sm sm:leading-6"
                  />
                  {errors.cameraBufferSeconds && (
                    <p className="text-xs italic text-red-500">Camera buffer seconds needs to be between 30 and 1200 (20 minutes)</p>
                  )}
                </div>
              </div>              
            </div>

          </div>

          {/* Notifications */}
          <div className="border-b border-gray-900/10 pb-12">
            <h2 className={"text-base font-semibold leading-7 text-gray-900 dark:text-gray-500"}>Notifications</h2>
            <p className={"mt-1 text-sm leading-6 text-gray-400 dark:text-gray-400"}>
              The following section contains config related to the alert notifications.
            </p>

            <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 content-start">
              <div className="sm:col-span-2 ">
                <label className="block text-sm leading-6 text-gray-400">
                  The SendGrid API Key. See <a className="font-medium text-blue-600 dark:text-blue-500 hover:underline" href="https://docs.sendgrid.com/ui/account-and-settings/api-keys">Sendgrid</a> for more information.
                </label>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="removeTempFiles" className="block text-sm font-medium leading-6 text-gray-900">
                  API key
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    id="notificationsEmailProviderApiKey"
                    {...register('notificationsEmailProviderApiKey', { required: true, minLength: 30 })}
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-cyan-500 sm:text-sm sm:leading-6"
                  />
                  {errors.notificationsEmailProviderApiKey && errors.notificationsEmailProviderApiKey.type === "required" && (
                    <p className="text-xs italic text-red-500">API key is required</p>
                  )}
                  {errors.notificationsEmailProviderApiKey && errors.notificationsEmailProviderApiKey.type === "minLength" && (
                    <p className="text-xs italic text-red-500">Invalid API key</p>
                  )}
                </div>
              </div>              
            </div>

            <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 content-start">
              <div className="sm:col-span-2 ">
                <label className="block text-sm leading-6 text-gray-400">
                  The sender email address. This has to be configured as a sender in SendGrid, see <a className="font-medium text-blue-600 dark:text-blue-500 hover:underline" href="https://docs.sendgrid.com/glossary/sender-authentication">sender-authentication</a> for more information.
                </label>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="removeTempFiles" className="block text-sm font-medium leading-6 text-gray-900">
                  Sender
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    id="notificationsEmailSender"
                    {...register('notificationsEmailSender', {  required: true, pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "invalid email addresszx"
                    } })}
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-cyan-500 sm:text-sm sm:leading-6"
                  />
                  {errors.notificationsEmailSender && errors.notificationsEmailSender.type === "pattern" && (
                    <p className="text-xs italic text-red-500">invalid email address</p>
                  )}
                </div>
              </div>              
            </div>

          </div>

          {/* Event */}
          <div className="">
            <h2 className={"text-base font-semibold leading-7 text-gray-900 dark:text-gray-500"}>Event Config</h2>
            <p className={"mt-1 text-sm leading-6 text-gray-400 dark:text-gray-400"}>
              The following section contains config related to the events resulting from the video analysis.
              An event is a aggregation of detections during a time span.
            </p>
            <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 content-start">
              <div className="sm:col-span-2 ">
                <label className="block text-sm leading-6 text-gray-400">
                  The number of seconds to wait before finishing and aggregating an event. If new detection occur before this time, the event will continue.
                </label>
              </div>
              <div className="sm:col-span-1">
                <label htmlFor="eventIdleEndSeconds" className="block text-sm font-medium leading-6 text-gray-900">
                  Event idle seconds
                </label>
                <div className="mt-2">
                  <input
                    type="number"
                    id="eventIdleEndSeconds"
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-cyan-500 sm:text-sm sm:leading-6"
                    {...register('eventIdleEndSeconds', { min: 2, max: 20 })}
                  />
                  {errors.eventIdleEndSeconds && (
                    <p className="text-xs italic text-red-500">Event idle seconds needs to be between 2 and 10</p>
                  )}
                </div>
              </div>              
            </div>

            <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 content-start">
              <div className="sm:col-span-2 ">
                <label className="block text-sm leading-6 text-gray-400">
                  The number of seconds an event can last, after this time has passed the event will automatically be finished and saved.
                </label>
              </div>
              <div className="sm:col-span-1">
                <label htmlFor="eventSilenceSeconds" className="block text-sm font-medium leading-6 text-gray-900">
                  Event silence seconds
                </label>
                <div className="mt-2">
                  <input
                      type="number"
                      id="eventSilenceSeconds"
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-cyan-500 sm:text-sm sm:leading-6"
                      {...register('eventSilenceSeconds', { min: 1, max: 600 })}
                    />
                    {errors.eventSilenceSeconds && (
                      <p className="text-xs italic text-red-500">Event silence seconds needs to be between 1 and 600</p>
                    )}
                </div>
              </div>                
            </div>

            <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 content-start">
              <div className="sm:col-span-2 ">
                <label className="block text-sm leading-6 text-gray-400">
                  After an event has been finished new detections will be silenced for period of time.
                </label>
              </div>
              <div className="sm:col-span-1">
                <label htmlFor="eventLimitSeconds" className="block text-sm font-medium leading-6 text-gray-900">
                  Event limit seconds
                </label>
                <div className="mt-2">
                  <input
                      type="number"                   
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-cyan-500 sm:text-sm sm:leading-6"
                      id="eventLimitSeconds"
                      {...register('eventLimitSeconds', { min: 1, max: 60 })}
                    />
                    {errors.eventSilenceSeconds && (
                      <p className="text-xs italic text-red-500">Event limit seconds needs to be between 1 and 600</p>
                    )}
                </div>
              </div>              
            </div>

          </div>

          <div className="mt-6 flex items-center justify-end gap-x-6 border-b border-gray-900/10 pb-12">
            <button 
              type="button" 
              onClick={onCancel}
              className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-100 sm:mt-0 sm:w-auto">
              Cancel
            </button>
            <button
              type="submit"
              onMouseOver={() => onMouseOver('submit')}
              onMouseLeave={okOnMouseLeave}
              style={okButtonStyle}
              className="rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">            
              Save
            </button>
          </div>

          {/* Camera */}
          <div>

            <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 content-start">
              <div className="sm:col-span-5 ">
                <h2 className={"text-base font-semibold leading-7 text-gray-900 dark:text-gray-500"}>Camera Config</h2>
                <p className={"mt-2 text-sm leading-6 mb-8 text-gray-400 dark:text-gray-200"}>
                  The following section contains config related to the cameras as well as the config for each camera.
                </p>
              </div>
              <div className="sm:col-span-1 ">
                <div className="mt-6 flex items-center justify-end gap-x-6">
                  <button
                    type="button"
                    onMouseOver={() => onMouseOver('newCam')}
                    onMouseLeave={okOnMouseLeave}
                    style={addButtonStyle}
                    className="rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">            
                    New
                  </button>
                </div>
            
              </div>
            </div>     
            {cameras.map((cam, i) => {      
              return (
                <Accordion open={selectedCam?.id === cam.id} animate={accAnimation} className={` ${selectedCam?.id === cam.id ? 'border-b border-gray-900/10' : ''}`}>
                  <AccordionHeader onClick={() => setSelectedCam(cam)} className={`border-b-0 transition-colors ${selectedCam?.id === cam.id ? 'text-cyan-500 hover:!text-cyan-500 py-0 mb-2' : 'text-gray-900 py-2 mb-1'}`}>{cam.name} </AccordionHeader>
                  <AccordionBody>
                    <button 
                      onClick={() => openModalPrompt(cam)}
                      className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-100 sm:mt-0 sm:w-auto" style={editCamButtonStyle}  onMouseOver={() => onMouseOver('editCam')} onMouseLeave={okOnMouseLeave}><AiOutlineEdit size={20}></AiOutlineEdit></button>
                    
                    <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 content-start">
                      <div className="sm:col-span-2 ">
                        <label className="block text-sm font-medium leading-6 text-gray-900">
                            Name
                        </label>
                      </div>
                      <div className="sm:col-span-1">                        
                        <div className="mt-2">
                          <label>{cam?.name}</label>
                        </div>
                      </div>                
                    </div>
                    <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 content-start">
                      <div className="sm:col-span-2 ">
                        <label className="block text-sm font-medium leading-6 text-gray-900">
                            URL
                        </label>
                      </div>
                      <div className="sm:col-span-3">                        
                        <div className="mt-2">
                          <label>{cam?.url}</label>
                        </div>
                      </div>                
                    </div>
                    <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 content-start">
                      <div className="sm:col-span-2 ">
                        <label className="block text-sm font-medium leading-6 text-gray-900">
                            Snapshot URL
                        </label>
                      </div>
                      <div className="sm:col-span-3">                        
                        <div className="mt-2">
                          <label>{cam?.snapshotUrl}</label>
                        </div>
                      </div>                
                    </div>
                    <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 content-start">
                      <div className="sm:col-span-2 ">
                        <label className="block text-sm font-medium leading-6 text-gray-900">
                            Snapshot type
                        </label>
                      </div>
                      <div className="sm:col-span-3">                        
                        <div className="mt-2">
                          <label>{cam?.snapshotType}</label>
                        </div>
                      </div>                
                    </div>
                    <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 content-start">
                      <div className="sm:col-span-2 ">
                        <label className="block text-sm font-medium leading-6 text-gray-900">
                            Transport type
                        </label>
                      </div>
                      <div className="sm:col-span-1">                        
                        <div className="mt-2">
                          <label>{cam?.transport}</label>
                        </div>
                      </div>                
                    </div>
                    <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 content-start">
                      <div className="sm:col-span-2 ">
                        <label className="block text-sm font-medium leading-6 text-gray-900">
                            Detection method
                        </label>
                      </div>
                      <div className="sm:col-span-1">                        
                        <div className="mt-2">
                          <label>{cam?.detectionMethod == 'tf' ? 'Tensor Flow' : 'SVM'}</label>
                        </div>
                      </div>                
                    </div>
                    <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 content-start">
                      <div className="sm:col-span-2 ">
                        <label className="block text-sm font-medium leading-6 text-gray-900">
                            Video processing enabled
                        </label>
                      </div>
                      <div className="sm:col-span-1">                        
                        <div className="mt-2">
                          <label>{cam?.videoProcessingEnabled ? 'True' : 'False'}</label>
                        </div>
                      </div>                
                    </div>
                    <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 content-start">
                      <div className="sm:col-span-2 ">
                        <label className="block text-sm font-medium leading-6 text-gray-900">
                            Schedules
                        </label>
                      </div>
                      <div className="sm:col-span-3">                        
                        <div className="mt-2">
                          {
                            cam?.eventConfig.schedule?.map((s, i) => { 
                              return (s.ranges?.map((r, i) =>{
                                return <div className="block text-sm">
                                    <label className="font-medium ">{s.name} </label>
                                    <label>{moment.utc(r.start,'h:mm a').local().format('h:mm a')} </label>
                                    <label className="font-medium ">to </label>
                                    <label>{moment.utc(r.end,'h:mm a').local().format('h:mm a')}</label>
                                  </div>
                              }));                              
                            })
                          }                           
                        </div>
                      </div>                
                    </div>
                  </AccordionBody>
                </Accordion>
              ) 
            })}         

          </div>
        </div>
      </form>
    </div>
  );
}
