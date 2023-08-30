import classNames from "classnames";
import React, { PropsWithChildren, useContext, useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import { SocketContext } from 'context/socket';
import { Notifier } from "./Notifier";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Layout = (props: PropsWithChildren) => {

  const [collapsed, setSidebarCollapsed] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const socket = useContext(SocketContext); 

  useEffect(() => {  
    socket.on(`test-sock`, async (data) => {
      console.log('test-from-socket-x', data);  
      Notifier.notifySuccess(data);         
    });    
    
    socket.on(`ui-info`, async (data) => { 
      Notifier.notifySuccess(data);         
    });    

    socket.on(`ui-error`, async (data) => {
      Notifier.notifyFail(data);         
    });    
  }, []);

  const layoutStyle = {
    // background : '#1F1F1F'
  }

  return (
    <div
      style={layoutStyle}
      className={classNames({
        "bg-gray-100" : true,
        "dark:bg-gray-900 " : true,
        "grid ": true,
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
        <ToastContainer />
        {props.children}
      </div>
    </div>
  );
};

export default Layout;
