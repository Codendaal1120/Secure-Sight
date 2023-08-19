import { useRef, useEffect, useState } from 'react';
import classNames from "classnames";
import JSMpegWritableSource from './JSMpegWritableSource'
import JSMpeg from '@seydx/jsmpeg/lib/index.js';
import { Socket, io } from 'socket.io-client';
import { DefaultEventsMap } from '@socket.io/component-emitter';

import { Recording } from "services/api";
import ReactPlayer from 'react-player';


interface Props {
    recording: Recording | undefined,
    signalClose: Function,
    isOpen: boolean
//   recordignId: string;
//   start: Function;
}


function RecordingPlayer ({ recording, signalClose, isOpen } : Props) { 
    const streamCanvasRef = useRef<HTMLCanvasElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);

    //const [socket, setSocket] = useState<Socket<DefaultEventsMap, DefaultEventsMap>>();
    const [url, setUrl] = useState<string>();
    //const [playing, setPlaying] = useState<Recording>();
    const isLoading = false;
    //const [open, setOpen] = useState(false);

    // shouldComponentUpdate(nextProps, nextState) {
    //     return this.state.someValue !== nextState.someValue;
    // }

    // useEffect(() => {    
    //     console.log('recording', recording);
    //      // if (!recording){
    //      //  //   console.log('çlosing');
             
    //      //     setOpen(false);
    //      //     return;
    //      // }
    //      // setOpen(true);
    //  }, [recording]);

    // useEffect(() => {    
    //     console.log('recording2', recording);
    //      // if (!recording){
    //      //  //   console.log('çlosing');
             
    //      //     setOpen(false);
    //      //     return;
    //      // }
    //      // setOpen(true);
    //  }, [isOpen]);

    useEffect(() => {    

        // if (playing){
        //     console.log('playing', playing);
        //     //startSocket();
        // }
       
        // if (!recording){
        //  //   console.log('çlosing');
            
        //     setOpen(false);
        //     return;
        // }
        // setOpen(true);
    }, []);


    useEffect(() => {    

        if (recording?.id != null){
            setUrl(`${process.env.NEXT_PUBLIC_API}/api/recordings/${recording.id}/file`);
        }
        
        if (isOpen){
            //console.log('starting socket', socket);
            //startSocket();
            //socket?.connect();
        }
        else{
            //socket?.disconnect();
            //socket?.removeAllListeners();
        }
    }, [isOpen]);

    // const startSocket = () =>{

    //     if (!playing){
    //         return;
    //     }

    //     // create player
    //     const player = new JSMpeg.Player(null, {
    //       source: JSMpegWritableSource,
    //       canvas: streamCanvasRef.current,
    //       audio: false,
    //       pauseWhenHidden: true,
    //       videoBufferSize: 1024 * 1024
    //     });
    
    //     // Start socket
    //     const s = io(process.env.NEXT_PUBLIC_API!, {  });
    //     //console.log('Created socket', s.id);
    //     //s.disconnect();    
    
    //     s?.on(`${playing.id}-stream`, async (data) => {
    //       //console.log('--stream2');      
    //       player.source.write(data);
    //     }); 
    
    //     setSocket(s);
    // }

    const closeModal = () => {
        console.log('close modal');
        signalClose(false);
        //setOpen(false);    
        //recording = undefined;   
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

    const spinnerStyle = {
        width: '1280px',
        height: '720px',
        position: 'absolute' as const, 
        left: '25%',
        top: '15%',
        zIndex: 11
    }

      return (
        <div id="main" className="container" style={containerStyle}>
            <div className={classNames({
                "overlay": true, 
                "visible": isOpen, 
                })} onClick={closeModal} ref={overlayRef}>
                <ReactPlayer style={streamStyle} 
                // className={classNames({"stream": true, "hidden": !isOpen, "visible": isOpen, })} 
                url={url} controls={true} />
            </div>   
            {/* <div id="cover-spin" className={classNames({"hidden": !isOpen, "visible": isOpen && !isLoading })} style={spinnerStyle} /> */}
            {/* <canvas className={classNames({"stream": true, "hidden": !isOpen, "visible": isOpen, })} ref={streamCanvasRef} style={streamStyle} />  */}
            
        </div>
   
    );
}

export default RecordingPlayer;