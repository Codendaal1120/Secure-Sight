import "../styles/globals.css";
import type { AppProps } from "next/app";
import Layout from "components/Layout";
//import { WebSock } from "../components/WebSock";
// import { BsRecordCircleFill } from "react-icons/bs";
// import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


function MyApp({ Component, pageProps }: AppProps) {
  

  // const notifySuccess = (text:string) => toast.success(text, {
  //   position: "top-right",
  //   autoClose: 5000,
  //   hideProgressBar: false,
  //   closeOnClick: true,
  //   pauseOnHover: true,
  //   draggable: true,
  //   progress: undefined,
  //   theme: "dark",
  // });

  // const notifyFail = (text:string) => toast.error(text, {
  //     position: "top-right",
  //     autoClose: 5000,
  //     hideProgressBar: false,
  //     closeOnClick: true,
  //     pauseOnHover: true,
  //     draggable: true,
  //     progress: undefined,
  //     theme: "dark",
  // });


  // WebSock.getScoket()!.on(`test-sock`, async (data) => {
  //   console.log('test-from-socket', data);  
  //   notifySuccess(data);
    
  // }); 

  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}

export default MyApp;
