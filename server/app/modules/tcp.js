const { createServer } = require('node:net');
const { once } = require('node:events');

/** Creates a TCP server listening on the target port with a callback. Returns the port the server is listening on. 
 * see href='https://nodejs.org/api/net.html#netcreateserveroptions-connectionlistener'
 **/
async function createLocalServer(targetPort, callback){
    const server = createServer(async (socket) => {
      server.close();
      callback(socket);
    });

    let tryCount = 0;
  
    while (true) {
      tryCount++;
      if (!targetPort){
        targetPort = 10000 + Math.round(Math.random() * 30000);
      }      

      if (tryCount == 10){
        throw new Error('Unable to create local server');
      }
  
      try {
        server.listen(targetPort);
        await once(server, 'listening');
        return server.address().port;
      } catch(e) {
        console.error(`could not listen on port ${targetPort}, will retry on a different port : ${e.message}`);
      }
    }
}

module.exports.createLocalServer = createLocalServer;