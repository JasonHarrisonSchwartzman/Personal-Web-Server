const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const app = express();
const port = 3000;
const fs = require('fs');

const util = require('util');
const exec = util.promisify(require('child_process').exec);

app.use(cookieParser());//for cookies
app.use(bodyParser.json());
app.post("/jlang/code", async (req, res) => {


	function generateUniqueID() {
		const min = 100000000;
		const max = 999999999;

		const randomID = Math.floor(Math.random() * (max - min + 1)) + min;
		return randomID.toString();
	}
	const cookie = req.cookies.ID;
	let id;
	if (cookie) {
		id = cookie;	
	}
	else {
		const idNum = generateUniqueID();
		res.cookie('ID',idNum, {
			maxAge: 3600000,
		});
		id = idNum;
	}
  const inputData = req.body.data;
	const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
console.log(req.headers);
  const filePath = 'src/' + id + '.c';
  const binPath = 'bin/' + id;
  console.log('input data: ')
  console.log(inputData); 
  const compile = './jcc ' + filePath + ' ' + binPath;

  function convertToASCII(str) {
	for (let i = 0; i < str.length; i++) {
		console.log(str.charCodeAt(i) + ' ' + str.charAt(i));
	}
  }
  const run = binPath;
  
  async function runCommands() {
	  await fs.writeFile(filePath,inputData, async function(err){
		if (err) {
			console.error("error writing text to file");
		}
		 else {
			 console.log("Text added to file successfully");
		 }
	//console.log("begin commands");
	  await exec(compile, async function(error, stdout, stderr) {
	//	  console.log("begin compile");
		if (error) {
			console.log('error compiling code');
		
		}
		if (stderr) {
			console.log("STDERR:" + stderr);
			convertToASCII(stderr);
			res.json({result: stderr});
			return;
		}
		console.log("compiled");
	  	await exec(run, async function(error, stdout, stderr) {
	  		if (error) {
				console.error("error running code");
				return;
			}
	  		if (stderr) {
				console.error("error running code");
				return;
			}
			console.log("output: " + stdout);
			res.json({ result: stdout});
	  		return;
  		});
	  });
	});
  }
  await runCommands();

});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

