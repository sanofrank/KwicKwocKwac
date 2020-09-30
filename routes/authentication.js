const router = require('express').Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const verify = require('./verifyToken');
const nodemailer = require('nodemailer');
const User = require('../model/User');
const { loginValidation, registerValidation, changePassValidation } = require('../validation');

router.get('/index', verify, (req,res) => {
    res.render("index.html");
})

router.post('/change_password', async (req,res) => {

    const token = req.cookies.auth_token;
    if(!token) res.status(400).send("No token provided");

    const verified = jwt.verify(token,process.env.TOKEN_SECRET);
    const objID = verified.id;

    const change = req.body;

    const {error} = changePassValidation(change);
    if(error) return res.status(400).send(error.details[0].message);

    //HASH PASSWORDS
    const salt = await bcrypt.genSalt(10); //random generated data
    const hashPassword = await bcrypt.hash(req.body.new_pass,salt); //combines salt to hashes password

    const update = await User.findByIdAndUpdate({_id: objID},{password: hashPassword}, function(err,data){
        if(err) return res.status(400).send("Non è possibile cambiare password")

        return res.send("Password cambiata con successo.");
    })
})

router.post('/login', async (req,res) => {

    const login = req.body;
    
    //MONGODB LOGIN
    //Validate data
    const {error} = loginValidation(login);
    if(error) return res.status(400).send(error.details[0].message); //bad request to show just the message error

    //Checking if username exist
    const user = await User.findOne({name: req.body.username}); //check in the DB
    if(!user) return res.status(400).send('Il nome utente o la password non sono validi.');

    //Password is correct
    const validPass = await bcrypt.compare(req.body.password,user.password); //combine the password gave vs the one we stored
    if(!validPass) return res.status(400).send('Il nome utente o la password non sono validi.');

    //Create and assign token
    const token = jwt.sign({id: user._id, username: user.name},process.env.TOKEN_SECRET); //pass some data to the token
    //res.header('auth-token',token).send(token);
    res.cookie('auth_token', token, 
    {
        expires: new Date(Date.now() + 9000000),        
        httpOnly: true,
        //secure: true
    })
    return res.send(user.name);
});

router.post('/register', async (req,res) => { // async finchè aspettiamo il salvataggio 
    //VALEDATE DATA
    const {error} = registerValidation(req.body);
    if(error) return res.status(400).send(error.details[0].message); //bad request to show just the message error

    //CHECKING USER ALREADY IN DATABASE
    const emailExist = await User.findOne({email: req.body.email}); //check in the DB
    if(emailExist) return res.status(400).send('Email already exists');

    //HASH PASSWORDS
    const salt = await bcrypt.genSalt(10); //random generated data
    const hashPassword = await bcrypt.hash(req.body.password,salt); //combines salt to hashes password

    //CREATE A NEW USER
    const user = new User ({
        name: req.body.name,
        email: req.body.email,
        password: hashPassword 
    });
    try{
    const savedUser = await user.save();
    
    //Gender
    const gender = req.body.gender
    var html_body;

    if(gender === 'm'){
        html_body = `
        Carissimo ${req.body.name},<br>
        <br>
        le comunichiamo che è stato registrato alla piattaforma di marcatura <b>KwicKwocKwac</b> per il progetto Aldo Moro con le seguenti credenziali:<br>
        <br>
        <b>Nome utente</b>: ${req.body.name}<br>
        <b>Password</b>: ${req.body.password}<br>
        <br>
        Una volta eseguito l'accesso alla piattaforma sarà poi possibile cambiare password cliccando nell'icona Utente in alto a destra.<br>
        <br>
        Un cordiale saluto,<br>
        Progetto Aldo Moro
    `
    }else{
        html_body = `
        Carissima ${req.body.name},<br>
        <br>
        le comunichiamo che è stata registrata alla piattaforma di marcatura KwicKwocKwac per il progetto Aldo Moro con le seguenti credenziali:<br>
        <br>
        <i>Nome utente</i>: ${req.body.name}<br>
        <i>Password</i>: ${req.body.password}<br>
        <br>
        Una volta eseguito l'accesso alla piattaforma sarà poi possibile cambiare password cliccando nell'icona Utente in alto a destra.<br>
        <br>
        Un cordiale saluto,<br>
        Progetto Aldo Moro
    `
    }

    let transporter = nodemailer.createTransport({
        host: "outlook.office365.com",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: "francesco.paolucci7@unibo.it", // generated ethereal user
          pass: "IKnowIt'sOver86", // generated ethereal password
        },
      });

    // send mail with defined transport object
    let info = await transporter.sendMail({
        from: 'aldomoro@unibo.it', // sender address
        to: `${req.body.email}`, // list of receivers
        subject: "Progetto Aldo Moro", // Subject line
        html: html_body
    });
    console.log("Message sent: %s", info.messageId);

    return res.send('Registered');
    }catch(err){
        res.status(400).send("catch error",err);
    }
});

router.get('/verify', verify, (req,res) => {
    res.json({editmode: true});
});

module.exports = router;