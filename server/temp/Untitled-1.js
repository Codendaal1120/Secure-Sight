//https://stackoverflow.com/questions/75831873/taking-in-rtsp-stream-converting-it-to-fragmented-mp4-using-ffmpeg-before-broad
const WebSocket = require("ws");
const { spawn } = require('child_process');
const rtspUrl = "rtsp://localhost:8554/mystream";
const fs = require('fs');
const outputFile = fs.createWriteStream('ffmpeg_output.bin');
const wss = new WebSocket.Server({ port: 4001 });

var buf_chunks_string_holder_array = [];
var initialization_segment_ready_flag = false;
var initialization_segment_to_send = [];
var buffered_media_segment_ready_flag = false;
var buffered_media_segment_to_send = [];
var segment_end_index = { "box_type": "nil", "end_index": 0 };
var next_segment_counter = 0;
var processing_counter_queue = []
var moof_counter = 0;
var mdat_counter = 0;
var checker = '';

wss.on("connection", (ws) => {
    console.log("Client connected");
  if (initialization_segment_ready_flag == true) {
    wss.clients.forEach(client => {
      client.send(new Uint8Array(initialization_segment_to_send).buffer);
    })
  }
  if (buffered_media_segment_ready_flag == true) {
    wss.clients.forEach(client => {
      client.send(new Uint8Array(buffered_media_segment_to_send.buffer));
    })
  }

  ws.on("close", () => {
    console.log("Client disconnected");
  });

  ws.addEventListener("error", (error) => {
    console.error("WebSocket error:", error);
  });

});

const ffmpeg = spawn("ffmpeg", [
  "-rtsp_transport",
  "tcp",
  "-i",
  rtspUrl,
  "-g",
  "10",
  "-bufsize", 
  "50k",
  "-preset",
  "ultrafast",
  "-tune",
  "zerolatency",
  "-c:v",
  "libx264",
  "-c:a",
  "aac",
  '-f',
  'mp4',
  '-movflags',
  'frag_keyframe+empty_moov+default_base_moof',
  '-min_frag_duration',
  '50000',   
  "pipe:1",
]);

function decToHex(dec) {
  return dec.toString(16).padStart(2,'0').toUpperCase();
}

function hexToDec(hex) {
  return parseInt(hex, 16);
}

//This is where the parsing and calculating of the length of each box will take place.
ffmpeg.stdout.on('data', (chunk) => {
  outputFile.write(chunk);
  for (var i=0; i < chunk.length; i ++){
    buf_chunks_string_holder_array.push(chunk[i]);
    checker += decToHex(chunk[i]);
    if(checker.length == 16){
      if (checker.slice(-8) === '66747970'){
        let box_size_string = checker.slice(-16, -8);
        let num_bytes = hexToDec(box_size_string);
        next_segment_counter += num_bytes;
      }
      else if(checker.slice(-8) === '6D6F6F76'){
        let box_size_string = checker.slice(-16, -8);
        let num_bytes = hexToDec(box_size_string);
        next_segment_counter += num_bytes;
        segment_end_index = { "box_type": "ftyp&moov", "end_index": next_segment_counter };
        processing_counter_queue.push(segment_end_index);
        next_segment_counter = 0;
      }
      else if(checker.slice(-8) === '6D6F6F66'){
        let box_size_string = checker.slice(-16, -8);
        let num_bytes = hexToDec(box_size_string);
        next_segment_counter += num_bytes;
        moof_counter ++;      
      }
      else if(checker.slice(-8) === '6D646174'){
        let box_size_string = checker.slice(-16, -8);
        let num_bytes = hexToDec(box_size_string);
        next_segment_counter += num_bytes;
        segment_end_index = { "box_type": "moof&mdat", "end_index": next_segment_counter };
        processing_counter_queue.push(segment_end_index);
        next_segment_counter = 0;
        mdat_counter ++;  
      }
      checker = checker.slice(2);
    }
  }
  //This is where the data will be sliced, grouped into their respective segments and sent to the connected clients.
  if (processing_counter_queue.length > 0) {
    var jobs_removal_counter = 0;
    processing_counter_queue.forEach(job_info => {
      if (job_info.box_type == 'ftyp&moov' && buf_chunks_string_holder_array.length >= job_info.end_index) {
        initialization_segment_to_send = buf_chunks_string_holder_array.slice(0, job_info.end_index);
        initialization_segment_ready_flag = true;
        buf_chunks_string_holder_array = buf_chunks_string_holder_array.slice(job_info.end_index);
        jobs_removal_counter++;
      }
      if (job_info.box_type == 'moof&mdat' && buf_chunks_string_holder_array.length >= job_info.end_index) {
        buffered_media_segment_to_send = buf_chunks_string_holder_array.slice(0, job_info.end_index);
        buffered_media_segment_ready_flag = true;
        buf_chunks_string_holder_array = buf_chunks_string_holder_array.slice(job_info.end_index);
        if (buf_chunks_string_holder_array.length!= 0 ||
          (buf_chunks_string_holder_array[4]!= 102 && buf_chunks_string_holder_array[5]!= 116 && buf_chunks_string_holder_array[6]!= 121 && buf_chunks_string_holder_array[7]!= 112) || 
          (buf_chunks_string_holder_array[4]!= 109 && buf_chunks_string_holder_array[5]!= 100 && buf_chunks_string_holder_array[6]!= 97 && buf_chunks_string_holder_array[7]!= 116)){
          buf_chunks_string_holder_array = [];
          processing_counter_queue = [];
        }
        jobs_removal_counter++;
        if (wss.clients.size >= 1) {
          wss.clients.forEach(client => {
            client.send(new Uint8Array(buffered_media_segment_to_send).buffer);
          })
        }
      } 
      processing_counter_queue = processing_counter_queue.slice(jobs_removal_counter);
    }
    );
  }
});

ffmpeg.stderr.on('data', (data) => {
    console.log(`stderr: ${data}`);
  });
  
  ffmpeg.on('close', (code) => {
    console.log(`FFmpeg process exited with code ${code}`);
  });