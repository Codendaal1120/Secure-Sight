const mongo = require('mongodb');
const MongoClient = mongo.MongoClient;

/** Read single records from db */
async function getOneAsync(collectionName, filter, project) {

    var collection = await tryGetCollection(collectionName);
    if (!collection.success){
        return { success : false, error : collection.error };
    }

    try {              
        // cast object
        if (!project){
            project = {};
        }  

        let res = await collection.payload.findOne(filter, project);
        if (!res){
            return { success : false, error : "Not found", code : "NOT_FOUND" };    
        }

        return { success : true, payload : setObjectId(res) };
    } 
    catch (err) {
        console.error(err);
        return { success : false, error : err.message };
    }
}

/**
 * Read collection from db
 */
async function getManyAsync(collectionName, filter, project, sort) {

    var collection = await tryGetCollection(collectionName);
    if (!collection.success){
        return collection;
    }

    try {

        if (!project){
            project = {};
        }
        
        if (!sort){
            sort = {};
        }

        let res = await collection.payload.find(filter, project).sort(sort).toArray();
        res.forEach(element => {
            element = setObjectId(element)
        });
        return { success : true, payload : res };
    } 
    catch (err) {
        console.error(err);
        return { success : false, error : err.message };
    }
}


async function tryGetCollection(collectionName){

    if (!collectionName){
        return { success : false, error : "Invalid collection name" };
    }

    // note to self, local connection was failing untill I changed the replicaSet host to the IP used in the connection
    const client = await MongoClient.connect(process.env.DB_CONNECTION, { useNewUrlParser: true, useUnifiedTopology: true })
        .catch(err => { return { success : false, error : err.message, stack : err.stack } });

    if (!client || client.error) {
        if (client.stack){
            console.error(client.stack);
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

async function insertOneAsync(collectionName, document, project) {

    if (!collectionName){
        return { success : false, error : "invalid collectionName" };
    }

    if (!document){
        return { success : false, error : "invalid document supplied" };
    }

    var collection = await tryGetCollection(collectionName);
    if (!collection.success){
        return collection;
    }

    if (!project){
        project = {};
    } 

    try {

        let res = await collection.payload.insertOne(document);
        if (res.insertedId){
            return { success : true, payload : setObjectId(document) };
        }
        else{
            return { success : false, error : "Could not insert" };
        }
    } 
    catch (err) {
        return { success : false, error : err.message };
    }
}

function setObjectId(obj){
    if (obj){
        obj.id = obj._id.toString();
        delete obj._id;        
    }  
    return obj;  
}

var toDbiD = function(inputId) {    
    try{
        return new mongo.ObjectId(inputId);    
    }
    catch(ex){
        return null; 
    }  
}

module.exports.toDbiD = toDbiD;
module.exports.getOneAsync = getOneAsync;
module.exports.getManyAsync = getManyAsync;
module.exports.insertOneAsync = insertOneAsync;