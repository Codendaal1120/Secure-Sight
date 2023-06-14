import axios from 'axios';


//const API_URL = process.env.API_URL;

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

interface Camera {
    id: string;
    name: string;
  }

export function cameras() {
    console.log('getting ' + import.meta.env.VITE_API_URL)
    try{
        api.get("/api/cameras").then((res) => {
            console.log(res);
            // const groups = res.data.map((group: GroupResponse) => {
            //   if(group.availibleSpots > 1) {
            //     return {
            //       id: group.id,
            //       name: group.name,
            //       description: group.description,
            //       members: group.size - (group.availibleSpots - 1),
            //       dateCreated: group.dateCreated,
            //     };
            //   }
            }
        );
    }
    catch (error) {
        // do nothing lmao
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

