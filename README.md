# Build a Private Blockchain Notary Service
# RESTful Web API Project with Hapi.js Framework.

In this project, I built a Star Registry Service that allows users to 
claim ownership of their favorite star in the night sky.

## Steps to follow

1. Open the terminal and install the packages: `npm install`.
2. Run your application `node app.js`
3. The Blockchain initializes with 1 Genesis block that does not contain any Star data.

# Test Endpoints

1. POST a Request Validation with url: http://localhost:8000/requestValidation and body:  

   { "address":"19xaiMqayaNrn3x7AjV5cU4Mk5f5prRVpL" }  

   The response should contain: walletAddress, requestTimeStamp, message and validationWindow. It must be returned in a JSON format:  

   {  
     "walletAddress": "19xaiMqayaNrn3x7AjV5cU4Mk5f5prRVpL",  
     "requestTimeStamp": "1544451269",  
     "message": "19xaiMqayaNrn3x7AjV5cU4Mk5f5prRVpL:1544451269:starRegistry",  
     "validationWindow": 300  
   }  

2. POST a message validation with url: http://localhost:8000/message-signature/validate and body:  
   {  
   "address":"19xaiMqayaNrn3x7AjV5cU4Mk5f5prRVpL",  
    -"signature":"H8K4+1MvyJo9tcr2YN2KejwvX1oqneyCH+fsUL1z1WBdWmswB9bijeFfOfMqK68kQ5RO6ZxhomoXQG3fkLaBl+Q="  
   }  

   The endpoint response should look like:

   {
    "registerStar": true,
    "status": {
    "address": "19xaiMqayaNrn3x7AjV5cU4Mk5f5prRVpL",
    "requestTimeStamp": "1544454641",
    "message": "19xaiMqayaNrn3x7AjV5cU4Mk5f5prRVpL:1544454641:starRegistry",
    "validationWindow": 193,
    "messageSignature": true
     }
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
