const mongoose = require('mongoose')

const ConnectDB = async (db_host) => {
  try {
    await mongoose.connect(db_host,{useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false});
    console.log('MongoDB connected..')
  }catch(err) {
    console.log(err)
    console.log("Couldn't connect to the databas")
    console.error(err.message)
    process.exit()
  }
}


module.exports = ConnectDB;