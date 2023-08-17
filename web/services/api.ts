import { error } from "console";

export interface Camera {
  id: string;
  name: string;
}

interface TryResult<T> {
  success: boolean;
  payload: T | null;
  error: string | null
}
export class API {

  static async stopCameraRecording(_camId: string):Promise<TryResult<string>> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API}/api/cameras/${_camId}/record/stop`, 
      { method : 'POST' });

      var responseText = await response.text();

      if (response.ok){
        return { success: true, payload: responseText, error: null }
      }
      
      return { success: false, payload: null, error: responseText }
  }

  static async startCameraRecording(_camId: string, _seconds:number):Promise<TryResult<string>> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API}/api/cameras/${_camId}/record?seconds=${_seconds}`, 
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
      
      var cams: { id: string; name: string; }[] = [];
      var json = await response.json();
      json.map((camera: Camera) => {
        cams.push({
          id: camera.id,
          name: camera.name,
        });
      });
      
      return { success: true, payload: cams, error: null }
  }
}