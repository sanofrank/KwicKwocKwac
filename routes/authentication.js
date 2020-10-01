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

    //Email template
    const email_tpl = `
    <!DOCTYPE html>
    <html xmlns="http://www.w3.org/1999/xhtml">
    <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <link href="https://fonts.googleapis.com/css2?family=Montserrat&display=swap" rel="stylesheet">
    <title>Demystifying Email Design</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <style>
        .name{
            font-family: 'Montserrat', sans-serif;
        }
    </style>
    </head>
    <body style="margin: 0; padding: 0;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%"> 
            <tr>
                <td style="padding: 10px 0 30px 0;">
                    <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="border: 1px solid #cccccc; border-collapse: collapse; background-color:white; color:black">
                        <tr>
                            <td align="center" style="padding: 40px 0 30px 0; font-size: 28px; font-weight: bold; font-family: Arial, sans-serif;">
                                <div id="title-div">
                                    <h1 id="title" style="font-size: 200%; margin:0; color:#343B3F" class="name">KwicKwocKwac</h1>
                                    <hr style="border: 2px solid #0368D9; margin-top: 1px; margin-bottom: 1px; width:60%;"/>
                                    <h2 id="subtitle" style="font-size: 90%; margin:0; color:#343B3F"class="name">progetto Aldo Moro</h2>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td bgcolor="#ffffff" style="padding: 40px 30px 40px 30px;background-color:white; color:black">
                                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="">
                                    <tr>
                                        <td style="font-family: Arial, sans-serif; font-size: 24px;">
                                            <b>Credenziali di accesso</b>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 20px 0 30px 0; color: #153643; font-family: Arial, sans-serif; font-size: 16px; line-height: 20px;">
                                            Carissim${req.body.gender} ${req.body.name},<br>
                                            <br>
                                            le comunichiamo che è stat${req.body.gender} registrat${req.body.gender} alla piattaforma di marcatura <b><a href="http://aldomorodigitale.unibo.it/login">KwicKwocKwac</a></b> per il progetto Aldo Moro con le seguenti credenziali:<br>
                                            <br>
                                            <b>Nome utente</b>: ${req.body.name}<br>
                                            <b>Password</b>: ${req.body.password}<br>
                                            <br>
                                            Una volta eseguito l'accesso alla piattaforma sarà poi possibile cambiare password cliccando nell'icona Utente in alto a destra.<br>
                                            <br>
                                            In questa mail sono anche presenti come allegato le <b>linee guida</b> da consultare come preparazione alla marcatura dei testi e il <b>manuale d'istruzione</b> della piattaforma.<br>
                                            <br>
                                            Clicchi <a href="http://aldomorodigitale.unibo.it/login">qui</a> per accedere.<br>
                                            <br>
                                            Un cordiale saluto,<br>
                                            Progetto Aldo Moro                                    
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td bgcolor="#0368d9" style="padding: 30px 30px 30px 30px;">
                                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                    <tr>
                                        <td style="color: #ffffff; font-family: Arial, sans-serif; font-size: 14px;" width="75%">
                                            &reg; ProgettoAldoMoro2020<br/>
                                        </td>                                    
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `
    try{

    var guide = 'LineeGuidaTestiMoro.pdf'
    var manual = 'Manuale_1.0.pdf'

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
        subject: "Credenziali Progetto Aldo Moro", // Subject line
        html: email_tpl,
        attachments: [{
            filename: 'LineeGuida_ProgettoAldoMoro.pdf',
            path: `./doc/${guide}`,
            contentType: 'application/pdf'
          },
        {
            filename: 'Manuale_KwicKwocKwac_1.0.pdf',
            path: `./doc/${manual}`,
            contentType: 'application/pdf'
        }]
    });

    const savedUser = await user.save();

    return res.send('Registered');
    }catch(err){
        res.status(400).send(err);
    }
});

router.get('/verify', verify, (req,res) => {
    res.json({editmode: true});
});


module.exports = router;