import { useRef, useEffect, useState } from 'react';
import classNames from "classnames";
import { Recording } from "services/api";
import ReactPlayer from 'react-player';
interface Props {
    recording: Recording | undefined,
    signalClose: Function,
    isOpen: boolean
}

function RecordingPlayer ({ recording, signalClose, isOpen } : Props) { 
    const overlayRef = useRef<HTMLDivElement>(null);

    const [url, setUrl] = useState<string>();

    useEffect(() => {    
        if (recording?.id != null){
            setUrl(`${process.env.NEXT_PUBLIC_API}/api/recordings/${recording.id}/file`);
        }
    }, [isOpen]);

    const closeModal = () => {
        signalClose(false);
        isOpen = false;
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
        left: '37%',
        top: '20%',
        visibility: isOpen ? 'visible' as const :'hidden'  as const,        
      };

      return (
        <div id="main" className="container" style={containerStyle}>
            <div className={classNames({
                "overlay": true, 
                "visible": isOpen, 
                })} onClick={closeModal} ref={overlayRef}>
                
            </div>   
            <ReactPlayer style={streamStyle} 
            url={url} controls={true} />
            
        </div>
   
    );
}

export default RecordingPlayer;