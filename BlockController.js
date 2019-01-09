const SHA256 = require('crypto-js/sha256');
const Block = require('./Block.js');
const BlockChain = require('./BlockChain.js');
const Boom = require('boom')
const bitcoin = require('bitcoinjs-lib');
const bitcoinMessage = require('bitcoinjs-message');
const TimeoutRequestsWindowTime = 5*60*1000;

let myBlockChain = new BlockChain.Blockchain();
let mempoolValid = [];
let mempool = [];
let timeoutRequests = [];

/**
 * Controller Definition to encapsulate routes to work with blocks
 */
class BlockController {

    /**
     * Constructor to create a new BlockController, you need to initialize here all your endpoints
     * @param {*} server 
     */
    constructor(server) {
        this.server = server;
		
		setTimeout(function () {
			console.log("Waiting...")
		}, 100);


		/******************************************
		 ** Function for Create 3 Tests Blocks ****
		 ******************************************/

		/**
		(function theLoop (i) {
			setTimeout(function () {
				let blockTest = new Block.Block("Test Block - " + (i + 1));
				// Be careful this only will work if your method 'addBlock' in the Blockchain.js file return a Promise
				myBlockChain.addBlock(blockTest).then((result) => {
					console.log(result);
					i++;
					if (i < 3) theLoop(i);
				});
			}, 100);
		  })(0);
		**/
		  
		this.getBlockByIndex();
        this.postNewBlock();
		this.AddRequestValidation();
		this.validateRequestByWallet();
		this.getStarByHash();
		this.getStarByWalletAddress();
    }

    /**
     * Implement a POST Endpoint to requestValidation of given walletAddress for a window of 5 minutes.
	 * url: "/requestValidation"
     */
    AddRequestValidation() {
        this.server.route({
            method: 'POST',
            path: '/requestValidation',
            handler: (request, h) => {
				
				const self = this;
				const payload = request.payload;
				const walletAddress = payload.address;
				
				let timeStamped = request.info.received.toString();
				timeStamped = timeStamped.slice(0,-3);
				
				let message = walletAddress + ":" + timeStamped + ":starRegistry";
				
				// Calculate time left
				let timeElapse = (new Date().getTime().toString().slice(0,-3)) - timeStamped;
			    let timeLeft = (TimeoutRequestsWindowTime/1000) - timeElapse;
				
				if(!payload) {
					throw Boom.badData('Your data is bad and you should feel bad - No payload content!');
				}
				
				if(!walletAddress) {
					throw Boom.badData('Your data is bad and you should feel bad - No address content!');
				}
				
				// check if walletAddress already in mempool - if yes, return original request object
				if(walletAddress in mempool) {
					console.log("Wallet address already in mempool. Returning previous request");
					
					timeStamped = mempool[walletAddress].requestTimeStamp;
					
					timeElapse = (new Date().getTime().toString().slice(0,-3)) - timeStamped;
			        timeLeft = (TimeoutRequestsWindowTime/1000) - timeElapse;
				
					mempool[walletAddress].validationWindow = timeLeft;
					return(mempool[walletAddress]);
				}
				
				// walletAddress already validated
				if(walletAddress in mempoolValid && mempoolValid[walletAddress].registerStar == true) {
					console.log("Wallet address already validated and in mempoolValid. Returning valid request.");
					
					return(mempoolValid[walletAddress]);
				}
				
				// store request Object
				let requestObject = JSON.parse(`{"walletAddress":"${walletAddress}", 
												"requestTimeStamp":"${timeStamped}", 
												"message":"${message}", 
												"validationWindow":"${timeLeft}"}`);
				
				console.log("Adding the following address in the mempool: " + walletAddress);
				
				// add walletAddress in mempool
				mempool[walletAddress] = requestObject;
				timeoutRequests[walletAddress] = setTimeout(function(){ self.removeValidationRequest(walletAddress) }, TimeoutRequestsWindowTime );
				
				return(requestObject);
            }
        });
    }
	
	// Cleans mempool of given address
	removeValidationRequest(walletAddress) {
		if(walletAddress in timeoutRequests) {
			console.log(`Removing ${walletAddress} from mempool!`);
				
			clearTimeout(timeoutRequests[walletAddress]);
			delete timeoutRequests[walletAddress];
			delete mempool[walletAddress];
		}
	}
	
	/**
    * Implement a POST Endpoint to validateRequestByWallet method that validates given wallet address if within 5 minute user request window 
	* and given signature is also valid, url: "/message-signature/validate"
    */
    validateRequestByWallet() {
        this.server.route({
            method: 'POST',
            path: '/message-signature/validate',
            handler: (request, h) => {
				
				const payload = request.payload;
				const walletAddress = payload.address;
				const signature = payload.signature;
				
				if(!payload) {
					throw Boom.badData('Your data is bad and you should feel bad - No payload content!');
				}
				
				if(!walletAddress || !signature) {
					throw Boom.badData('Your data is bad and you should feel bad :(');
				}
				
				// check if walletAddress already in mempool - if yes check validity
				if(walletAddress in mempool) {
					console.log("Wallet address in mempool");
					
					let validRequest = {};
					let timeStamped = mempool[walletAddress].requestTimeStamp;
					let message = mempool[walletAddress].message;
					
					// Calculate time left
					let timeElapse = (new Date().getTime().toString().slice(0,-3)) - timeStamped;
					let timeLeft = (TimeoutRequestsWindowTime/1000) - timeElapse;
					
					// verify signature
					let isValid = bitcoinMessage.verify(message, walletAddress, signature);
					
					if(timeLeft && isValid) {
						console.log("time and signature both valid");
						
						// remove walletaddress request from mempool 
						this.removeValidationRequest(walletAddress);
						
						// add walletaddress to mempoolValid with validRequest object
						validRequest = JSON.parse(`{"registerStar":true, 
													"status":{
														"address":"${walletAddress}",
														"requestTimeStamp":"${timeStamped}",
														"message":"${message}",
														"validationWindow":"${timeLeft}",
														"messageSignature":true
														}
													}`);
						
						mempoolValid[walletAddress] = validRequest;
					}
					else {
						throw Boom.badData('Data not valid!');
					}
					
					return(validRequest);
				}
				else {
					throw Boom.badData('Data no longer in mempool!');
				}	
			}
        });
    }	
				
    /**
     * Implement a GET Endpoint to retrieve a block by index, url: "/block/{index}"
     */
    getBlockByIndex() {
        this.server.route({
            method: 'GET',
            path: '/block/{index}',
            handler: (request, h) => {
				return(this.getBlockByHeight(request.params.index));
            }
        });
    }

	async getBlockByHeight(height) {
		try {
			return await myBlockChain.getBlock(height);
		}
		catch (err) {
			throw Boom.badData('Your data is bad and you should feel bad: ' + err);
		}
	}

    /**
     * Implement a POST Endpoint to add a new Block, url: "/block"
     */
    postNewBlock() {
        this.server.route({
            method: 'POST',
            path: '/block',
            handler: (request, h) => {
				
				let payload = request.payload;
				let walletAddress = payload.address;
				let starCoordinates = payload.star;
				let body = "";
				
				if(!payload) {
					throw Boom.badData('Your data is bad and you should feel bad - No payload content!');
				}
				
				if(!walletAddress || !starCoordinates || !starCoordinates.ra || !starCoordinates.dec) {
					throw Boom.badData('Your data is bad and you should feel bad - Bad body content!');
				}
				
				if(!this.verifyAddressRequest(walletAddress)){
					throw Boom.badData('Your data is bad and you should feel bad - Verify Address Request Failed!');
				}
				
				let encodeStarStory = Buffer.from(starCoordinates.story).toString('hex');
				
				body = `{
							"address":"${walletAddress}",
							"star":{
								"ra":"${starCoordinates.ra}",
								"dec":"${starCoordinates.dec}",
								"story":"${encodeStarStory}"
							}
						}`;
				
				
				// reset registerStar valid request to false - only one star can register per valid address request
				mempoolValid[walletAddress].registerStar = false;

				return(this.postBlock(JSON.parse(body)));
            }
        });
    }
	
	async postBlock(body) {
		try {
			let blockTest = new Block.Block(body);
			
			return await myBlockChain.addBlock(blockTest);
		}
		catch (err) {
			throw Boom.badData('Your data is bad and you should feel bad: ' + err);
		}
	}
	
	/**
    * Verify if the request validation exists and if it is valid.
    */
    verifyAddressRequest(walletAddress) {
		
        if(walletAddress in mempoolValid && mempoolValid[walletAddress].registerStar == true) {
			console.log("valid address request - registering star...");
			return true;
		}
		
		return false;
    }	

    /**
     * Implement a GET Endpoint to find block by hash, url: "/stars/hash:[blockHash]"
     */
    getStarByHash() {
        this.server.route({
            method: 'GET',
            path: '/stars/hash:{blockHash}',
            handler: (request, h) => {
				
				return(this.getBlockByHash(request.params.blockHash));
	        }
        });
    }		
	
	async getBlockByHash(hash) {
		try {
			return await myBlockChain.getBlockByHash(hash);
		}
		catch (err) {
			throw Boom.badData('Your data is bad and you should feel bad: ' + err);
		}
	}
	
	/**
     * Implement a GET Endpoint to find blocks by wallet address, url: "stars/address:[walletAddress]"
     */
    getStarByWalletAddress() {
        this.server.route({
            method: 'GET',
            path: '/stars/address:{walletAddress}',
            handler: (request, h) => {
				
				return(this.getBlockByWalletAddress(request.params.walletAddress));
	        }
        });
    }	
	
	async getBlockByWalletAddress(walletAddress) {
		try {
			return await myBlockChain.getBlockByWalletAddress(walletAddress);
		}
		catch (err) {
			throw Boom.badData('Your data is bad and you should feel bad: ' + err);
		}
	}
	
} // end class

/**
 * Exporting the BlockController class
 * @param {*} server 
 */
module.exports = (server) => { return new BlockController(server);}