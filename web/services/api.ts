import { error } from "console";

export interface Camera {
  id: string;
  name: string;
}

export interface Recording {
  id: string;
  fileName: string;
  cameraName : string;
  recordedOn: Date;
  length: number;
}

interface TryResult<T> {
  success: boolean;
  payload: T | null;
  error: string | null
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

  static async getRecordings(): Promise<TryResult<Recording[]>> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API}/api/recordings`, 
      { method : 'GET' });

      if (!response.ok){
        return { success: false, payload: null, error: await response.text() }
      }
      
      var recs: Recording[] = [];
      var json = await response.json();
      json.map((rec: Recording) => recs.push(rec));
      
      return { success: true, payload: recs, error: null }
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

  static toTime(seconds: number): string {
    const date = new Date(0);
    date.setSeconds(seconds);
    const timeString = date.toISOString().substr(11, 8);
    return timeString;
  }
}