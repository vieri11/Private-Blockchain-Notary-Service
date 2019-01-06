# RESTful Web API Project with Hapi.js Framework.

In this exercise I build a RESTful API using Hapi that will 
interface with the private blockchain I completed in Project 2 - "Private Blockchain"

## Steps to follow

1. Open the terminal and install the packages: `npm install`.
2. Run your application `node app.js`
3. The Blockchain initializes with 3 Mock data blocks to get started.
4. Test GET and POST Endpoints with Curl or Postman.
	4a. GET URL: http://localhost:8000/block/0, where '0' is the block height.
	4b. POST URL: http://localhost:8000/block,  with data payload 'body' to add to block body i.e.:
	{
      "body": "Testing block with test string data"
	}
	
## NOTES: 

Both GET and POST endpoints will return a block object in JSON format when successful i.e.:
	{
	"hash":"49cce61ec3e6ae664514d5fa5722d86069cf981318fc303750ce66032d0acff3",
	"height":0,
	"body":"First block in the chain - Genesis block",
	"time":"1530311457",
	"previousBlockHash":""
	}
	
Otherwise I use the Boom library to help return appropriate HTTP errors. 