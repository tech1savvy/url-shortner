const mongoose = require('mongoose'); 

async function connectMongoDB(url) {
  return mongoose.connect(url).catch((err) => console.log(err));
}

module.exports = {
	connectMongoDB,
}