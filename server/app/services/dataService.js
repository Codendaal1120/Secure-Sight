const mongo = require('mongodb');
const MongoClient = mongo.MongoClient;
const logger = require('../modules/loggingModule').getLogger('dataService');
const cache = require('../modules/cache');

/**
 * Read single records from db
 * @param {string} _collectionName - Target collection name
 * @param {Object} _filter - Optional filter definition
 * @param {Object} _project - Projection definition
 * @param {Object} _sort - Sort definition
 * @return {Object} TryResult with the single record
 */
async function getOneAsync(_collectionName, _filter, _project, _sort) {

    var collection = await tryGetCollection(_collectionName);
    if (!collection.success){
        return { success : false, error : collection.error };
    }

    try {             
        if (!_filter){
            _filter = {};
        }

        // cast object
        if (!_project){
            project = {};
        }  

        if (!_sort){
            _sort = {};
        }

        let res = await collection.payload.findOne(_filter, _project, _sort);
        if (!res){
            return { success : false, error : "Not found", code : "NOT_FOUND" };    
        }

        return { success : true, payload : setObjectId(res) };
    } 
    catch (err) {
        logger.log('error', err);
        return { success : false, error : err.message };
    }
}

/**
 * Read collection from db
 * @param {string} _collectionName - Target collection name
 * @param {Object} _filter - Optional filter definition
 * @param {Object} _project - Projection definition
 * @param {Object} _sort - Sort definition
 * @param {number} _page - page number to fetch, send null to not use paging
 * @return {Object} TryResult with the selected records
 */
async function getManyAsync(_collectionName, _filter, _project, _sort, _page) {

    _page = parseInt(_page);
    var collection = await tryGetCollection(_collectionName);
    if (!collection.success){
        return collection;
    }

    try {

        if (!_project){
            _project = {};
        }
        
        if (!_sort){
            _sort = {};
        }

        let usePagination = false;
        let count = 0;
        let recToSkip = 0;
        let rStart = 0;
        let rEnd = 0;
        let hNext = false;
        let hPrev = false;
        if (_page != null){
            recToSkip = cache.config.itemsPerPage * (_page - 1);
            count = await collection.payload.countDocuments(_filter);
            usePagination = true;
            rStart = recToSkip == 0 ? 1 : recToSkip;
            rEnd = Math.min((recToSkip + cache.config.itemsPerPage), count);
            hNext = rEnd < count;
            hPrev = recToSkip > 1;
        }
       
        let res = usePagination 
            ? await collection.payload.find(_filter, _project).sort(_sort).skip(recToSkip).limit(cache.config.itemsPerPage).toArray()
            : await collection.payload.find(_filter, _project).sort(_sort).toArray()

        res.forEach(element => {
            element = setObjectId(element)
        });

        return usePagination 
        ? { success : true, payload : { collection:res, paging : { total: count, page: _page, rangeStart: rStart, rangeEnd: rEnd, hasNext: hNext, hasPrev: hPrev } }}
        : { success : true, payload : { collection:res }};
    } 
    catch (err) {
        logger.log('error', err);
        return { success : false, error : err.message };
    }
}

/**
 * Save a single record to DB
 * @param {string} _collectionName - Target collection name
 * @param {Object} _document - Document to save
 * @param {Object} _project - Projection definition
 * @return {Object} TryResult with the saved single record
 */
async function insertOneAsync(_collectionName, _document, _project) {

    if (!_collectionName){
        return { success : false, error : "invalid collectionName" };
    }

    if (!_document){
        return { success : false, error : "invalid document supplied" };
    }

    var collection = await tryGetCollection(_collectionName);
    if (!collection.success){
        return collection;
    }

    if (!_project){
        _project = {};
    } 

    try {

        let res = await collection.payload.insertOne(_document);
        if (res.insertedId){
            return { success : true, payload : setObjectId(_document) };
        }
        else{
            return { success : false, error : "Could not insert" };
        }
    } 
    catch (err) {
        return { success : false, error : err.message };
    }
}

/**
 * Updates a single record to DB
 * @param {string} _collectionName - Target collection name
 * @param {Object} _filter - Optional filter definition
 * @param {Object} _update - Update definition
 * @param {Object} _project - Projection definition
 * @param {Object} _postUpdateFilter - update to run post save
 * @return {Object} TryResult with the saved single record
 */
async function updateOneAsync(_collectionName, _filter, _update, _postUpdateFilter) {

    if (!_filter){
        return { success : false, error : "invalid filter supplied" };
    }

    if (!_update){
        return { success : false, error : "invalid update supplied" };
    }

    if (!_postUpdateFilter){
        _postUpdateFilter = _filter;
    }

    var collection = await tryGetCollection(_collectionName);
    if (!collection.success){
        return collection;
    }

    try {

        let res = await collection.payload.updateOne(_filter, _update, { upsert: false });

        if (!res.acknowledged || res.modifiedCount == 0){
            // the query failed
            return { success : false, error : "Could not get or update record" };
        }

        let record = await collection.payload.findOne(_postUpdateFilter, {});       

        if (!record){
            // could not find the new or old record, something went wrong
            return { success : false, error : "Could not get or create record" };
        }

        return { success : true, payload : setObjectId(record) };
    } 
    catch (err) {
        return { success : false, error : err.message };
    }
}

/**
 * Deletes a single record to DB
 * @param {string} _collectionName - Target collection name
 * @param {Object} _filter - Optional filter definition
 * @return {Object} TryResult 
 */
async function deleteOneAsync(_collectionName, _filter) {

    if (!_filter){
        return { success : false, error : "invalid filter supplied" };
    }

    var collection = await tryGetCollection(_collectionName);
    if (!collection.success){
        return collection;
    }

    try {

        let res = await collection.payload.deleteOne(_filter);

        if (!res.acknowledged || res.deletedCount == 0){
            return { success : false, error : "Could not delete record" };
        }

        return { success : true };
    } 
    catch (err) {
        return { success : false, error : err.message };
    }
}

/** Get the collection reference */
async function tryGetCollection(collectionName){

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

function setObjectId(obj){
    if (obj){
        obj.id = obj._id.toString();
        delete obj._id;        
    }  
    return obj;  
}

/**
 * Converts input to DBID (Mongo)
 * @param {string} _inputId - Input string
 * @return {Object} Mongo DB ID object
 */
function toDbiD(_inputId) {    
    try{
        return new mongo.ObjectId(_inputId);    
    }
    catch(ex){
        return null; 
    }  
}

/**
 * Generates a new unique id 
 * @see https://mongodb.github.io/node-mongodb-native/api-bson-generated/objectid.html
 */
function genrateObjectId(){
    var timestamp = Math.floor(new Date().getTime()/1000);
    var objectId = new mongo.ObjectId(timestamp);
    return objectId.toString();
}

module.exports.toDbiD = toDbiD;
module.exports.genrateObjectId = genrateObjectId;
module.exports.getOneAsync = getOneAsync;
module.exports.getManyAsync = getManyAsync;
module.exports.insertOneAsync = insertOneAsync;
module.exports.updateOneAsync = updateOneAsync;
module.exports.deleteOneAsync = deleteOneAsync;