/** Copied from https://github.com/phoboslab/jsmpeg/issues/199 */
class JSMpegWritableSource {
    destination: any;
    established: boolean;
    completed: boolean;
    progress: number;
    streaming: boolean;
  
    constructor() {
      this.destination = null;
  
      this.completed = false;
      this.established = false;
      this.progress = 0;
  
        // Streaming is obiously true when using a stream
      this.streaming = true;
    }
  
    connect(destination: any) {
      this.destination = destination;
    }
  
    start() {
      this.established = true;
      this.completed = true;
      this.progress = 1;
    }
  
    resume() { // eslint-disable-line class-methods-use-this
  
    }
  
    destroy() { // eslint-disable-line class-methods-use-this
    }
  
    write(data: any) {
      this.destination.write(data);
    }
  
    test(data: any) {
        console.log(data);
    }
  }
  
export default JSMpegWritableSource;