import axios from 'axios';


//const API_URL = process.env.API_URL;

const api = axios.create({
  baseURL: `http://${import.meta.env.VITE_API}`,
});

interface Camera {
    id: string;
    name: string;
  }

export function cameras() {
    console.log(`getting ${import.meta.env.VITE_API}/api/cameras`)
    try{
        api.get("/api/cameras").then((res) => {
            console.log(res);
            }
        );
    }
    catch (error) {
        console.error(error);
    }

 

    return "ok";

}

const camera = function() {  

    return "ok";

}

// const _ = {
//     cameras,
//     camera
//   }

// export default _;


//module.exports.cameras = cameras;

// export function cameras() {
    
//         // TODO: remove loading symbol from top of swiper carousel
//         //setSearchGroups(groups);
//         }

