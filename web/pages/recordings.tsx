//import CameraViewer from "components/layout/CameraViewer";
import { Button } from "@mui/material";
import { NextPage } from "next";
import React, { useState } from "react";
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';

const style = {
  position: 'absolute' as 'absolute',
  // top: '50%',
  // left: '50%',
  // transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

interface Recording {
  id: string;
  path: string;
}

export default function RecordingsPage() {

  const [recordings, setRecordings] = useState<Recording[]>([]);

  // useEffect(() => {
  //   api.get("/api/cameras").then((res) => {
  //     const cameras = res.data.map((camera: Recording) => {
  //       return {
  //         id: camera.id,
  //         name: camera.name,
  //       };
  //     });
  //     setCameras(cameras);
  //   });
  // }, []);

  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  //const handleClose = () => setOpen(false);
  const handleClose = () => {
    console.log('close');
    setOpen(false);
    // if (reason && reason == "backdropClick") 
    //     return;
    // myCloseModal();
}

  return (
    <div className="relative overflow-x-auto">
      <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                  <th scope="col" className="px-6 py-3">
                      Product name
                  </th>
                  <th scope="col" className="px-6 py-3">
                      Color
                  </th>
                  <th scope="col" className="px-6 py-3">
                      Category
                  </th>
                  <th scope="col" className="px-6 py-3">
                      Price
                  </th>
              </tr>
          </thead>
          <tbody>
              <tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                  <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                      Apple MacBook Pro 17"
                  </th>
                  <td className="px-6 py-4">
                      Silver
                  </td>
                  <td className="px-6 py-4">
                      Laptop
                  </td>
                  <td className="px-6 py-4">
                      $2999
                  </td>
              </tr>
              <tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                  <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                      Microsoft Surface Pro
                  </th>
                  <td className="px-6 py-4">
                      White
                  </td>
                  <td className="px-6 py-4">
                      Laptop PC
                  </td>
                  <td className="px-6 py-4">
                      $1999
                  </td>
              </tr>
              <tr className="bg-white dark:bg-gray-800">
                  <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                      Magic Mouse 2
                  </th>
                  <td className="px-6 py-4">
                      Black
                  </td>
                  <td className="px-6 py-4">
                      Accessories
                  </td>
                  <td className="px-6 py-4">
                      $99
                  </td>
              </tr>
          </tbody>
      </table>
  </div>
  );
}
