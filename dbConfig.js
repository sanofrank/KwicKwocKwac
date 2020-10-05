const mongoose = require('mongoose');
const dotenv = require('dotenv');
//const { Pool } = require('pg');

dotenv.config();

// POSTGRES CONFIG
// //caching information about connection information
// const isProduction = process.env.NODE_ENV === 'production' //When the NODE_ENV environment variable is set to 'production' all devDependencies in your package.json file will be completely ignored when running npm install

// const connectionString = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`;

// //New pool variable
// const pool = new Pool({
//     connectionString: isProduction ? process.env.DATABASE_URL : connectionString
// });

// module.exports = { pool };

// MONGODB CONFIG

let mongo = {
    connect: () => {
        mongoose.connect(
        process.env.DB_CONNECT,
        { useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true },
        () => console.log('Connected to DB',mongoose.connection.readyState)
        ).catch(error => console.log('connaction failed',error));
    }
};

module.exports = mongo;