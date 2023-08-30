import CyclePicker, { CycleItem } from './CyclePicker';

interface Props {
  timeValue: TimeValue
}

export interface TimeValue{
  id:string,
  hours:string,
  minutes:string,
}

let hours: CycleItem[] = []
let minutes: CycleItem[] = []

export default function TimePicker({ timeValue } : Props) {

  for (let i = 0; i < 24; i++) {
    let n = i < 10 ? `0${i}` : `${i}`;
    hours.push({ name: n }  );    
  }

  for (let i = 0; i < 61; i++) {
    let n = i < 10 ? `0${i}` : `${i}`;
    minutes.push({ name: n }  );    
  }

  const hoursChanged = (h:CycleItem) =>{
    timeValue.hours = h.name;
  }

  const minutesChanged = (m:CycleItem) =>{
    timeValue.minutes = m.name;
  }

  return (
    <div className="grid grid-cols-5 gap-x-2 rounded-md border-0 shadow-sm ring-1 ring-inset ring-gray-300 p-3">
      <CyclePicker items={hours} onChange={hoursChanged}></CyclePicker>
      <span className='pt-2 text-gray-600 font-semibold select-none '>h</span>
      <CyclePicker items={minutes} onChange={minutesChanged}></CyclePicker>
      <span className='pt-2 text-gray-600 font-semibold select-none '>m</span>
    </div>
   
  )
}