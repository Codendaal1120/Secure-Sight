import { useRef, useEffect, useState } from 'react';
import classNames from "classnames";
import JSMpegWritableSource from './JSMpegWritableSource'
import JSMpeg from '@seydx/jsmpeg/lib/index.js';
import { Socket, io } from 'socket.io-client';
import { DefaultEventsMap } from '@socket.io/component-emitter';
import { BsRecordCircleFill } from "react-icons/bs";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Recording } from "services/api";


interface Props {
    recording: Recording | undefined
//   recordignId: string;
//   start: Function;
}


function RecordingPlayer ({ recording } : Props) { 
    const streamCanvasRef = useRef<HTMLCanvasElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);

    const [socket, setSocket] = useState<Socket<DefaultEventsMap, DefaultEventsMap>>();
    const [open, setOpen] = useState(false);

    // shouldComponentUpdate(nextProps, nextState) {
    //     return this.state.someValue !== nextState.someValue;
    // }

    useEffect(() => {    
        console.log('recording', recording);
        if (!recording){
            setOpen(false);
            return;
        }
        setOpen(true);
    }, [recording]);


    useEffect(() => {    
        if (open){
            //startSocket();
            socket?.connect();
        }
        else{
            socket?.disconnect();
            socket?.removeAllListeners();
        }
    }, [open]);

    const startSocket = () =>{

        // if (!selected){
        //     return;
        // }

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
    
        // s?.on(`${selected.id}-stream`, async (data) => {
        //   //console.log('--stream2', player);      
        //   player.source.write(data);
        // }); 
    
        setSocket(s);
    }

    const closeModal = () => {
        setOpen(false);    
        recording = undefined;   
    }
    
    const openModal = () => {
        setOpen(true);
        //setSelected(item);
    }

    const containerStyle = {
    }

    const streamStyle = {
        border : '1px solid #565555',
        boxShadow: '1px 2px 9px #545452',
        background: 'black',
        zIndex: 10,
        width: '1280px',
        height: '720px',
        position: 'absolute' as const, 
        left: '25%',
        top: '15%',
      };

      return (
        <div id="main" className="container" style={containerStyle}>
            <div className={classNames({
                "overlay": true, 
                "visible": open, 
                })} onClick={closeModal} ref={overlayRef}>
            </div>   
            <canvas className={classNames({"stream": true, "hidden": !open, "visible": open, })} ref={streamCanvasRef} style={streamStyle} /> 

        </div>
   
    );
}

export default RecordingPlayer;