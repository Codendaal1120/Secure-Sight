import React, { useEffect, useState } from "react";
import { useForm } from 'react-hook-form'
import { API, Config } from "services/api";
import { Notifier } from "components/Notifier";

export default function ConfigPage() {

  const [hover, setHover] = useState('none');
  const [config, setConfig] = useState<Config>();

  useEffect(() => {    
    getConfig();
  }, []); 

  useEffect(() => {
    reset(config);
  }, [config]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Config>({
    mode: 'all',  
  });

  const getConfig = async()=> {
    let c = await API.getConfig();
    if (c){
      setConfig(c);
    }
  }

  const onMouseOver = (item:string) =>{
		setHover(item);
	}

	const okOnMouseLeave = () =>{
    setHover('none');
	}

  const onCancel = async () => {
    await getConfig();
  }

  const onSubmit = async(data: Config) => {
    let c = await API.saveConfig(data);
    if (c.success){
      setConfig(c.payload!);
      Notifier.notifySuccess('Config saved');
    }
    else{
      Notifier.notifyFail(c.error!);
    }    
  }

  const okButtonStyle = {
    background: hover == 'submit' ? '#BBD686' : '#3DA5D9'  
  }

  return (
    <div className="container mx-auto max-w-7xl py-12 sm:px-6 lg:px-8" >
      <form onSubmit={handleSubmit(onSubmit)} >
        <div className="space-y-12">

          {/* General */}
          <div className="border-b border-gray-900/10 pb-12">
            <h2 className={"text-base font-semibold leading-7 text-gray-900 dark:text-gray-500"}>General</h2>

            <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 content-start">
              <div className="sm:col-span-2 ">
                <label className="block text-sm leading-6 text-gray-400">
                  Indicate if files created temporarily should be deleted.
                </label>
              </div>
              <div className="sm:col-span-1">
                <label htmlFor="removeTempFiles" className="block text-sm font-medium leading-6 text-gray-900">
                  Remove temp files
                </label>
                <div className="mt-2">
                  <input  
                    id="removeTempFiles" 
                    {...register('removeTempFiles')}
                    type="checkbox" 
                    value="" 
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"></input>
                </div>
              </div>              
            </div>

            <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 content-start">
              <div className="sm:col-span-2 ">
                <label className="block text-sm leading-6 text-gray-400">
                  The amount of seconds to buffer, this also affects the maximum recording time.
                </label>
              </div>
              <div className="sm:col-span-1">
                <label htmlFor="cameraBufferSeconds" className="block text-sm font-medium leading-6 text-gray-900">
                  Buffer seconds
                </label>
                <div className="mt-2">
                  <input
                    type="number"
                    id="cameraBufferSeconds"
                    {...register('cameraBufferSeconds', { min: 30, max: 1200 })}
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-cyan-500 sm:text-sm sm:leading-6"
                  />
                  {errors.cameraBufferSeconds && (
                    <p className="text-xs italic text-red-500">Camera buffer seconds needs to be between 30 and 1200 (20 minutes)</p>
                  )}
                </div>
              </div>              
            </div>

          </div>

          {/* Notifications */}
          <div className="border-b border-gray-900/10 pb-12">
            <h2 className={"text-base font-semibold leading-7 text-gray-900 dark:text-gray-500"}>Notifications</h2>
            <p className={"mt-1 text-sm leading-6 text-gray-400 dark:text-gray-400"}>
              The following section contains config related to the alert notifications.
            </p>

            <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 content-start">
              <div className="sm:col-span-2 ">
                <label className="block text-sm leading-6 text-gray-400">
                  The SendGrid API Key. See <a className="font-medium text-blue-600 dark:text-blue-500 hover:underline" href="https://docs.sendgrid.com/ui/account-and-settings/api-keys">Sendgrid</a> for more information.
                </label>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="notifications.email.providerApiKey" className="block text-sm font-medium leading-6 text-gray-900">
                  API key
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    id="notifications.email.providerApiKey"
                    {...register('notifications.email.providerApiKey', { required: true, minLength: 30 })}
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-cyan-500 sm:text-sm sm:leading-6"
                  />
                  {errors.notifications?.email?.providerApiKey && errors.notifications?.email?.providerApiKey.type === "required" && (
                    <p className="text-xs italic text-red-500">API key is required</p>
                  )}
                  {errors.notifications?.email?.providerApiKey && errors.notifications?.email?.providerApiKey.type === "minLength" && (
                    <p className="text-xs italic text-red-500">Invalid API key</p>
                  )}
                </div>
              </div>              
            </div>

            <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 content-start">
              <div className="sm:col-span-2 ">
                <label className="block text-sm leading-6 text-gray-400">
                  The recipient email address. This is where the alerts will be sent for each camera..
                </label>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="notifications.email.recipient" className="block text-sm font-medium leading-6 text-gray-900">
                  Recipient
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    id="notifications.email.recipient"
                    {...register('notifications.email.recipient', {  required: true, pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "invalid email addresszx"
                    } })}
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-cyan-500 sm:text-sm sm:leading-6"
                  />
                  {errors.notifications?.email?.recipient && errors.notifications?.email?.recipient.type === "pattern" && (
                    <p className="text-xs italic text-red-500">invalid email address</p>
                  )}
                </div>
              </div>              
            </div>

            <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 content-start">
              <div className="sm:col-span-2 ">
                <label className="block text-sm leading-6 text-gray-400">
                  The sender email address. This has to be configured as a sender in SendGrid, see <a className="font-medium text-blue-600 dark:text-blue-500 hover:underline" href="https://docs.sendgrid.com/glossary/sender-authentication">sender-authentication</a> for more information.
                </label>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="notifications.email.sender" className="block text-sm font-medium leading-6 text-gray-900">
                  Sender
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    id="notifications.email.sender"
                    {...register('notifications.email.sender', {  required: true, pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "invalid email addresszx"
                    } })}
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-cyan-500 sm:text-sm sm:leading-6"
                  />
                  {errors.notifications?.email?.sender && errors.notifications?.email?.sender.type === "pattern" && (
                    <p className="text-xs italic text-red-500">invalid email address</p>
                  )}
                </div>
              </div>              
            </div>

          </div>

          {/* Event */}
          <div className="">
            <h2 className={"text-base font-semibold leading-7 text-gray-900 dark:text-gray-500"}>Event Config</h2>
            <p className={"mt-1 text-sm leading-6 text-gray-400 dark:text-gray-400"}>
              The following section contains config related to the events resulting from the video analysis.
              An event is a aggregation of detections during a time span.
            </p>
            <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 content-start">
              <div className="sm:col-span-2 ">
                <label className="block text-sm leading-6 text-gray-400">
                  The number of seconds to wait before finishing and aggregating an event. If new detection occur before this time, the event will continue.
                </label>
              </div>
              <div className="sm:col-span-1">
                <label htmlFor="event.idleEndSeconds" className="block text-sm font-medium leading-6 text-gray-900">
                  Event idle seconds
                </label>
                <div className="mt-2">
                  <input
                    type="number"
                    id="event.idleEndSeconds"
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-cyan-500 sm:text-sm sm:leading-6"
                    {...register('event.idleEndSeconds', { min: 2, max: 20 })}
                  />
                  {errors.event?.idleEndSeconds && (
                    <p className="text-xs italic text-red-500">Event idle seconds needs to be between 2 and 10</p>
                  )}
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
                <label htmlFor="event.silenceSeconds" className="block text-sm font-medium leading-6 text-gray-900">
                  Event silence seconds
                </label>
                <div className="mt-2">
                  <input
                      type="number"
                      id="event.silenceSeconds"
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-cyan-500 sm:text-sm sm:leading-6"
                      {...register('event.silenceSeconds', { min: 1, max: 600 })}
                    />
                    {errors.event?.silenceSeconds && (
                      <p className="text-xs italic text-red-500">Event silence seconds needs to be between 1 and 600</p>
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
                <label htmlFor="event.limitSeconds" className="block text-sm font-medium leading-6 text-gray-900">
                  Event limit seconds
                </label>
                <div className="mt-2">
                  <input
                      type="number"                   
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-cyan-500 sm:text-sm sm:leading-6"
                      id="event.limitSeconds"
                      {...register('event.limitSeconds', { min: 1, max: 600 })}
                    />
                    {errors.event?.limitSeconds && (
                      <p className="text-xs italic text-red-500">Event limit seconds needs to be between 1 and 600</p>
                    )}
                </div>
              </div>              
            </div>

          </div>

          <div className="mt-6 flex items-center justify-end gap-x-6">
            <button 
              type="button" 
              onClick={onCancel}
              className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-200 sm:mt-0 sm:w-auto">
              Cancel
            </button>
            <button
              type="submit"
              onMouseOver={() => onMouseOver('submit')}
              onMouseLeave={okOnMouseLeave}
              style={okButtonStyle}
              className="rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">            
              Save
            </button>
          </div>  
        </div>
      </form>
    </div>
  );
}
