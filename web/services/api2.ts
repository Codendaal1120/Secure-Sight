//const fetch = require("node-fetch");

const API_URL = process.env.NEXT_PUBLIC_API;

async function getCameraSnapshot(camId: string) {    
  const response = await fetch(`${API_URL}/api/cameras${camId}/snapshot`);
  const imageBlob = await response.blob();
  const imageObjectURL = URL.createObjectURL(imageBlob);
  return imageObjectURL;
};

module.exports.getCameraSnapshot = getCameraSnapshot;