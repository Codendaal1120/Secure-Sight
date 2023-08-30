import { Fragment, useEffect, useRef, useState } from 'react'
import { Dialog, Transition, Combobox  } from '@headlessui/react'
import { BsChevronBarContract } from "react-icons/bs";
import { Camera } from 'services/api';
import { SubmitHandler, useForm } from 'react-hook-form'
import { FaTrash } from "react-icons/fa";
import moment from 'moment';
import {
  Accordion,
  AccordionHeader,
  AccordionBody,
} from "@material-tailwind/react";

interface Props {
}


export default function TimePicker({  } : Props) {
	const delIconStyle = {        
		fill : '#dc2626'
	}

	const addButtonStyle = {
        //background: hover == 'newSchedule' ? '#BBD686' : '#3DA5D9'  
    }

	//const onSubmit = (data: FormValues) => alert(JSON.stringify(data));

  return (
    // <div className="mt-2 p-5 w-40 bg-white">
    //     <div className="flex">
    //         <select name="hours" className="bg-transparent rounded-md border-0 shadow-sm ring-inset ring-gray-300 text-gray-900 text-xl appearance-none outline-none" >
    //             <option value="1">1</option>
    //             <option value="2">2</option>
    //             <option value="3">3</option>
    //             <option value="4">4</option>
    //             <option value="5">5</option>
    //             <option value="6">6</option>
    //             <option value="7">7</option>
    //             <option value="8">8</option>
    //             <option value="9">9</option>
    //             <option value="10">10</option>
    //             <option value="11">10</option>
    //             <option value="12">12</option>
    //         </select>
    //         <span className="text-xl mr-3">:</span>
    //         <select name="minutes" className="bg-transparent text-xl appearance-none outline-none mr-4" >
    //             <option value="0">00</option>
    //             <option value="30">30</option>
    //         </select>
    //         <select name="ampm" className="bg-transparent text-xl appearance-none outline-none" >
    //             <option value="am">AM</option>
    //             <option value="pm">PM</option>
    //         </select>
    //     </div>
    // </div>
    <div>
  <label id="listbox-label" className="block text-sm font-medium leading-6 text-gray-900">Assigned to</label>
  <div className="relative mt-2">
    <button type="button" className="relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm sm:leading-6" aria-haspopup="listbox" aria-expanded="true" aria-labelledby="listbox-label">
      <span className="flex items-center">
        <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="" className="h-5 w-5 flex-shrink-0 rounded-full">
        <span className="ml-3 block truncate">Tom Cook</span>
      </span>
      <span className="pointer-events-none absolute inset-y-0 right-0 ml-3 flex items-center pr-2">
        <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fill-rule="evenodd" d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.2a.75.75 0 011.06.04l2.7 2.908 2.7-2.908a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01.04-1.06z" clip-rule="evenodd" />
        </svg>
      </span>
    </button>

    <!--
      Select popover, show/hide based on select state.

      Entering: ""
        From: ""
        To: ""
      Leaving: "transition ease-in duration-100"
        From: "opacity-100"
        To: "opacity-0"
    -->
    <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm" tabindex="-1" role="listbox" aria-labelledby="listbox-label" aria-activedescendant="listbox-option-3">
      <!--
        Select option, manage highlight styles based on mouseenter/mouseleave and keyboard navigation.

        Highlighted: "bg-indigo-600 text-white", Not Highlighted: "text-gray-900"
      -->
      <li className="text-gray-900 relative cursor-default select-none py-2 pl-3 pr-9" id="listbox-option-0" role="option">
        <div className="flex items-center">
          <img src="https://images.unsplash.com/photo-1491528323818-fdd1faba62cc?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="" className="h-5 w-5 flex-shrink-0 rounded-full">
          <!-- Selected: "font-semibold", Not Selected: "font-normal" -->
          <span className="font-normal ml-3 block truncate">Wade Cooper</span>
        </div>

        <!--
          Checkmark, only display for selected option.

          Highlighted: "text-white", Not Highlighted: "text-indigo-600"
        -->
        <span className="text-indigo-600 absolute inset-y-0 right-0 flex items-center pr-4">
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
          </svg>
        </span>
      </li>

      <!-- More items... -->
    </ul>
  </div>
</div>
   
  )
}