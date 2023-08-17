import React, { useEffect, useRef, useState } from "react";
import { API, Recording } from "services/api";
import moment from 'moment';
import classNames from "classnames";
import { Socket, io } from 'socket.io-client';
import { DefaultEventsMap } from '@socket.io/component-emitter';
import JSMpegWritableSource from './JSMpegWritableSource'
import JSMpeg from '@seydx/jsmpeg/lib/index.js';

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

export default function RecordingsPage() {

    const [recordings, setRecordings] = useState<Recording[]>([]);
    const streamCanvasRef = useRef<HTMLCanvasElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);
    const [socket, setSocket] = useState<Socket<DefaultEventsMap, DefaultEventsMap>>();

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

    useEffect(() => {
        if (!socket){
          startSocket();
        }
    
        if (open){
          socket?.connect();
        }
        else{
          socket?.disconnect();
        }
    }, [open]);

    const startSocket = () =>{

        // create player
        const player = new JSMpeg.Player(null, {
          source: JSMpegWritableSource,
          canvas: streamCanvasRef.current,
          audio: true,
          pauseWhenHidden: false,
          videoBufferSize: 1024 * 1024
        });
    
        // Start socket
        const s = io(process.env.NEXT_PUBLIC_API!, {  });
        //console.log('Created socket', s.id);
        s.disconnect();    
    
        s?.on(`${cameraId}-stream`, async (data) => {
          //console.log('--stream2', player);      
          player.source.write(data);
        }); 
    
        setSocket(s);
      }

    const closeModal = () => {
        setOpen(false);    
      }
    
      const openModal = () => {
        setOpen(true);
      }

    return (
        <div id="main" className="container" style={pageStyle}>

            <div className={classNames({
                "overlay": true, 
                "visible": open, 
                })} onClick={closeModal} ref={overlayRef}>        
            
            </div>   
            
            <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
                <table className="w-full text-sm text-left text-gray-400">
                    <thead className="text-xs uppercase bg-gray-700 text-gray-400">
                        <tr>
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
                            <tr className="bg-gray-600 border-gray-700 hover:bg-gray-500 text-white" onClick={openModal}>
                                <th scope="row" className="px-6 py-4 font-medium whitespace-nowrap ">
                                {rec.fileName}
                                </th>
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
