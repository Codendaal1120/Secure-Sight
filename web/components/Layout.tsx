import classNames from "classnames";
import React, { PropsWithChildren, useState } from "react";
import Sidebar from "./Sidebar";
const Layout = (props: PropsWithChildren) => {
  const [collapsed, setSidebarCollapsed] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

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
