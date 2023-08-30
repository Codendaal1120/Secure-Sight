import { Fragment, useEffect, useRef, useState } from 'react'
import { Dialog, Transition  } from '@headlessui/react'
import { Camera } from 'services/api';
import { useForm } from 'react-hook-form'
import CameraConfig from "components/CameraConfig";

interface Props {
    confirmModal: Function,
    cancelModal: Function,
    isOpen: boolean,
    camera: Camera  
}

export default function NewCameraModal({ confirmModal, cancelModal, isOpen, camera } : Props) {
  const [open, setOpen] = useState(true);
  const cancelButtonRef = useRef(null);

	useEffect(() => {
    setSettings();
  }, [camera, isOpen]);	

	const setSettings = () =>{
		reset(camera);
	}

	const {
    reset,
    formState: { errors },
  } = useForm<Camera>({
    mode: 'all', 
  });  

  const onCancel = async () => {
    cancelModal();
  }

  const onSubmit = async(data: any) => {
    confirmModal();
  }

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" initialFocus={cancelButtonRef} onClose={setOpen}>
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>
        <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" enterTo="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 translate-y-0 sm:scale-100" leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" >
                    <Dialog.Panel className="relative  transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-6xl p-10">
                      <CameraConfig camera={camera} confirmModal={onSubmit} cancelModal={onCancel}></CameraConfig>                            
                    </Dialog.Panel>
                </Transition.Child>
            </div>
        </div>
      </Dialog>
    </Transition.Root>    
  )
}