const router = require('express').Router();
const Metadata = require('../model/Metadata');
const fs = require('fs');

router.post('/metadata', async (req,res) => { // xasync finchè aspettiamo il salvataggio 

    const dir = 'public/files';

    let file = req.body.file;
    let currPath = `${dir}/${file}`

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

    const savedMetadata = await metadata.save(function(err,data){
        if(err){
            console.log(err);
            return res.status(400).send(err);}

        let id = metadata._id;

        let split = file.split('_');
        let newFilename = `${split[0]}_${split[1]}_${split[2]}_${split[3]}_${split[4]}_${split[5]}_${id}`
        let newPath = `${dir}/${newFilename}`

        fs.rename(currPath, newPath, function(err) {
            if (err) {
            console.log(err)
            } else {
            console.log("Successfully renamed the directory.")
            }
        })
        return res.send('Saved metadata');
    });
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