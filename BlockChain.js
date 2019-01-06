/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

const SHA256 = require('crypto-js/sha256');
const LevelSandbox = require('./levelSandbox.js');
const Block = require('./Block.js');

class Blockchain {

    constructor() {
        this.db = new LevelSandbox.LevelSandbox();
      	this.generateGenesisBlock();
    }
  
  	  // Generate genesis block when appplicable
      generateGenesisBlock(){
        this.getBlockHeight().then((result)=>{
            if(result<0){
              this.addBlock(new Block.Block("First block in the chain - Genesis block")).then((result)=>{
              console.log('Added Genesis Block');
              }).catch((err) => { console.log(err); });
        	}
        }).catch((err) => { console.log(err); });   
    }

    // Get block height, it is auxiliar method that return the height of the blockchain
    getBlockHeight(){
      return new Promise((resolve, reject) => { 
		this.db.getBlocksCount().then((blockCount)=>{
			if(blockCount>=0) resolve(blockCount-1);
		}).catch((err) => { console.log(err); reject("Block count error");}); 
	  });
    }

    // Add new block
    addBlock(newBlock) {
    return new Promise((resolve, reject) => { 
      // Current Block Count
      this.db.getBlocksCount().then((count) => {  
	
      newBlock.height = count;
      
      // UTC timestamp
      newBlock.time = new Date().getTime().toString().slice(0,-3);
      
      // previous block hash
      if(newBlock.height>0){
      	this.db.getLevelDBData(newBlock.height-1).then((prevBlock) => {
        	if(!prevBlock) {
              console.log("Error with previous data");
            }else {
              newBlock.previousBlockHash = JSON.parse(prevBlock).hash;
                    
      		  // Block hash with SHA256 using newBlock and converting to a string
      		  newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
              
              this.db.addLevelDBData(newBlock.height, JSON.stringify(newBlock).toString()).then((addedBlock) => {
        		if(!addedBlock) {
              		reject("Error Adding data");
            	}else {
              		resolve(addedBlock);
            	}
              }).catch((err) => { console.log(err); });
            }
        }).catch((err) => { console.log(err); });
      }
      // Else create Genesis Block
      else {
        // Block hash with SHA256 using newBlock and converting to a string
      	newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
        
    	this.db.addLevelDBData(newBlock.height, JSON.stringify(newBlock).toString()).then((result) => {
        	if(!result) {
              reject("Error Adding data");
            }else {
              resolve(result);
            }
        }).catch((err) => { console.log(err); });
      }
      
	  }).catch((err) => { console.log(err);});
    });
                       
    }

    // Get Block By Height
    getBlock(blockHeight){
      return new Promise((resolve, reject) => {
		  console.log(blockHeight);
        this.db.getLevelDBData(blockHeight).then((block) => {
          if(!block) {
              reject("Error with previous data");
          }else {
              resolve(JSON.parse(block));
          }
      	}).catch((err) => { console.log(err); });
      });
    }

    // Validate if Block is being tampered by Block Height
    validateBlock(blockHeight){
      return new Promise((resolve, reject) => {
		this.getBlock(blockHeight).then((blockObj)=> {
			
			let blockObjHash = blockObj.hash;
			
			// remove block hash to test block integrity
			blockObj.hash = '';
			
			// generate block hash
			let validBlockHash = SHA256(JSON.stringify(blockObj)).toString();

			  // Compare
			if (blockObjHash===validBlockHash) {
			  console.log('Block #'+blockHeight+' equals valid hash:\n'+blockObjHash+'<>'+validBlockHash);
			  resolve(true);
			} else {
			  console.log('Block #'+blockHeight+' invalid hash:\n'+blockObjHash+'<>'+validBlockHash);
			  reject(false);
			}
		}).catch((err) => { console.log(err); }); 
      });
    }

	 // Validate Blockchain
     validateChain(){
        let errorLog = [];
        let self = this; 
		let prevHash = "";
        let currentBlock = {};
        let currentHash = "";
        let count = 0;
		let previousHashHeight = 0;
        let currentPrevHash ="";
       
        // Get chain and test validity
        return new Promise((resolve, reject) => {
                  self.db.db.createReadStream()
                  .on('data', function (data) {
                      count++;
                    
                      currentBlock = JSON.parse(data.value);
                      currentHash = currentBlock.hash;
                      currentPrevHash = currentBlock.previousBlockHash;
                        
                      previousHashHeight = count-1;
                    
                      // validate individual block
                      self.validateBlock(currentBlock.height).then((result)=>{
                        
                      }).catch((err) => { console.log(err); errorLog.push(currentBlock.height);});  

                      // compare blocks hash link
                      if (currentPrevHash!==prevHash) {
                        console.log('Block #'+previousHashHeight+' invalid prev hash:\n'+currentPrevHash+'<>'+prevHash);
                        errorLog.push(currentBlock.height);
                      }
                      else{
                        console.log('Block #'+previousHashHeight+' valid prev hash:\n'+currentPrevHash+'<>'+prevHash);
                      }

                      prevHash = currentBlock.hash;
                  })
                  .on('error', function (err) {
                      console.log(err);
                  })
                  .on('close', function () {
                      if (errorLog.length>0) {
                        console.log('Block errors = ' + errorLog.length);
                        console.log('Blocks: '+errorLog);
                      } else {
                        console.log('No errors detected');
                        resolve(errorLog);
                      }
                  }); 
      }).catch((err) => { console.log(err);reject(errorLog);});
    }

    // Utility Method to Tamper a Block for Test Validation
    // This method is for testing purpose
    _modifyBlock(height, block) {
        let self = this;
        return new Promise( (resolve, reject) => {
            self.db.addLevelDBData(height, JSON.stringify(block).toString()).then((blockModified) => {
                resolve(blockModified);
            }).catch((err) => { console.log(err); reject(err)});
        });
    }
   
}

module.exports.Blockchain = Blockchain;