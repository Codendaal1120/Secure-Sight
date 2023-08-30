// inspired from https://tailwind-elements.com/docs/standard/forms/timepicker/
import { useState } from 'react'

interface Props {
  items: CycleItem[];
  onChange: Function
}

export interface CycleItem{
  name: string
}

export default function CyclePicker({ items, onChange } : Props) {
  const [selected, setSelected] = useState(0);

  const cycle = (amnt:number) =>{
    let i = selected + amnt;
    if (i >= items.length){
      i = 0;
    }

    if (i < 0){
      i = items.length - 1;
    }    
    setSelected(i);      
    onChange(items[i]);
  }

  return (
    <div className="relative h-full w-5 cursor-pointer select-none ">
        <div className="h-2 w-full flex justify-center items-center opacity-30 hover:opacity-100 transition-all duration-200 ease-[ease] " onClick={() => cycle(1)}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5  text-cyan-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5"></path>
          </svg>
        </div>
      <label className='leading-4 text-gray-700'>{items[selected].name}</label>
      <div className="h-2 w-full flex justify-center items-center opacity-30 hover:opacity-100 transition-all duration-200 ease-[ease]" onClick={() => cycle(-1)}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5  text-cyan-400">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"></path>
        </svg>
      </div>
    </div>
  )
}
