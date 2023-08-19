import classNames from "classnames";
import React, { PropsWithChildren, useContext, useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import {  toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { SocketContext } from 'context/socket';

const Layout = (props: PropsWithChildren) => {

  const [collapsed, setSidebarCollapsed] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const socket = useContext(SocketContext);

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

  useEffect(() => {  
    socket.on(`test-sock`, async (data) => {
      console.log('test-from-socket-x', data);  
      notifySuccess(data);         
    });    
    
    socket.on(`ui-info`, async (data) => { 
      notifySuccess(data);         
    });    

    socket.on(`ui-error`, async (data) => {
      notifyFail(data);         
    });    
  }, []);

  const layoutStyle = {
    // background : '#1F1F1F'
  }

  return (
    <div
      style={layoutStyle}
      className={classNames({
        "grid bg-slate-800 ": true,
        "grid-cols-sidebar": !collapsed,
        "grid-cols-sidebar-collapsed": collapsed,
        "transition-[grid-template-columns] duration-300 ease-in-out": true,
      })}
    >
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setSidebarCollapsed}
        shown={showSidebar}
      />
      <div className={classNames({"collapsed": collapsed, "page-container" : true})}>
        {props.children}
      </div>
    </div>
  );
};

export default Layout;
