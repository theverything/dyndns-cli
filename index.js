var fs = require('fs');
var path = require('path');
var touchFile = require('touch');
var request = require('request-promise');
var externalIP = require('external-ip')();

var IP_FILE = path.join(__dirname, 'ip.txt');

function updateURL(host, authToken) {
	return 'http://' + host + '/update-ip?auth=' + authToken + '&ip=';
}

function touch(file, opts) {
  return new Promise(function (resolve, reject) {
    touchFile(file, opts, function (err, result) {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

function readFile(file) {
	return new Promise(function (resolve, reject) {
		fs.readFile(file, function (err, result) {
			if (err) return reject(err);
			resolve(result);
		});
	});
}

function writeFile(file, data) {
	return new Promise(function (resolve, reject) {
		fs.writeFile(file, data, function (err) {
			if (err) return reject(err);
			resolve(true);
		});
	});
}

function getIP() {
	return new Promise(function (resolve, reject) {
		externalIP(function (err, ip) {
		    if (err) return reject(err);
		    resolve(ip);
		});	
	});
}

module.exports = function dyndns(opts) {
	var UPDATE_URL = updateURL(opts.host, opts.auth);

  touch(IP_FILE)
  .then(function () {
    return Promise.all([ getIP(), readFile(IP_FILE) ]);
  })
	.then(function (result) {
		if (opts.cache && result[0] == result[1]) {
			return Promise.resolve(false);
		} else {
			return writeFile(IP_FILE, result[0].trim())
				.then(function () {
					return result[0];
				});
		}
	})
	.then(function (ip) {
		if (ip) {
      console.log('UPDATE: ' + ip);
			// return request.get(UPDATE_URL + ip);
		} else {
			console.log('its the same');
		}
	})
	.catch(function (err) {
		console.error(err);
		process.exit(1);
	});
}