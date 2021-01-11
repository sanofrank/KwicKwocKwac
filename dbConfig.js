const mongoose = require('mongoose');
const dotenv = require('dotenv');
//const { Pool } = require('pg');

dotenv.config();

let mongo = {
    connect: () => {
        mongoose.connect(
        process.env.DB_CONNECT,
        { useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true , useFindAndModify: false})
        .then(
            () => console.log('Connected to DB',mongoose.connection.readyState),
            error => console.log('connection failed',error)    
        )        
    }
};

module.exports = mongo;