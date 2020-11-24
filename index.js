const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const verify = require('./routes/verifyToken');
const fileUpload = require('express-fileupload');
const mongo = require('./dbConfig');
const fs = require('fs')


const app = express();
const PORT = process.env.PORT || 3000;

//Import routes
const listRoute = require('./routes/backend');
const authRoute = require('./routes/authentication');
const metadataRoute = require('./routes/metadata');
const { resolveSoa } = require('dns');

app.use(cookieParser());
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));

mongo.connect();

app.set('views', './public')
app.engine('html', require('ejs').renderFile);


app.get('/index', verify, (req,res) => {
    res.render('index.html')
})

app.get('/login', (req,res) =>{
    res.render("login.html");
})

app.get('/documentation', (req,res) => {
    res.render("documentation.html")
})

app.get('/send_email', (req,res) =>{
    res.render("send_email.html");
})

app.get('/', verify , function( req, res ) {
    res.redirect('/index')
   });

app.get('/read', function(req,res){
    let file = req.query.file;

    fs.readFile(`./doc/${file}`, (err, data) => {
        if (err) throw err;
        console.log(data);

        return res.send(data);
      });
})

app.use(express.static('public'))


//Middleware
app.use(express.json({limit: '20mb'})); //json parser per mandare post request
app.use(fileUpload());
app.use(express.urlencoded( {extended : false})); //allow us to send data from front end to server
//Route Middleware
app.use('/api',listRoute);
app.use('/api',authRoute);
app.use('/api',metadataRoute);

app.listen(PORT,() => console.log(`Server listening on port ${PORT}`));
