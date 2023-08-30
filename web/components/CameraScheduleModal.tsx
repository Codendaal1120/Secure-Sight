import { Fragment, useEffect, useRef, useState } from 'react'
import { Dialog, Transition, Combobox  } from '@headlessui/react'
import { BsChevronBarContract } from "react-icons/bs";
import { Camera } from 'services/api';
import { SubmitHandler, useForm } from 'react-hook-form'
import { FaTrash } from "react-icons/fa";
import TimePicker from './TimePicker';
import TimePicker2 from './TimePicker2';
import moment from 'moment';
import {
  Accordion,
  AccordionHeader,
  AccordionBody,
} from "@material-tailwind/react";

interface Props {
    confirmModal: Function,
    cancelModal: Function,
    isOpen: boolean,
    camera: Camera  
}

const protocols = [
  'http',
  'rtsp',
]

const detectionMethods = [
  'Tensor Flow',
  'Support vector Machine',
]

const days = [
  'Sunday',
  'Monday',
  'Teusday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]


export default function CameraScheduleModal({ confirmModal, cancelModal, isOpen, camera } : Props) {
  const [open, setOpen] = useState(true);
  const cancelButtonRef = useRef(null);
	const [selectedProtocols, setSelectedProtocols] = useState(protocols[0]);
	const [selectedDetectionMethod, setSelectedDetectionMethod] = useState(detectionMethods[0]);
  const [selectedDay, setSelectedDay] = useState(days[0]);
	const [hover, setHover] = useState('none');

	useEffect(() => {
		console.log('here')
    setSettings();
  }, [camera, isOpen]);	

  const warnStyle = {        
    fill : '#b91c1c',
    size: 40
	}

	const setSettings = () =>{
		reset(camera);
	}

	const {
    register,
    reset,
		handleSubmit,
    formState: { errors },
  } = useForm<Camera>({
    mode: 'all', 
		//defaultValues: camera 
  });



	// const onSubmit = (data:Camera) => {
	// 	console.log('sibmit', data);
	// 	console.log(camera);
	// 	confirmModal();
	// 	// Do something with the form data
	// }

	const onSubmit = (data:Camera) => {
    // cons(JSON.stringify(data, null));
		console.log('data', data);
  	};

	const onMouseOver = (item:string) =>{
		setHover(item);
	}

	const onMouseLeave = () =>{
    setHover('none');
	}

	const delIconStyle = {        
		fill : '#dc2626'
	}

  const saveStyle = {
    background: hover == 'save' ? '#BBD686' : '#3DA5D9'  
  }

	const addButtonStyle = {
    background: hover == 'newSchedule' ? '#BBD686' : '#3DA5D9'  
  }

	//const onSubmit = (data: FormValues) => alert(JSON.stringify(data));

  return (
	  <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" initialFocus={cancelButtonRef} onClose={setOpen}>
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"> 
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>
          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" enterTo="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 translate-y-0 sm:scale-100" leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
                    <Dialog.Panel className="relative transform rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                      <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                        <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-gray-700 mb-3">
                            Add new schedule
                        </Dialog.Title>
                        
                        {/* Day */}					
                        <div className="sm:col-span-4">
                          <label htmlFor="removeTempFiles" className="block text-sm font-medium leading-6 text-gray-900">
                            Day
                          </label>
                          <div className="mt-2">
                            <Combobox value={selectedDay} onChange={setSelectedDay}>
                              <div className="relative mt-1">
                                <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm">
                                  <Combobox.Input  className="w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-cyan-500 sm:text-sm sm:leading-6"/>
                                  <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                                    {<BsChevronBarContract
                                      className="h-5 w-5 text-gray-400"
                                      aria-hidden="true"
                                    />}
                                  </Combobox.Button> 
                                </div>
                                <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                                  <Combobox.Options className="z-10 absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                    {days.map((d, i) => {
                                      return <Combobox.Option key={d} value={d} className={({ active }) => `relative cursor-pointer select-none py-2 pl-10 pr-4 ${active ? 'bg-cyan-500 text-white' : 'text-gray-900'}`}>{d}</Combobox.Option>
                                    })}
                                  </Combobox.Options>
                                </Transition>
                              </div>
                            </Combobox>
                          </div>
                        </div>   

                        {/* Stream resolution */}	
                        <div className="mt-5 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 content-start">
                          <div className="sm:col-span-1">
                            <label htmlFor="streamResolution.width" className="block text-sm font-medium leading-6 text-gray-900">
                              From
                            </label>
                            <div className="mt-3">
                              <input
                                type="number"
                                id="streamResolution.width"
                                {...register('streamResolution.width', { min: 480, max: 7680 })}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-cyan-500 sm:text-sm sm:leading-6"
                              />
                              {errors.streamResolution?.width && (
                                <p className="text-xs italic text-red-500">The stream resolition width needs to be between 360 and 7,680 (8K)</p>
                              )}
                            </div>
                          </div>     
                          {/* <div className="sm:col-span-1"></div> */}
                          <div className="sm:col-span-1">
                            <label htmlFor="streamResolution.width" className="block text-sm font-medium leading-6 text-gray-900">
                              To
                            </label>
                            <div className="mt-3">
                            <div className="flex justify-center">
                              <TimePicker2 ></TimePicker2>
                            </div>
                              {/* <input
                                type="text"
                                id="streamResolution.height"
                                {...register('streamResolution.height', { min: 360, max: 4320 })}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-cyan-500 sm:text-sm sm:leading-6"
                              />
                              {errors.streamResolution?.height && (
                                <p className="text-xs italic text-red-500">The stream resolition height needs to be between 360 and 4,320 (8K)</p>
                              )} */}
                            </div>
                          </div>           
                        </div>	
                      </div>
                      {/* Buttons */}	
                      <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                          <button
                              type="button"
                              style={saveStyle}
                              onMouseOver={() => onMouseOver('save')}
                              onMouseLeave={onMouseLeave}
                              className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto px-5"
                              onClick={() => confirmModal()}>
                                  Add
                          </button>
                          <button
                              type="button"
                              className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-200 sm:mt-0 sm:w-auto"
                              onClick={() => cancelModal()}
                              ref={cancelButtonRef}>
                              Cancel
                          </button>
                      </div>
                    </Dialog.Panel>
                </Transition.Child>
            </div>
          </div>
      </Dialog>
    </Transition.Root>
  )
}