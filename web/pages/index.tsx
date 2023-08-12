import CameraViewer from "components/layout/CameraViewer";
import { NextPage } from "next";
import React from "react";

console.log('here2', process.env.NEXT_PUBLIC_DB_HOST);

const HomePage: NextPage = () => {
  return (
    <div className="container">
      {/* <div className="container h-screen">
        <div className="flex flex-col items-center gap-4">
          <CameraViewer cameraName={"TEST1"} ></CameraViewer>
          <CameraViewer cameraName={"TEST2"} ></CameraViewer>
        </div>
      </div>
       */}
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
