var chai = require('chai');
var chaiHttp = require('chai-http');
var assert = require('assert');
chai.use(chaiHttp);
const { doesNotMatch } = require('assert');
const { MongoMemoryServer } = require('mongodb-memory-server');
const req = require('express/lib/request');
const mongo = require('mongodb');
const MongoClient = mongo.MongoClient;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

chai.use(require('chai-like'));
chai.use(require('chai-things'));

describe('Test /api/cameras', function () {

    this.timeout(15000); 

    let mongoServer;
    let testCamId;
    let app = null;

    before(async () => {
        mongoServer = await createMongoServer();
        process.env.NODE_ENV = 'unit_test'
        process.env.CORS = 'localhost'
        await createOptions();
        app = require('../server');
        await sleep(500);
    });
    
    after(async () => {
        await mongoServer.stop();
    });

    it('can create camera', async () => {

        const cam = {
            "name" : "test-camera",
            "url" : "rtsp://localhost:54/stream",
            eventConfig : {}          
        }

        const res = await chai.request(app).post('/api/cameras').send(cam);
        chai.expect(res.status).to.equal(201);
        chai.expect(res.body).to.have.property("id");

        testCamId = res.body.id;
    });

    it('can get cameras', async () => {
        const res = await chai.request(app).get('/api/cameras').send();
        chai.expect(res.status).to.equal(200);
        chai.expect(res.body).to.be.an('array');
    }); 

    it('can get single camera', async () => {
        const res = await chai.request(app).get(`/api/cameras/${testCamId}`).send();
        chai.expect(res.status).to.equal(200);
        chai.expect(res.body).to.have.property("id");
    }); 

    it('can not get single camera with invalid id', async () => {       
        const res = await chai.request(app).get(`/api/cameras/DOES-NOT-EXISTS`).send();
        chai.expect(res.status).to.equal(400);
        chai.expect(res.body).not.to.have.property("id");      
    }); 

    it('can update a camera', async () => {
        let randomName = makeid(5);
        let randomUrl = makeid(5);
        const cam = {
            name : randomName,
            url : randomUrl,
            eventConfig : {},
            streamResolution: { width: 10, height: 10 }
        }

        const res = await chai.request(app).put(`/api/cameras/${testCamId}`).send(cam);
        chai.expect(res.status).to.equal(200);
        chai.expect(res.body).to.have.property("id");
        chai.expect(res.body).to.have.property("name").that.equals(cam.name);
        chai.expect(res.body).to.have.property("url").that.equals(cam.url);
    }); 

    it('can not update a camera with a null id', async () => {

        let randomName = makeid(5)
        let randomUrl = makeid(5)

        const cam = {
            name : randomName,
            url : randomUrl,
            eventConfig : {},
            streamResolution: { width: 10, height: 10 }
        }

        const res = await chai.request(app).put(`/api/cameras`).send(cam);
        chai.expect(res.status).to.equal(404);
    }); 

    it('can not update a camera with an invalid id', async () => {

        let randomName = makeid(5)
        let randomUrl = makeid(5)

        const cam = {
            name : randomName,
            url : randomUrl,
            eventConfig : {},
            streamResolution: { width: 10, height: 10 }         
        }

        const res = await chai.request(app).put(`/api/cameras/SHOULD-NOT-WORK`).send(cam);
        chai.expect(res.status).to.equal(400);
    }); 
    
    it('can delete camera', async () => {
        const res1 = await chai.request(app).delete(`/api/cameras/${testCamId}`).send();
        chai.expect(res1.status).to.equal(200);

        const res2 = await chai.request(app).get(`/api/cameras/${testCamId}`).send();
        chai.expect(res2.status).to.equal(400);
    }); 
});

async function createMongoServer(){
    var mongoServer = new MongoMemoryServer();
    let mongod = await MongoMemoryServer.create();
    process.env.DB_CONNECTION = mongod.getUri(); 
    return mongoServer;
}

async function createOptions(){
    // create options
    const cfg = {
        cameraBufferSeconds : 600,
        event : {
            silenceSeconds : 180,
            limitSeconds : 120,
            idleEndSeconds : 9
        },
        removeTempFiles : true,
        ml : {
            chanceToStore0 : 0.05,
            chanceToStore1 : 0.15
        },
        notifications : {
            email : {
                providerApiKey : "xxx",
                sender : "test@test.local",
                recipient : "test@test.local"
            }
        }
    }

    const client = await MongoClient.connect(process.env.DB_CONNECTION, { useNewUrlParser: true, useUnifiedTopology: true });
    let db = client.db(process.env.dbName);
    let collection = db.collection('config');
    collection.insertOne(cfg);

/*
async function tryGetCollection(collectionName){
collection.payload.insertOne(_document);
    if (!collectionName){
        return { success : false, error : "Invalid collection name" };
    }

    // note to self, local connection was failing untill I changed the replicaSet host to the IP used in the connection
    const client = await MongoClient.connect(process.env.DB_CONNECTION, { useNewUrlParser: true, useUnifiedTopology: true })
        .catch(err => { return { success : false, error : err.message, stack : err.stack } });

    if (!client || client.error) {
        if (client.stack){
            logger.log('error', client.stack);
        }
        if (client.error){
            return { success : false, error : "Could not create db client : " + client.error };
        }
        return { success : false, error : "Could not create db client" };
    }

    let db = client.db(process.env.dbName);
    let collection = db.collection(collectionName);

    return { success : true, payload : collection };
}
*/
}

// taken from https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
function makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result;
}
