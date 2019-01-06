const SHA256 = require('crypto-js/sha256');
const Block = require('./Block.js');
const BlockChain = require('./BlockChain.js');
const Boom = require('boom')
const bitcoin = require('bitcoinjs-lib');
const bitcoinMessage = require('bitcoinjs-message');

let address = '142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ'
let signature = 'IJtpSFiOJrw/xYeucFxsHvIRFJ85YSGP8S1AEZxM4/obS3xr9iz7H0ffD7aM2vugrRaCi/zxaPtkflNzt5ykbc0='
let message = '142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ:1532330740:starRegistry'
let myBlockChain = new BlockChain.Blockchain();

// console.log(bitcoinMessage.verify(message, address, signature));

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
		  
		this.getBlockByIndex();
        this.postNewBlock();
    }

    /**
     * Implement a GET Endpoint to retrieve a block by index, url: "/block/{index}"
     */
    getBlockByIndex() {
        this.server.route({
            method: 'GET',
            path: '/block/{index}',
            handler: (request, h) => {
				return(this.getBlock(request.params.index));
            }
        });
    }

	async getBlock(payload) {
		try {
			return await myBlockChain.getBlock(payload);
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
				
				var payload = request.payload;
				
				if(!payload) {
					throw Boom.badData('Your data is bad and you should feel bad - No payload content!');
				}
				
				if(!payload.body) {
					throw Boom.badData('Your data is bad and you should feel bad - No body content!');
				}
				
				return(this.postBlock(payload.body));
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

	} // end class

/**
 * Exporting the BlockController class
 * @param {*} server 
 */
module.exports = (server) => { return new BlockController(server);}