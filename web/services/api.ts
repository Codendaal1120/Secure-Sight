import { error } from "console";

export interface Camera {  
	id: string;
	name: string;
	url: string;
	snapshotUrl: string;
	snapshotType: string;
	transport: string;
	detectionMethod: string;
	videoProcessingEnabled: boolean;
	streamResolution: CamStreamConfig;
	eventConfig: CamEventConfig;	
}

export interface CamStreamConfig {
	width: number;
	height: number;
}

export interface CamEventConfig {
	recordEvents: boolean;
	schedule: CamEventSchedule[];
}

export interface CamEventSchedule {
	name: string; 
	ranges : CamEventScheduleRange[] | undefined;
}

export interface CamEventScheduleRange {
  triggerAlert: boolean,
	start: string;
	end: string;
}

export interface Recording {
	id: string;
	filePath: string;
	cameraName : string;
	type : string;
	startedOn: Date;
	length: number;
	fileIsValid: boolean;
}
export interface CameraEvent {
	id: string;
	recordingId: string;
	cameraId: string;
	cameraName : string;  
	recording: string;
	motionText: string;
	startedOn: Date;
	endedOn: Date;  
	detectionMethod : string;
	fileIsValid: boolean;
	duration: number;
}
interface TryResult<T> {
	success: boolean;
	payload: T | null;
	error: string | null
}
export interface PaginatedResults<T> {
	collection: [T];
	paging: Paging
}
export interface Paging {
	total: number;
	page: number;
	rangeStart: number,
	rangeEnd: number
	hasNext: boolean,
	hasPrev: boolean
}
// export interface Config {
// 	cameraBufferSeconds: number;
// 	eventSilenceSeconds : number;
// 	eventLimitSeconds: number;
// 	eventIdleEndSeconds: number;
// 	notificationsEmailProviderApiKey: string,
//   notificationsEmailSender: string,
//   removeTempFiles: boolean
// }

export interface Config {
	cameraBufferSeconds: number;
	event : EventConfig;
  removeTempFiles: boolean;
  notifications: NotificationsConfig;
}

export interface EventConfig {
	silenceSeconds: number;
	limitSeconds : number;
	idleEndSeconds: number;  
}

export interface NotificationsConfig {
	email: NotificationsEmailConfig;
}

export interface NotificationsEmailConfig {
	providerApiKey: string;
	sender : string;
  recipient : string;
}

export class API {

	static async stopCameraRecording(_camId: string):Promise<TryResult<string>> {
		const response = await fetch(`${process.env.NEXT_PUBLIC_API}/api/recordings/stop/${_camId}`, 
			{ method : 'POST' });

			var responseText = await response.text();

			if (response.ok){
				return { success: true, payload: responseText, error: null }
			}
			
			return { success: false, payload: null, error: responseText }
	}

	static async startCameraRecording(_camId: string, _seconds:number):Promise<TryResult<string>> {
		const response = await fetch(`${process.env.NEXT_PUBLIC_API}/api/recordings/start/${_camId}?seconds=${_seconds}`, 
			{ method : 'POST' });

		var responseText = await response.text();

		if (response.ok){
			return { success: true, payload: responseText, error: null }
		}
		
		return { success: false, payload: null, error: responseText }
	}

	static async getCameras(): Promise<TryResult<Camera[]>> {
		const response = await fetch(`${process.env.NEXT_PUBLIC_API}/api/cameras`, 
			{ method : 'GET' });

			if (!response.ok){
				return { success: false, payload: null, error: await response.text() }
			}
			
			var cams: Camera[] = [];
			var json = await response.json();
			json.map((c: Camera) => cams.push(c));
			
			return { success: true, payload: cams, error: null }
	}

  static async saveCamera(cam: Camera):Promise<TryResult<Camera>> {
		return cam.id != null && cam.id.length > 0
      ? await API.updateCamera(cam)
      : await API.saveNewCamera(cam);
	}

  static async saveNewCamera(cam: Camera):Promise<TryResult<Camera>> {
    console.log('saving new camera');
		const response = await fetch(`${process.env.NEXT_PUBLIC_API}/api/cameras`, 
			{ method : 'POST', body: JSON.stringify(cam), headers: { 'Content-Type': 'application/json' }, });

			var responseText = await response.text();

			if (!response.ok){
        return { success: false, payload: null, error: responseText}
			}

      return { success: true, payload: JSON.parse(responseText), error: null }
	}

  static async updateCamera(cam: Camera):Promise<TryResult<Camera>> {
    console.log('updating camera');
		const response = await fetch(`${process.env.NEXT_PUBLIC_API}/api/cameras/${cam.id}`, 
			{ method : 'PUT', body: JSON.stringify(cam), headers: { 'Content-Type': 'application/json' }, });

			var responseText = await response.text();

			if (!response.ok){
        return { success: false, payload: null, error: responseText}
			}

      return { success: true, payload: JSON.parse(responseText), error: null }
	}

	static async getRecordings(page: number): Promise<TryResult<PaginatedResults<Recording>>> {
		const response = await fetch(`${process.env.NEXT_PUBLIC_API}/api/recordings?page=${page}`, 
			{ method : 'GET' });

			if (!response.ok){
				return { success: false, payload: null, error: await response.text() }
			}
			
			var json = await response.json();
			
			return { success: true, payload: json, error: null }
	}

	static async delRecordings(rec: Recording): Promise<TryResult<PaginatedResults<Recording>>> {
		try{
			const response = await fetch(`${process.env.NEXT_PUBLIC_API}/api/recordings/${rec.id}`, 
			{ method : 'DELETE' });

			if (!response.ok){
				return { success: false, payload: null, error: await response.text() }
			}
			
			var json = await response.json();
			
			return { success: true, payload: json, error: null };
		}catch(err:any){
			return { success: true, payload: json, error: err.message };
		}
		
	}

	static async getEvents(page: number, filter:string | null): Promise<TryResult<PaginatedResults<CameraEvent>>> {

	const evetFilter = filter == null ? '' : `&event=${filter}`;

	const response = await fetch(`${process.env.NEXT_PUBLIC_API}/api/events?page=${page}${evetFilter}`, 
		{ method : 'GET' });

		if (!response.ok){
			return { success: false, payload: null, error: await response.text() }
		}
		
		var json = await response.json();
		
		return { success: true, payload: json, error: null }
	}

	static async delEvent(evt: CameraEvent): Promise<TryResult<PaginatedResults<CameraEvent>>> {
		try{
			const response = await fetch(`${process.env.NEXT_PUBLIC_API}/api/events/${evt.id}`, 
			{ method : 'DELETE' });

			if (!response.ok){
				return { success: false, payload: null, error: await response.text() }
			}
			
			var json = await response.json();
			
			return { success: true, payload: json, error: null };
		}catch(err:any){
			return { success: true, payload: json, error: err.message };
		}

	}

	static async streamRecording(_recId: string): Promise<TryResult<string>> {
		const response = await fetch(`${process.env.NEXT_PUBLIC_API}/api/recordings/${_recId}/stream`, 
			{ method : 'GET' });

			var resText = await response.text()

			if (!response.ok){
				return { success: false, payload: null, error: resText}
			}
			
			return { success: true, payload: resText, error: null }
	}

	static async getRecordingFile(_recId: string): Promise<TryResult<string>> {
		const response = await fetch(`${process.env.NEXT_PUBLIC_API}/api/recordings/${_recId}/file`, 
			{ method : 'GET' });

			var resText = await response.text()

			if (!response.ok){
				return { success: false, payload: null, error: resText}
			}
			
			return { success: true, payload: resText, error: null }
	}

	static async downloadRecordingFile(_recId: string): Promise<TryResult<string>> {
		const response = await fetch(`${process.env.NEXT_PUBLIC_API}/api/recordings/${_recId}/download`, 
			{ method : 'GET' });

			var resText = await response.text()

			if (!response.ok){
				return { success: false, payload: null, error: resText}
			}
			
			return { success: true, payload: resText, error: null }
	}

	static async getConfig():Promise<Config | null> {
		const response = await fetch(`${process.env.NEXT_PUBLIC_API}/api/config?flat=false`, 
			{ method : 'GET' });

			var responseText = await response.text();

			if (!response.ok){
				return null;
			}

			return JSON.parse(responseText);
	}

  static async saveConfig(cfg:Config):Promise<TryResult<Config>> {
		console.log('saving config', cfg);
		const response = await fetch(`${process.env.NEXT_PUBLIC_API}/api/config`, 
			{ method : 'PUT', body: JSON.stringify(cfg), headers: { 'Content-Type': 'application/json' }, });

			var responseText = await response.text();

			if (!response.ok){
        return { success: false, payload: null, error: responseText}
			}

      return { success: true, payload: JSON.parse(responseText), error: null }
	}

	static toTime(seconds: number): string {
		const date = new Date(0);
		date.setSeconds(seconds);
		const timeString = date.toISOString().substr(11, 8);
		return timeString;
	}

}