import { Fragment, useEffect, useRef, useState } from 'react'
import { Dialog, Transition, Combobox  } from '@headlessui/react'
import { BsChevronBarContract } from "react-icons/bs";
import { Camera } from 'services/api';
import { SubmitHandler, useForm } from 'react-hook-form'
import { FaTrash } from "react-icons/fa";
import moment from 'moment';
import ComboComponent from './ComboComponent';
import {
  Accordion,
  AccordionHeader,
  AccordionBody,
} from "@material-tailwind/react";

interface Props {
}


export default function TimePicker2({  } : Props) {
	const delIconStyle = {        
		fill : '#dc2626'
	}

	const addButtonStyle = {
        //background: hover == 'newSchedule' ? '#BBD686' : '#3DA5D9'  
    }

	//const onSubmit = (data: FormValues) => alert(JSON.stringify(data));

  return (
    <div>
      <ComboComponent></ComboComponent>
    </div>
   
  )
}