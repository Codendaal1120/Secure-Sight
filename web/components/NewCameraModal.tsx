import { Fragment, useEffect, useRef, useState } from 'react'
import { Dialog, Transition, Combobox  } from '@headlessui/react'
import { BsChevronBarContract } from "react-icons/bs";
import { Camera } from 'services/api';
import { SubmitHandler, useForm } from 'react-hook-form'
import { FaTrash } from "react-icons/fa";
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

export default function NewCameraModal({ confirmModal, cancelModal, isOpen, camera } : Props) {
  const [open, setOpen] = useState(true);
  const cancelButtonRef = useRef(null);
	const [selectedProtocols, setSelectedProtocols] = useState(protocols[0]);
	const [selectedDetectionMethod, setSelectedDetectionMethod] = useState(detectionMethods[0]);
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

	const okOnMouseLeave = () =>{
    setHover('none');
	}

	const delIconStyle = {        
		fill : '#dc2626'
	}

	const addButtonStyle = {
    background: hover == 'newSchedule' ? '#BBD686' : '#3DA5D9'  
  }

	//const onSubmit = (data: FormValues) => alert(JSON.stringify(data));

  return (
	<Transition.Root show={isOpen} as={Fragment}>
    <Dialog as="div" className="relative z-10" initialFocus={cancelButtonRef} onClose={setOpen}>
        <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

        </Transition.Child>
            <div className="fixed inset-0 z-10 overflow-y-auto">
                <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                    <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" enterTo="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 translate-y-0 sm:scale-100" leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" >
                        <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                        {/* <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                                    Delete Recording
                                </Dialog.Title> */}
                            
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </div>
        </Dialog>
    </Transition.Root>
  )
}