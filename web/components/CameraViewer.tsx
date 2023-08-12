import { useRef, useEffect, useState } from 'react';
import {Box, Typography, Modal } from '@mui/material';

interface Props {
  cameraName: string;
//   cameraUrl: string;
//   camera : Camera;
}

export interface Camera {
  id :string;
  name :string;
  url :string;
}

const drawStyle = {
    // width: '640px',
    // height: '360px',    
  };

  const style = {
    position: 'absolute' as 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    // bgcolor: 'background.paper',
    background : 'black',
    // border: '2px solid #000',
    boxShadow: 24,
    p: 4,
  };

function CameraViewer ({ cameraName } : Props) {

  const ref = useRef(null);
  const [open, setOpen] = useState(false);
  const click = () => {
    console.log(cameraName, 'click');

    if (document.activeElement != ref.current) {
      setOpen(!open);
    }
}

  const handleClose = () => {
    console.log('close');
    setOpen(false);
}

  useEffect(() => {
 

  //}, [camera.id, drawCanvas, ioClient]);
    }, []);

  return (

    <div className='cam-wrapper' onClick={click} style={drawStyle}>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <div ref={ref} style={style} >HELLO</div>
        {/* <Box sx={style}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Text in a modal
          </Typography>
          <Typography id="modal-modal-description" sx={{ mt: 2 }}>
            Duis mollis, est non commodo luctus, nisi erat porttitor ligula.
          </Typography>
        </Box> */}
      </Modal>
    </div>      
  )


    function mapRange (value : number, inMin : number, inMax: number, outMin: number, outMax: number) {
    value = (value - inMin) / (inMax - inMin);
    return outMin + value * (outMax - outMin);
    }
}

export default CameraViewer;