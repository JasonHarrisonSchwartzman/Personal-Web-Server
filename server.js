const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const app = express();
const port = 3000;
const fs = require('fs');

const util = require('util');
const {exec} = require('child_process');

app.use(cookieParser());
app.use(bodyParser.json());
app.post("/jlang/code", async (req, res) => {
	function executeWithTimeout(command, timeout) {
  		return new Promise((resolve, reject) => {
    			const child = exec(command, (error, stdout, stderr) => { 
				if (stderr) {
					reject(new Error(stderr));
				}
				else {
        				resolve({ stdout });
      				}	
    			});

    			const timeoutId = setTimeout(() => {
      				child.kill(); // Kill the child process if it runs for too long
      				reject(new Error('Execution timed out'));
    			}, timeout);

    			child.on('exit', (code) => {
      				clearTimeout(timeoutId); // Clear the timeout when the process exits
    			});
  		});
	}

	function generateUniqueID() {
		const min = 100000000;
		const max = 999999999;

		const randomID = Math.floor(Math.random() * (max - min + 1)) + min;
		return randomID.toString();
	}
	function determineValidCookie(cookie) {
		return !isNaN(cookie);
	}
	function getDate() {
		// Create a new Date object to get the current date and time
		const now = new Date();

		// Define options for formatting
		const options = {
 			weekday: 'long',
  			year: 'numeric',
  			month: 'long',
 		 	day: 'numeric',
  			hour: '2-digit',
  			minute: '2-digit',
  			second: '2-digit',
  			timeZoneName: 'short',
		};

		// Format the date and time
		const formattedDate = now.toLocaleDateString(undefined, options);

// Print the formatted date and time
		return `${formattedDate}`;

	}
	const cookie = req.cookies.ID;
	let id;
	const logFile = 'server.log';
	const errorFile = 'error.log';
	const logStream = fs.createWriteStream(logFile, {flags: 'a'});
	const errorStream = fs.createWriteStream(errorFile, {flags:'a'});

	if (cookie) {
		if (!determineValidCookie(cookie)) {
			errorStream.write(getDate() + " | Bad cookie " + "\"" + cookie + "\"\n");
			return res.json({result:"Server Error: Bad cookie"});
		}
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
	//const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
	//console.log(req.headers);
  	const filePath = 'src/' + id + '.c';
  	const binPath = 'bin/' + id;
  	//console.log('input data: ')
  	//console.log(inputData); 
  	const compile = './jcc ' + filePath + ' ' + binPath;
	const run = binPath;

	const timeOut = 30;

  	function convertToASCII(str) {
		for (let i = 0; i < str.length; i++) {
			console.log(str.charCodeAt(i) + ' ' + str.charAt(i));
		}
	}
	await fs.writeFile(filePath,inputData, async function (err) {
		if (err) {
			errorStream.write(getDate() + "| Error writing text to file " + filePath + "\n");
		}
		else {
			logStream.write(getDate() + "| Succesfully added text to file " + filePath + "\n");
		}
	});
	executeWithTimeout(compile, timeOut * 1000)
		.then((result) => {
			if (result.stderr) {
				logStream.write(getDate() + "| " + filePath + ": Compiler gives error: " + result.stderr.replace(/\n/g, " ") + "\n");
				return res.json({result: result.stderr});
			}
			else {
				logStream.write(getDate() + "| " + filePath + " Successfully compiled.\n"); 
				executeWithTimeout(run, timeOut * 1000)
				.then((result) => {
					logStream.write(getDate() + "| " + binPath + " Successfully ran.\n");
					return res.json({result: result.stdout});
				})
				.catch((error) => {
					logStream.write(getDate() + "| " + binPath + " Failed to run. " + error.message.replace(/\n/g," ") + "\n");
					return res.json({result: error.message});
				})
			}
		})
		.catch((error) => {
			errorStream.write(getDate() + "| " + filePath + " Failed to compile. " + error.message.replace(/\n/g," ") + "\n");
			return res.json({result: error.message});
		});
  
  	/*async function runCommands() {
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
  await runCommands();*/

});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

