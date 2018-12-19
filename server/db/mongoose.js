var mongoose = require('mongoose');

mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB_URI,{useNewUrlParser:true, useFindAndModify: false, useCreateIndex: true});

module.exports = {
    mongoose
}