var chai = require('chai');
var chaiHttp = require('chai-http');
var assert = require('assert');
chai.use(chaiHttp);
const app = require('../server');
const { doesNotMatch } = require('assert');
const { MongoMemoryServer } = require('mongodb-memory-server');
const req = require('express/lib/request');

chai.use(require('chai-like'))
chai.use(require('chai-things'))

process.env.NODE_ENV = 'test'

describe('Test /api/cameras', () => {

    let mongoServer;
    let testCamId;

    before(async () => {
        mongoServer = await createMongoServer();
    });
    
    after(async () => {
        await mongoServer.stop();
    });

    it('can create camera', async () => {

        const cam = {
            "name" : "test-camera",
            "url" : "rtsp://localhost:54/stream"            
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

        let randomName = makeid(5)
        let randomUrl = makeid(5)

        const cam = {
            "name" : randomName,
            "url" : randomUrl            
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
            "name" : randomName,
            "url" : randomUrl            
        }

        const res = await chai.request(app).put(`/api/cameras`).send(cam);
        chai.expect(res.status).to.equal(404);
    }); 

    it('can not update a camera with an invalid id', async () => {

        let randomName = makeid(5)
        let randomUrl = makeid(5)

        const cam = {
            "name" : randomName,
            "url" : randomUrl            
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




