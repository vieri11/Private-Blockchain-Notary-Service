/* ===== Persist data with LevelDB ==================
|  Learn more: level: https://github.com/Level/level |
/===================================================*/
// Importing the module 'level'
const level = require('level');
// Declaring the folder path that store the data
const chainDB = './chaindata';
// Declaring a class
class LevelSandbox {
	// Declaring the class constructor
    constructor() {
    	this.db = level(chainDB);
    }
  
  	// Get data from levelDB with a key (Promise)
  	getLevelDBData(key){
       console.log("Retrieving from level DB using key: " + key);
        let self = this; // Because we are returning a promise, we will need this to be able to reference 'this' inside the Promise constructor
        return new Promise(function(resolve, reject) {
            self.db.get(key, (err, value) => {
                if(err){
                    if (err.type == 'NotFoundError') {
                        resolve(undefined);
                    }else {
                        reject(err);
                    }
                }else {
                    resolve(value);
                }
            });
        });
    }
  
  	// Add data to levelDB with key and value (Promise)
    addLevelDBData(key, value) {
        let self = this;
        return new Promise(function(resolve, reject) {
            self.db.put(key, value, function(err) {
                if (err) {
                    console.log('Block ' + key + ' submission failed', err);
                    reject(err);
                }
              	console.log('Block ' + key + ' submission complete');
                resolve(value);
            });
        });
    }
  
  // Add data to levelDB with value
	addDataToLevelDB(value) {
    	let i = 0;
    	db.createReadStream().on('data', function(data) {
          i++;
        }).on('error', function(err) {
            return console.log('Unable to read data stream!', err)
        }).on('close', function() {
          console.log('Block #' + i);
          addLevelDBData(i, value);
        });
	}
	
  	// Get number of blocks in chain
    getBlocksCount() {
      	let self = this;
        let count = 0;
        return new Promise(function(resolve, reject){
          self.db.createReadStream().on('data', function (data) {
             count++;
          })
          .on('error', function (err) {
              reject(err)
          })
          .on('close', function () {
              resolve(count);
          });
        });
    }
}

// Export the class
module.exports.LevelSandbox = LevelSandbox;