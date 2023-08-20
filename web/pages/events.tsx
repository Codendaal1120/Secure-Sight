import React, { useEffect, useRef, useState } from "react";
import { API, Recording } from "services/api";
import moment from 'moment';
import dynamic from 'next/dynamic'
import { AiOutlineDownload, AiFillPlayCircle } from "react-icons/ai";
import { Notifier } from "../components/Notifier";

const DynamicRecordingPlayer = dynamic(
    () => import('../components/RecordingPlayer'),
    { ssr: false }
  )  

const pageStyle = {
    padding: '30px'
}

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

export default function EventsPage() {

    const [recordings, setRecordings] = useState<Recording[]>([]);
    const [selected, setSelected] = useState<Recording>();
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        API.getRecordings().then((tryGet) => {
            if (tryGet.success){
                setRecordings(tryGet.payload!);
            }
            else{
                Notifier.notifyFail(`Unable to get recordings: ${tryGet.error}`);
            }
        })
    }, []);
    
    const openModal = (item: Recording) => {
        setIsOpen(true);
        setSelected(item);
    }

    const clickableStyle = {
        cursor  : 'pointer',
    }

    const iconStyle = {
        
        fill : '#7789FF'
        // text-blue-600
    }

    const getDownloadLink = (item: Recording) => {
        return `${process.env.NEXT_PUBLIC_API}/api/recordings/${item.id}/download`;
    }

    return (
        <div id="main" className="container" style={pageStyle}>

            <DynamicRecordingPlayer key={selected?.id} recording={selected} signalClose={setIsOpen} isOpen={isOpen}></DynamicRecordingPlayer>
            
            <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
                <table className="w-full text-sm text-left text-gray-400">
                    <thead className="text-xs uppercase bg-gray-700 text-gray-400">
                        <tr>
                            <th scope="col" className="px-6 py-3">
                                Play
                            </th>
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
                            
                            <tr key={rec.id} className="bg-gray-600 border-gray-700 hover:bg-gray-500 text-white">
                                
                                <td className="px-6 py-4 text-right" style={clickableStyle} onClick={() => openModal(rec)}>
                                    <AiFillPlayCircle style={iconStyle}></AiFillPlayCircle>
                                </td>
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
                                <td className="px-6 py-4 text-right" style={clickableStyle}>                                    
                                    <a href={getDownloadLink(rec)} download><AiOutlineDownload style={iconStyle}></AiOutlineDownload></a>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

        </div>
   
    );
}
