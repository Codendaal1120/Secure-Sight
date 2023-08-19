import React, { useEffect, useRef, useState } from "react";
import { API, Recording } from "services/api";
import moment from 'moment';
import { BsRecordCircleFill } from "react-icons/bs";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import dynamic from 'next/dynamic'
//import Modal from "../components/Modal";

const DynamicRecordingPlayer = dynamic(
    () => import('../components/RecordingPlayer'),
    { ssr: false }
  )  

const pageStyle = {
    padding: '30px'
}

const notifySuccess = (text:string) => toast.success(text, {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "dark",
});

const notifyFail = (text:string) => toast.error(text, {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "dark",
});

function secondsToTime(sec:number): string{

    var time = '';

    if (sec >= 3600){
        var hours = Math.floor(sec / 3600);
        time += `${hours}h `;
        sec = sec - (hours * 3600);
    }

    if (sec >= 60){
        var min = Math.floor(sec / 60);
        sec = sec - (min * 60);
        time += `${min}m `;   
    }

    if (sec <= 3600){
        time += `${sec}s`;  
    }

    return time.trim();
}

export default function RecordingsPage() {

    //const overlayRef = useRef<HTMLDivElement>(null);
    //const streamCanvasRef = useRef<HTMLCanvasElement>(null);
    //const [socket, setSocket] = useState<Socket<DefaultEventsMap, DefaultEventsMap>>();

    const [recordings, setRecordings] = useState<Recording[]>([]);
   // const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState<Recording>();
    const [isOpen, setIsOpen] = useState(false);

    // useEffect(() => {
    //     console.log('isOpen changed', isOpen);
    // }, [isOpen]);

    useEffect(() => {
        API.getRecordings().then((tryGet) => {
            if (tryGet.success){
                setRecordings(tryGet.payload!);
            }
            else{
                console.error(`Unable to get recordings: ${tryGet.error}`);
            }
        })
    }, []);

    // useEffect(() => {
    //     setIsOpen(false);
    //     //console.log('selected changed');
    // }, [selected]);



    // useEffect(() => {    
    //     if (open){
    //         startSocket();
    //         socket?.connect();
    //     }
    //     else{
    //         socket?.disconnect();
    //         socket?.removeAllListeners();
    //     }
    // }, [open, selected]);

    // const startSocket = () =>{

    //     if (!selected){
    //         return;
    //     }

    //     // create player
    //     const player = new JSMpeg.Player(null, {
    //       source: JSMpegWritableSource,
    //       canvas: streamCanvasRef.current,
    //       audio: true,
    //       pauseWhenHidden: false,
    //       videoBufferSize: 1024 * 1024
    //     });
    
    //     // Start socket
    //     const s = io(process.env.NEXT_PUBLIC_API!, {  });
    //     //console.log('Created socket', s.id);
    //     s.disconnect();    
    
    //     s?.on(`${selected.id}-stream`, async (data) => {
    //       //console.log('--stream2', player);      
    //       player.source.write(data);
    //     }); 
    
    //     setSocket(s);
    // }

    // const closeModal = () => {
    //     setOpen(false);    
    // }
    
    const openModal = (item: Recording) => {
        //setOpen(true);
        //console.log('setting selected');
        setIsOpen(true);
        setSelected(item);

        API.streamRecording(item.id);
    }

    // const streamStyle = {
    //     border : '1px solid #565555',
    //     boxShadow: '1px 2px 9px #545452',
    //     background: 'black',
    //     zIndex: 10,
    //     width: '1280px',
    //     height: '720px',
    //     position: 'absolute' as const, 
    //     left: '25%',
    //     top: '15%',
    //   };

    return (
        <div id="main" className="container" style={pageStyle}>

            <DynamicRecordingPlayer key={selected?.id} recording={selected} signalClose={setIsOpen} isOpen={isOpen}></DynamicRecordingPlayer>
            {/* <div className={classNames({
                "overlay": true, 
                "visible": open, 
                })} onClick={closeModal} ref={overlayRef}>
            </div>   
            <canvas className={classNames({"stream": true, "hidden": !open, "visible": open, })} ref={streamCanvasRef} style={streamStyle} />  */}
            
            <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
                <table className="w-full text-sm text-left text-gray-400">
                    <thead className="text-xs uppercase bg-gray-700 text-gray-400">
                        <tr>
                            <th scope="col" className="px-6 py-3">
                                Camera
                            </th>
                            <th scope="col" className="px-6 py-3">
                                FileName
                            </th>
                            <th scope="col" className="px-6 py-3">
                                Date
                            </th>
                            <th scope="col" className="px-6 py-3">
                                Length
                            </th>
                            <th scope="col" className="px-6 py-3">
                                Download
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {recordings.map((rec) => (
                            
                            <tr key={rec.id} className="bg-gray-600 border-gray-700 hover:bg-gray-500 text-white" onClick={() => openModal(rec)}>
                                
                                 <td className="px-6 py-4">
                                    {rec.cameraName}
                                </td>
                                <td className="px-6 py-4">
                                    {rec.fileName}
                                </td>
                                <td className="px-6 py-4">
                                    { moment(rec.recordedOn).local().format('LLL') }
                                </td>
                                <td className="px-6 py-4">
                                    { secondsToTime(rec.length) }
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <a href="#" className="font-medium text-blue-600 dark:text-blue-500 hover:underline">d</a>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

        </div>
   
    );
}
