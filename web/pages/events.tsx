import React, { useEffect, useState } from "react";
import { useLocation, useSearchParams, useParams  } from "react-router-dom";
import { API, CameraEvent, PaginatedResults } from "services/api";
import moment from 'moment';
import dynamic from 'next/dynamic'
import { AiOutlineDownload, AiFillPlayCircle } from "react-icons/ai";
import { FaTrash } from "react-icons/fa";
import { Notifier } from "../components/Notifier";
import QuestionModal from "components/QuestionModal";
import classNames from "classnames";

const DynamicRecordingPlayer = dynamic(
	() => import('../components/RecordingPlayer'),
	{ ssr: false }
	)  

const pageStyle = {
	padding: '30px'
}

function secondsToTime(sec:number): string{

	var time = '';

	if (sec >= 3600){
		var hours = Math.floor(sec / 3600);
		time += `${hours}h `;
		sec = sec - (hours * 3600);
	}

	if (sec >= 60){
		var min = Math.floor(sec / 60);
		sec = sec - (min * 60);
		time += `${min}m `;   
	}

	if (sec <= 3600){
		time += `${sec}s`;  
	}

	return time.trim();
}

function formatDateTime(date:Date): string {

	// var dt = Date.parse(date);
	// var now = Date.now();
	// if (now.valueOf() - dt.valueOf() > 60 * 60 )

	
	return moment(date).local().fromNow();

}

export default function EventsPage() {

	const [recordings, setRecordings] = useState<PaginatedResults<CameraEvent>>();
	const [selected, setSelected] = useState<CameraEvent>();
	const [openModal, setOpenModal] = useState(false);
	const [toBeDeleted, setToBeDeleted] = useState<CameraEvent>();
	const [isOpen, setIsOpen] = useState(false);
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [eventFilter, setEventFilter] = useState<string|null>(null);
	const [prevHover, setPrevHover] = useState(false);
	const [nextHover, setNextHover] = useState(false);
	
	useEffect(() => {
		if (document != null){	
			const searchParams = new URLSearchParams(document.location.search);
			const ev = searchParams.get('event');
			if (ev != eventFilter){
				setEventFilter(ev);
			}			
		}
	})

	useEffect(() => {
		fetcRecordings(currentPage);
	}, [currentPage, eventFilter]);

	const fetcRecordings = (page:number) =>{	
		API.getEvents(page, eventFilter).then((tryGet) => {
			if (tryGet.success){
				setRecordings(tryGet.payload!);
			}
			else{
				Notifier.notifyFail(`Unable to get recordings: ${tryGet.error}`);
			}
		})
	}

	const cancelPromptModal = () =>{
		setToBeDeleted(undefined);
		setOpenModal(false);
	}

	const confirmPromptModal = () =>{
		setOpenModal(false);
		if (toBeDeleted){
			API.delEvent(toBeDeleted).then((tryGet) => {
				if (tryGet.success){
					Notifier.notifySuccess(`Event deleted`);
					fetcRecordings(currentPage);      
					setToBeDeleted(undefined);         
				}
				else{
					Notifier.notifyFail(`Unable to delete: ${tryGet.error}`);
				}
			})
		} 
	}

	const openModalPrompt = (item: CameraEvent) => {
		setOpenModal(true);
		setToBeDeleted(item);
	}
	
	const openModalPlayer = (item: CameraEvent) => {
		if (item.fileIsValid){
			setIsOpen(true);
			setSelected(item);
		}
		else{
			Notifier.notifyFail('Recording file cannot be found on server');
		}		
	}

	const fetcNext = () =>{
		if (recordings?.paging.hasNext ){
			setCurrentPage(currentPage + 1);
		}        
	}

	const fetcPrev = () =>{
		if (recordings?.paging.hasPrev ){
			setCurrentPage(currentPage - 1);
		}        
	}

	const nextOnMouseOver = () =>{
		setNextHover(true);
	}

	const nextOnMouseLeave = () =>{
		setNextHover(false);
	}

	const prevOnMouseOver = () =>{
		setPrevHover(true);
	}

	const prevOnMouseLeave = () =>{
		setPrevHover(false);
	}
	 
	const nextButtonStyle = {
		color: recordings?.paging.hasNext 
			? !nextHover ? '#f9fafb' : '#71717a'
			: '#A7A6A8',
		background: recordings?.paging.hasNext 
			? !nextHover ? '#3DA5D9' : '#BBD686' 
			: '#d1d5db',       
		cursor : recordings?.paging.hasNext  ? 'pointer' : 'default'
	}

	const prevButtonStyle = {
		color: recordings?.paging.hasPrev 
			? prevHover ? '#71717a' : '#f9fafb'
			: '#A7A6A8',
		background: recordings?.paging.hasPrev 
			? prevHover ? '#BBD686' : '#3DA5D9'
			: '#d1d5db',       
		cursor : recordings?.paging.hasPrev  ? 'pointer' : 'default'
	}

	const clickableStyle = {
		cursor  : 'pointer',
	}

	const dwnlIconStyle = {        
		fill : '#276EB5'
	}

	const playIconStyle = {        
		fill : '#00B712'
	}

	const delIconStyle = {        
		fill : '#dc2626'
	}

	const getDownloadLink = (item: CameraEvent) => {
		return `${process.env.NEXT_PUBLIC_API}/api/recordings/${item.recordingId}/download`;
	}

	return (
		<div id="main" className="container" style={pageStyle}>
			<QuestionModal confirmModal={confirmPromptModal} cancelModal={cancelPromptModal} isOpen={openModal} modalText={"Are you sure you want to delete this event? \r\nThis action cannot be undone."}></QuestionModal>
			<DynamicRecordingPlayer key={selected?.id} recordingId={selected?.recordingId} signalClose={setIsOpen} isOpen={isOpen}></DynamicRecordingPlayer>
			<h2 className={"text-xl font-semibold leading-9 text-gray-900 dark:text-gray-500 pl-2"}>Events</h2>
			<p className={"mt-1 text-sm leading-6 text-gray-400 dark:text-gray-400 pb-5 pl-2"}>
					Events created from human detectoins.
			</p>
			
			<div className="relative overflow-x-auto shadow-md sm:rounded-lg">
				<table className="w-full text-sm text-left dark:text-gray-400 text-gray-300 ">
					<thead className="text-xs uppercase dark:bg-gray-700 bg-gray-300 dark:text-gray-400 text-gray-600">
						<tr>
							<th scope="col" className="px-6 py-3">
								Play
							</th>
							<th scope="col" className="px-6 py-3">
								Camera
							</th>
							<th scope="col" className="px-6 py-3">
								Method
							</th>
							<th scope="col" className="px-6 py-3">
								FileName
							</th>
							<th scope="col" className="px-6 py-3">
								Occured on
							</th>
							<th scope="col" className="px-6 py-3">
								Date
							</th>
							<th scope="col" className="px-6 py-3">
								Duration
							</th>
							<th scope="col" className="px-6 py-3">
								Download
							</th>
							<th scope="col" className="px-6 py-3">
								Delete
							</th>
						</tr>
					</thead>
					<tbody>
						{recordings?.collection.map((evt) => (                            
							<tr key={evt.id} className="bg-white dark:bg-gray-600 border-gray-700 dark:hover:bg-gray-500 hover:bg-gray-200 dark:text-white text-gray-500 border-b border-gray-200 ">                                
								<td className="px-6 py-4 text-right" style={clickableStyle} onClick={() => openModalPlayer(evt)}>
									<AiFillPlayCircle style={playIconStyle} size={20} className={classNames({"red": !evt.fileIsValid})}></AiFillPlayCircle>
								</td>
								<td className="px-6 py-4">
									{evt.cameraName}
								</td>
								<td className="px-6 py-4">
									{evt.detectionMethod}
								</td>
								<td className="px-6 py-4">
									{evt.recording}
								</td>
								<td className="px-6 py-4">
									{ formatDateTime(evt.startedOn) }
								</td>
								<td className="px-6 py-4">
										{ moment(evt.startedOn).local().format('LLL') }
								</td>
								<td className="px-6 py-4">
									{ secondsToTime(evt.duration) }
								</td>
								<td className="px-6 py-4 text-right" style={clickableStyle}>                                    
									<a href={getDownloadLink(evt)} download><AiOutlineDownload className={classNames({"red": !evt.fileIsValid})} size={20} style={dwnlIconStyle}></AiOutlineDownload></a>
								</td>
								<td className="px-6 py-4 text-right" style={clickableStyle} onClick={() => openModalPrompt(evt)}>
									<FaTrash style={delIconStyle} size={20}></FaTrash>
								</td>
							</tr>
						))}
					</tbody>
				</table>

				<div className="flex flex-col items-center px-6 py-4">
					<span className="text-sm text-gray-700 dark:text-gray-400">Showing <span className="font-semibold text-gray-900 dark:text-white">
						{recordings?.paging.rangeStart}</span> to <span className="font-semibold text-gray-900 dark:text-white">
						{recordings?.paging.rangeEnd}</span> of <span className="font-semibold text-gray-900 dark:text-white">
							{recordings?.paging.total}</span> Recordings
					</span>
					<div className="inline-flex mt-2 xs:mt-0">
						<button
							onMouseOver={prevOnMouseOver}
							onMouseLeave={prevOnMouseLeave}
							onClick={fetcPrev}
							style={prevButtonStyle}
							className="flex items-center justify-center px-3 h-8 text-sm font-medium text-white rounded-l dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
							Prev
						</button>
						<button 
							onClick={fetcNext}
							onMouseOver={nextOnMouseOver}
							onMouseLeave={nextOnMouseLeave}
							style={nextButtonStyle}
							className="flex items-center justify-center px-3 h-8 text-sm font-medium border-0 border-l border-gray-500 rounded-r dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
							Next
						</button>
					</div>
				</div>
			</div>

		</div>   
	);
}
