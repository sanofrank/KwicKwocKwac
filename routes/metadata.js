const router = require('express').Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const verify = require('./verifyToken');
//const { pool } = require('../dbConfig');
const Metadata = require('../model/Metadata');
// const { loginValidation, registerValidation } = require('../validation');

router.get('/index', verify, (req,res) => {
    res.render("index.html");
})

router.post('/metadata', async (req,res) => { // async finchè aspettiamo il salvataggio 
    //VALEDATE DATA
    //const {error} = registerValidation(req.body);
    //if(error) return res.status(400).send(error.details[0].message); //bad request to show just the message error

    //CHECKING USER ALREADY IN DATABASE
    //const emailExist = await User.findOne({email: req.body.email}); //check in the DB
    //if(emailExist) return res.status(400).send('Email already exists');
    
    //HASH PASSWORDS
    //const salt = await bcrypt.genSalt(10); //random generated data
    //const hashPassword = await bcrypt.hash(req.body.password,salt); //combines salt to hashes password

    console.log(req.body)
    //CREATE A NEW METADATA RECORD
    const metadata = new Metadata ({
        number: req.body.number,
        author: req.body.author,
        roleList: req.body.role,
        curator: req.body.curator,
        abstract: req.body.abstract,
        doctypeList: req.body.doctype,
        doctopicList: req.body.doctopic,
        docstatus: req.body.docstatus,
        provenanceP: req.body.provenanceP,
        provenanceU: req.body.provenanceU,
        eventPlace: req.body.eventPlace,
        eventDate: req.body.eventDate,
        additionalNotes: req.body.additionalNotes
    });

    console.log(metadata)

    try{
    const savedUser = await metadata.save();
    return res.send('Saved');
    }catch(err){
        res.status(400).send("catch error",err);
    }
});

router.get('/verify', verify, (req,res) => {
    res.json({editmode: true});
});

router.get('/getId', async (req, res) => {
    const id = req.query.id
    let metadata = await Metadata.findById(id)
    let true_metadata = JSON.stringify(metadata)
    return res.send(true_metadata)
})
    // se esiste, lo inserisce nel get fetch e fa la richiesta al server
    // QUI si fa una fetch scrivendo let response bla
    // dammi i metadati che appartengono a questa opera con questo id qua -> vedi funzione load in script
    // il server prende questo come body, lo legge e scarica i metadati salvati riferiti a quell'oggetto e li manda al client tramite una res.send


module.exports = router;


// POSTGRES LOGIN
    // pool.query(
    //     `SELECT * FROM users WHERE name = $1`, [login.username], (error,result) =>{
    //         if(error) throw error;

    //         if(result.rows.length > 0){
    //             const user = result.rows[0];

    //             bcrypt.compare(login.password, user.password, (error, isMatch) => {
    //                 if(error) throw error;

    //                 if(isMatch){
    //                     //Create and assign token
    //                     const token = jwt.sign({uuid: user.uuid},process.env.TOKEN_SECRET); //pass some data to the token
    //                     console.log(user);
    //                     //res.header('auth-token',token).send(token);
    //                     res.cookie('auth_token', token, 
    //                     {
    //                         maxAge: 3600,
    //                         httpOnly: true,
    //                         //secure: true
    //                     })
    //                     res.send('Logged in');
    //                 }else{
    //                     return res.status(400).send('Invalid password');
    //                 }
    //             });
    //         }else{
    //             return res.status(400).send('Username incorrect');
    //         };
    //     }
    // );