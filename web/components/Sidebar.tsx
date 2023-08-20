import React, { useState } from "react";
import classNames from "classnames";
import Link from "next/link";
import Image from "next/image";
import { defaultNavItems, NavItem } from "./DefaultNavItems";
import { HiChevronDoubleLeft, HiChevronDoubleRight } from "react-icons/hi";

import logo_big from "../public/logo.svg";
import logo_small from "../public/logo-small.svg";

type Props = {
  collapsed: boolean;
  navItems?: NavItem[];
  setCollapsed(collapsed: boolean): void;
  shown: boolean;
};

const Sidebar = ({
  collapsed,
  navItems = defaultNavItems,
  shown,
  setCollapsed,
}: Props) => {

  const Icon = collapsed ? HiChevronDoubleRight : HiChevronDoubleLeft;

  const sideBarStyle = {
    background: '#3DA5D9',
  }

  const logoStyle = {
    height:  collapsed ? '30px' : '60px'
  }
 
  return (
    <div
      style={sideBarStyle}
      className={classNames({
        "bg-gray-800" : false,
        "sidebar":true,
        "text-zinc-50 fixed md:static md:translate-x-0 z-20": true,
        "transition-all duration-300 ease-in-out": true,
        "w-[250px]": !collapsed,
        "w-16": collapsed,
        "-translate-x-full": !shown,
      })}
    >
      <div className={classNames({ "flex flex-col justify-between h-screen sticky inset-0 w-full": true })}>
        <div
          className={classNames({
            "logo-wrapper":true,
            "flex items-center border-b transition-none":true,
            "p-4 justify-between": !collapsed,
            "py-4 justify-center": collapsed,
          })}
        >
          <Image style={logoStyle} className={'logo'} src={ collapsed ? logo_small : logo_big } alt="Secure Sight" />
          <button
           
            className="sidebar-item grid place-content-center w-10 h-10 rounded-full opacity-0 md:opacity-100"
            onClick={() => setCollapsed(!collapsed)}>
            
              <Icon className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-grow">
          <ul
            className={classNames({
              "my-2 flex flex-col gap-2 items-stretch": true,
            })}
          >
            {navItems.map((item, index) => {
              return (
                <li
                  key={index}
                  className={classNames({
                    "sidebar-item": true,
                    "text-slate-100 flex": true, //colors
                    "transition-colors duration-300": true, //animation
                    "rounded-md p-2 mx-3 gap-4 ": !collapsed,
                    "rounded-full p-2 mx-3 w-10 h-10": collapsed,
                  })}>
                  <Link href={item.href} className="flex gap-2">
                    {item.icon} <span>{!collapsed && item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className={classNames({ "grid place-content-stretch p-4 ": true, })}>
        </div>
      </div>
    </div>
  );
};
export default Sidebar;
