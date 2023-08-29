import { Fragment, useEffect, useRef, useState } from 'react'
import { Dialog, Transition, Combobox  } from '@headlessui/react'
import { BsChevronBarContract } from "react-icons/bs";
import { Camera } from 'services/api';
import { SubmitHandler, useForm } from 'react-hook-form'
import { FaTrash } from "react-icons/fa";
import moment from 'moment';

interface Props {
    camera: Camera,
    saveCamera: Function,
    cancelEdit: Function,
}

const protocols = [
  'http',
  'rtsp',
]

const detectionMethods = [
  'Tensor Flow',
  'Support vector Machine',
]

export default function CameraConfig({ camera, saveCamera, cancelEdit } : Props) {
  const [open, setOpen] = useState(true);
  const cancelButtonRef = useRef(null);
	const [selectedProtocols, setSelectedProtocols] = useState(protocols[0]);
	const [selectedDetectionMethod, setSelectedDetectionMethod] = useState(detectionMethods[0]);
	const [hover, setHover] = useState('none');

	useEffect(() => {
		console.log('here')
    setSettings();
  }, [camera]);	

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
    saveCamera(data);
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

	const buttonStyle = {
    background: hover == 'newSchedule' ? '#BBD686' : '#3DA5D9'  
  }

	//const onSubmit = (data: FormValues) => alert(JSON.stringify(data));

  return (
    <div className="container mx-auto max-w-7xl " >
    <form onSubmit={handleSubmit(onSubmit)}>														
      <div className="space-y-12">

        <div className="">
          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 content-start">
            <div className="sm:col-span-2 ">
              <label className="block text-sm leading-6 text-gray-400">
                The camera name.
              </label>
            </div>
            <div className="sm:col-span-4">
              <label htmlFor="removeTempFiles" className="block text-sm font-medium leading-6 text-gray-900">
                Name
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  id="name"
                  {...register('name', { required: true, minLength: 3 })}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-cyan-500 sm:text-sm sm:leading-6"
                />
                {errors.name && errors.name.type === "required" && (
                  <p className="text-xs italic text-red-500">Camera name is required</p>
                )}
                {errors.name && errors.name.type === "minLength" && (
                  <p className="text-xs italic text-red-500">Camera name should be at least 3 characters long</p>
                )}
              </div>
            </div>              
          </div>

          {/* URL */}				
          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 content-start">
            <div className="sm:col-span-2 ">
              <label className="block text-sm leading-6 text-gray-400">
                The RSTP url for the camera. Check your camera documentation for this address.
              </label>
            </div>
            <div className="sm:col-span-4">
              <label htmlFor="removeTempFiles" className="block text-sm font-medium leading-6 text-gray-900">
                URL
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  id="url"
                  {...register('url', {  required: true, pattern: {
                    value: /^rtsp:\/\//i,
                    message: "invalid"
                  } })}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-cyan-500 sm:text-sm sm:leading-6"
                />
                {errors.url && errors.url.type === "pattern" && (
                  <p className="text-xs italic text-red-500">Invalid url</p>
                )}
              </div>
            </div>              
          </div>

          {/* Snapshot URL */}					
          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 content-start">
            <div className="sm:col-span-2 ">
              <label className="block text-sm leading-6 text-gray-400">
                The snapshot url. Some cameras has an http endpoint to take snapshots. If there is no special endpoint, add the RSTP endpoint.
              </label>
            </div>
            <div className="sm:col-span-4">
              <label htmlFor="removeTempFiles" className="block text-sm font-medium leading-6 text-gray-900">
                Snapshot URL
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  id="snam"
                  {...register('snapshotUrl', {  required: true, pattern: {
                    value: /^(rtsp|http):\/\//i,
                    message: "invalid"
                  } })}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-cyan-500 sm:text-sm sm:leading-6"
                />
                {errors.snapshotUrl && errors.snapshotUrl.type === "pattern" && (
                  <p className="text-xs italic text-red-500">Invalid url</p>
                )}
              </div>
            </div>              
          </div>

          {/* Snapshot type */}					
          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 content-start">
            <div className="sm:col-span-2 ">
              <label className="block text-sm leading-6 text-gray-400">
                The snapshot type of url confirgured.
              </label>
            </div>
            <div className="sm:col-span-4">
              <label htmlFor="removeTempFiles" className="block text-sm font-medium leading-6 text-gray-900">
                Snapshot type
              </label>
              <div className="mt-2">
                <Combobox value={selectedProtocols} onChange={setSelectedProtocols}>
                  <div className="relative mt-1">
                    <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm">
                      <Combobox.Input className="w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-cyan-500 sm:text-sm sm:leading-6"/>
                      <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                        {<BsChevronBarContract
                          className="h-5 w-5 text-gray-400"
                          aria-hidden="true"
                        />}
                      </Combobox.Button> 
                    </div>
                    <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                      <Combobox.Options className="z-20 absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                        {protocols.map((p) => (
                          <Combobox.Option key={p} value={p}   className={({ active }) => `relative cursor-pointer select-none py-2 pl-10 pr-4 ${active ? 'bg-cyan-500 text-white' : 'text-gray-900'}`}>
                            {p}
                          </Combobox.Option>
                        ))}
                      </Combobox.Options>
                    </Transition>
                  </div>
                </Combobox>
              </div>
            </div>              
          </div> 

          {/* Detection method */}
          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 content-start">
            <div className="sm:col-span-2 ">
              <label className="block text-sm leading-6 text-gray-400">
                The Detection method. Choose between Support vector machine (custom built) or the commercial Tensor flow (reccommended) option.
              </label>
            </div>
            <div className="sm:col-span-4">
              <label htmlFor="removeTempFiles" className="block text-sm font-medium leading-6 text-gray-900">
                Detection method
              </label>
              <div className="mt-2">
                <Combobox value={selectedDetectionMethod} onChange={setSelectedDetectionMethod}>
                  <div className="relative mt-1">
                    <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm">
                      <Combobox.Input className="w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-cyan-500 sm:text-sm sm:leading-6"/>
                      <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                        {<BsChevronBarContract
                          className="h-5 w-5 text-gray-400"
                          aria-hidden="true"
                        />}
                      </Combobox.Button> 
                    </div>
                    <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                      <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                        {detectionMethods.map((d) => (
                          <Combobox.Option key={d} value={d}   className={({ active }) => `relative cursor-pointer select-none py-2 pl-10 pr-4 ${active ? 'bg-cyan-500 text-white' : 'text-gray-900'}`}>
                            {d}
                          </Combobox.Option>
                        ))}
                      </Combobox.Options>
                    </Transition>
                  </div>
                </Combobox>
              </div>
            </div>              
          </div> 

          {/* Stream resolution */}	
          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 content-start">
            <div className="sm:col-span-2 ">
              <label className="block text-sm leading-6 text-gray-400">
                The cameras native stream resolution. Check the camera documentation for more details.
              </label>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="streamResolution.width" className="block text-sm font-medium leading-6 text-gray-900">
                Stream width
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
            <div className="sm:col-span-2">
              <label htmlFor="streamResolution.width" className="block text-sm font-medium leading-6 text-gray-900">
                Stream height
              </label>
              <div className="mt-3">
                <input
                  type="number"
                  id="streamResolution.height"
                  {...register('streamResolution.height', { min: 360, max: 4320 })}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-cyan-500 sm:text-sm sm:leading-6"
                />
                {errors.streamResolution?.height && (
                  <p className="text-xs italic text-red-500">The stream resolition height needs to be between 360 and 4,320 (8K)</p>
                )}
              </div>
            </div>           
          </div>	

          {/* Video processing enabled */}
          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 content-start">
            <div className="sm:col-span-2 ">
              <label className="block text-sm leading-6 text-gray-400">
                Indicate if Video analysis should be performed on this camera, regardless of schedule. This needs to be enabled for the schedules to work.
              </label>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="videoProcessingEnabled" className="block text-sm font-medium leading-6 text-gray-900">
                Video analysis enabled
              </label>
              <div className="mt-2">
                <input  
                  id="videoProcessingEnabled" 
                  {...register('videoProcessingEnabled')}
                  type="checkbox" 
                  value="" 
                  className="cursor-pointer w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"></input>
              </div>
            </div>              
          </div>
        </div>

        {/* Schedules */}
        {/* <div className="border-b border-gray-900/10 pb-12">
          <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 content-start">
            <div className="sm:col-span-1 ">
              <h2 className={"text-xl font-semibold leading-7 text-gray-900 dark:text-gray-500"}>Schedules</h2>		
            </div>
            <div className="sm:col-span-1 ">
              <div className="flex items-center justify-end gap-x-6">
                <button
                  type="button"
                  onMouseOver={() => onMouseOver('newSchedule')}
                  onMouseLeave={okOnMouseLeave}
                  style={addButtonStyle}
                  className="rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">            
                  New
                </button>
              </div>
          
            </div>
          </div> 												
          <ul role="list" className="divide-y divide-gray-100">
            {camera?.eventConfig?.schedule?.map((s, i) => {      
              return (																			
                <li >
                  <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 content-start">
                    <div className="flex min-w-0 gap-x-4 sm:col-span-1">
                      <div className="min-w-0 flex-auto">
                        <p className="text-sm font-semibold leading-6 text-gray-900">Leslie Alexander</p>
                        <p className="mt-1 truncate text-xs leading-5 text-gray-500">leslie.alexander@example.com</p>
                      </div>
                    </div>
                    <div className="shrink-0 sm:flex sm:flex-col sm:items-end mr-3 mt-3">
                      <FaTrash style={delIconStyle} size={20}></FaTrash>
                    </div>
                    
                  </div>
                  
                </li>																			
              ) 
            })} 
          </ul>
        </div> */}

      </div>
      <div className="px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
        <button
            type="submit"
            style={buttonStyle}
            onMouseOver={() => onMouseOver('Save')}
            onMouseLeave={onMouseLeave}
            className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto">Save
        </button>
        <button
            type="button"
            className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-100 sm:mt-0 sm:w-auto"
            onClick={() => cancelEdit()}
            ref={cancelButtonRef}>Cancel
        </button>
      </div>
    </form>
  </div>
  )
}