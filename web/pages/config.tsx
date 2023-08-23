//import CameraViewer from "components/layout/CameraViewer";
import { Button } from "@mui/material";
import { NextPage } from "next";
import React, { useEffect, useState } from "react";
import classNames from "classnames";
import { Config } from "services/api";
import { useForm } from 'react-hook-form'
//import { TEInput, TERipple } from "tw-elements-react";



const formStyle = {
  padding : '30px'
};

const click = () => {
  //console.log('parent click');
}




const containerStyle = {
  padding : '10px'
};

export default function ConfigPage() {

  const config2:Config = {
    cameraBufferSeconds : 600,
    eventIdleEndSeconds : 7,
    eventSilenceSeconds : 180,
    eventLimitSeconds : 120
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    mode: 'all', 
    defaultValues: { 
      username : "def" ,
      eventIdleEndSeconds : 7,
      eventSilenceSeconds : 180,
      cameraBufferSeconds : 600,
      eventLimitSeconds : 120
    },
    
  })

  const [eventIdleEndSeconds, setEventIdleEndSeconds] = useState<Number>(0);
  const [config, setConfig] = useState<Config>({
    cameraBufferSeconds : 600,
    eventIdleEndSeconds : 7,
    eventSilenceSeconds : 180,
    eventLimitSeconds : 120
  }); 

  // useForm({
  //   defaultValues: {
  //     username: 'def',
  //     lastName: ''
  //   },
  //   mode : 'all'
  // })

  useEffect(() => {
    const config:Config = {
      cameraBufferSeconds : 600,
      eventIdleEndSeconds : 7,
      eventSilenceSeconds : 180,
      eventLimitSeconds : 120
    };
    
    setConfig(config);
      // API.getRecordings().then((tryGet) => {
      //     if (tryGet.success){
      //         setRecordings(tryGet.payload!);
      //     }
      //     else{
      //         Notifier.notifyFail(`Unable to get recordings: ${tryGet.error}`);
      //     }
      // })
  }, []);

  // https://tailwindcomponents.com/component/input-with-icon-and-validation-error
  function onEventSilenceSecondsChange(e:any) {
    if (!e.target.value){
      return;
    }
    setConfig({
      ...config!,
      eventSilenceSeconds : parseInt(e.target.value)
    });
  }

  //https://www.react-hook-form.com/api/useform/#mode

  function onEventIdleEndSecondsChange(e:any) {
    if (!e.target.value){
      return;
    }
    setConfig({
      ...config!,
      eventIdleEndSeconds : parseInt(e.target.value)
    });
  }

  function onEventLimitSecondsChange(e:any) {
    if (!e.target.value){
      return;
    }
    setConfig({
      ...config!,
      eventLimitSeconds : parseInt(e.target.value)
    });
  }

  function onCamBufferSecondsChange(e:any) {
    if (!e.target.value){
      return;
    }
    setConfig({
      ...config!,
      cameraBufferSeconds : parseInt(e.target.value)
    });
  }

  const onSubmit = (data) => {
    console.log('sibmit');
    // Do something with the form data
  }

  return (
    <div className="container mx-auto max-w-7xl py-12 sm:px-6 lg:px-8" >
      <form onSubmit={handleSubmit(onSubmit)} >
      <div className="space-y-12">

        {/* Event */}
        <div className="border-b border-gray-900/10 pb-12">
          <h2 className={"text-base font-semibold leading-7 text-gray-900 dark:text-gray-500"}>Event Config</h2>
          <p className={"mt-1 text-sm leading-6 text-gray-400 dark:text-gray-400"}>
            The following section contains config related to the events resulting from the video analysis.
            An event is a aggregation of detections during a time span.
          </p>

          <div className="input-wrapper flex flex-col">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            {...register('username', {
              required: 'Username is required',
              minLength: {
                value: 3,
                message: 'Username must be at least 3 characters',
              },
            })}
          />
          {errors.username && (
            <p className="text-xs italic text-red-500">{errors.username.message}</p>
          )}
        </div>

          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 content-start">
            <div className="sm:col-span-2 ">
              <label className="block text-sm leading-6 text-gray-400">
                The number of seconds to wait before finishing and aggregating an event. If new detection occur before this time, the event will continue.
              </label>
            </div>

            <div className="sm:col-span-1">
              <label htmlFor="last-name" className="block text-sm font-medium leading-6 text-gray-900">
                Event idle seconds
              </label>
              <div className="mt-2">
                <input
                  type="number"
                  id="eventIdleEndSeconds"
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  {...register('eventIdleEndSeconds', {
                    min: 2, max: 10,
                  })}
                />
                {errors.eventIdleEndSeconds && (
                  <p className="text-xs italic text-red-500">Event idle seconds needs to be between 2 and 10</p>
                )}
              </div>
            </div>              
          </div>

          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 content-start">

            <div className="sm:col-span-2 ">
              <label className="block text-sm leading-6 text-gray-400">
                The number of seconds an event can last, after this time has passed the event will automatically be finished and saved.
              </label>
            </div>

            <div className="sm:col-span-1">
              <label htmlFor="last-name" className="block text-sm font-medium leading-6 text-gray-900">
                Event silence seconds
              </label>
              <div className="mt-2">
                <input
                    type="number"
                    name="last-name"
                    id="last-name"
                    autoComplete="family-name"
                    value={config?.eventSilenceSeconds}
                    onChange={onEventSilenceSecondsChange}
                    min="5"
                    max="300"
                    required 
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
              </div>
            </div>
              
          </div>

          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 content-start">

            <div className="sm:col-span-2 ">
              <label className="block text-sm leading-6 text-gray-400">
                After an event has been finished new detections will be silenced for period of time.
              </label>
            </div>

            <div className="sm:col-span-1">
              <label htmlFor="last-name" className="block text-sm font-medium leading-6 text-gray-900">
                Event limit seconds
              </label>
              <div className="mt-2">
                <input
                    type="number"
                    name="last-name"
                    id="last-name"
                    autoComplete="family-name"
                    value={config?.eventLimitSeconds}
                    onChange={onEventLimitSecondsChange}
                    min="5"
                    max="300"
                    required 
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
              </div>
            </div>
              
          </div>

        </div>

        {/* Camera */}
        <div className="border-b border-gray-900/10 pb-12">
          <h2 className={"text-base font-semibold leading-7 text-gray-900 dark:text-gray-500"}>Camera Config</h2>
          <p className={"mt-1 text-sm leading-6 text-gray-400 dark:text-gray-200"}>
            The following section contains config related to the cameras as well as the config for each camera.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 content-start">
            <div className="sm:col-span-2 ">
              <label className="block text-sm leading-6 text-gray-400">
                The amount of seconds to buffer, this also affects the maximum recording time.
              </label>
            </div>

            <div className="sm:col-span-1">
              <label htmlFor="last-name" className="block text-sm font-medium leading-6 text-gray-900">
                Buffer seconds
              </label>
              <div className="mt-2">
                <input
                  type="number"
                  name="last-name"
                  id="last-name"
                  autoComplete="family-name"
                  value={config?.cameraBufferSeconds}
                  onChange={onCamBufferSecondsChange}
                  required 
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>              
          </div>

        </div>




        
      </div>

      <div className="mt-6 flex items-center justify-end gap-x-6">
        <button type="button" className="text-sm font-semibold leading-6 text-gray-900">
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
          Save
        </button>
      </div>

      
    </form>
      
      {/* <div className="gx tv abr cct ctg cxm"><div><h2 className="avy awg awq axv">Profile</h2><p className="ku awa awp axr">This information will be displayed publicly so be careful what you share.</p><dl className="lk aby acc acf afm afu awa awp"><div className="ave bxr"><dt className="awe axv bzd bzz cgw">Full name</dt><dd className="ku lx zf aai bwv bzy"><div className="axv">Tom Cook</div><button type="button" className="awg ayh blf">Update</button></dd></div><div className="ave bxr"><dt className="awe axv bzd bzz cgw">Email address</dt><dd className="ku lx zf aai bwv bzy"><div className="axv">tom.cook@example.com</div><button type="button" className="awg ayh blf">Update</button></dd></div><div className="ave bxr"><dt className="awe axv bzd bzz cgw">Title</dt><dd className="ku lx zf aai bwv bzy"><div className="axv">Human Resources Manager</div><button type="button" className="awg ayh blf">Update</button></dd></div></dl></div><div><h2 className="avy awg awq axv">Bank accounts</h2><p className="ku awa awp axr">Connect bank accounts to your account.</p><ul role="list" className="lk acc acf afm afu awa awp"><li className="lx zf aai ase"><div className="awe axv">TD Canada Trust</div><button type="button" className="awg ayh blf">Update</button></li><li className="lx zf aai ase"><div className="awe axv">Royal Bank of Canada</div><button type="button" className="awg ayh blf">Update</button></li></ul><div className="lx afm aft ave"><button type="button" className="awa awg awp ayh blf"><span aria-hidden="true">+</span> Add another bank</button></div></div><div><h2 className="avy awg awq axv">Integrations</h2><p className="ku awa awp axr">Connect applications to your account.</p><ul role="list" className="lk acc acf afm afu awa awp"><li className="lx zf aai ase"><div className="awe axv">QuickBooks</div><button type="button" className="awg ayh blf">Update</button></li></ul><div className="lx afm aft ave"><button type="button" className="awa awg awp ayh blf"><span aria-hidden="true">+</span> Add another application</button></div></div><div><h2 className="avy awg awq axv">Language and dates</h2><p className="ku awa awp axr">Choose what language and date format to use throughout your account.</p><dl className="lk aby acc acf afm afu awa awp"><div className="ave bxr"><dt className="awe axv bzd bzz cgw">Language</dt><dd className="ku lx zf aai bwv bzy"><div className="axv">English</div><button type="button" className="awg ayh blf">Update</button></dd></div><div className="ave bxr"><dt className="awe axv bzd bzz cgw">Date format</dt><dd className="ku lx zf aai bwv bzy"><div className="axv">DD-MM-YYYY</div><button type="button" className="awg ayh blf">Update</button></dd></div><div className="lx ave"><dt className="uo aug awe axv bzd" id="headlessui-label-2">Automatic timezone</dt><dd className="lx un yz zd"><button className="ajr lx sj xq ads aqx bbt bbx bcp ben bes bex boy boz bpb bpk" id="headlessui-switch-3" role="switch" type="button" tabindex="0" aria-checked="true" data-headlessui-state="checked" aria-labelledby="headlessui-label-2"><span aria-hidden="true" className="wb nw rx xh ads alo bbn bbt bcp bel bes bex"></span></button></dd></div></dl></div></div> */}
      {/* <h1></h1>
       <hr className="my-12 h-0.5 border-t-0 bg-neutral-100 opacity-100 dark:opacity-50"/> */}
      
    </div>
  );
}
