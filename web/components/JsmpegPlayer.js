// import React, {Component} from 'react';
// //import JSMpeg from '@cycjimmy/jsmpeg-player';
// //https://codesandbox.io/s/react-jsmpeg-player-demo-rr04s?file=/src/components/JsmpegPlayer.js:0-975
// import JSMpeg from '@seydx/jsmpeg/lib/index.js';
// import JSMpegWritableSource from './JSMpegWritableSource.ts'

// export default class JsmpegPlayer extends Component {
//   constructor(props) {
//     super(props);

//     this.els = {
//       videoWrapper: null,
//     };
//   };

//   render() {
//     return (
//       <div
//         className={this.props.wrapperClassName}
//         ref={videoWrapper => this.els.videoWrapper = videoWrapper}>
//       </div>
//     );
//   };

//   componentDidMount() {
//     // Reference documentation, pay attention to the order of parameters.
//     // https://github.com/cycjimmy/jsmpeg-player#usage
//     this.video = new JSMpeg.Player(null, {
//           source: JSMpegWritableSource,
//           canvas: this.els.videoWrapper,
//           audio: true,
//           pauseWhenHidden: false,
//           videoBufferSize: 1024 * 1024,
//         });

//     if (this.props.onRef) {
//       this.props.onRef(this)
//     }
//   };

//   play() {
//     this.video.play();
//   };

//   pause() {
//     this.video.pause();
//   };

//   stop() {
//     this.video.stop();
//   };

//   destroy() {
//     this.video.destroy();
//   };
// };

