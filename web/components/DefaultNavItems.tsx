import React from "react";
import { FiFilm, FiInfo, FiSettings } from "react-icons/fi";
import { GiCctvCamera } from "react-icons/gi";
import { LuLayoutDashboard } from "react-icons/lu";


// define a NavItem prop
export type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};
export const defaultNavItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/",
    icon: <LuLayoutDashboard className="w-6 h-6" />,
  },
  {
    label: "Recordings",
    href: "/recordings",
    icon: <FiFilm className="w-6 h-6" />,
  },
  {
    label: "Events",
    href: "/events",
    icon: <FiInfo className="w-6 h-6" />,
  },
  {
    label: "Cameras",
    href: "/cameras",
    icon: <GiCctvCamera className="w-6 h-6" />,
  },
  {
    label: "Config",
    href: "/config",
    icon: <FiSettings className="w-6 h-6" />,
  },
];
