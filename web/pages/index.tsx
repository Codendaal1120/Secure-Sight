import CameraViewer from "components/CameraViewer";
import { NextPage } from "next";
import React, { useEffect, useState } from "react";
import { api } from "services/api";

//console.log('here2', process.env.NEXT_PUBLIC_DB_HOST);

interface Camera {
  id: string;
  name: string;
}


const HomePage: NextPage = () => {

  const [cameras, setCameras] = useState<Camera[]>([]);

  useEffect(() => {
    api.get("/api/cameras").then((res) => {
      const cameras = res.data.map((camera: Camera) => {
        return {
          id: camera.id,
          name: camera.name,
        };
      });
      setCameras(cameras);
    });
  }, []);
  
  return (
    <div className="container">
      {/* <div className="container h-screen">
        <div className="flex flex-col items-center gap-4">
          <CameraViewer cameraName={"TEST1"} ></CameraViewer>
          <CameraViewer cameraName={"TEST2"} ></CameraViewer>
        </div>
      </div>
       */}
       <div>{cameras.length}</div>

       <section className="cameras">
        <CameraViewer cameraName={"TEST1"} ></CameraViewer>
        <CameraViewer cameraName={"TEST2"} ></CameraViewer>
        <CameraViewer cameraName={"TEST3"} ></CameraViewer>
        <CameraViewer cameraName={"TEST4"} ></CameraViewer>
        <CameraViewer cameraName={"TEST5"} ></CameraViewer>
        <CameraViewer cameraName={"TEST6"} ></CameraViewer>
        <CameraViewer cameraName={"TEST7"} ></CameraViewer>
       </section>
        
    </div>
  );
};

export default HomePage;
