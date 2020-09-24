const router = require('express').Router();
const Metadata = require('../model/Metadata');
const fs = require('fs');
const { metadataValidation } = require('../validation')

router.get('/check_metadata', async (req,res) => {
    const objId = req.query.objId;

    if(!objId) return res.status(400).send("ID dell'opera non presente");

    await Metadata.findOne({_id: objId}, function(err, metadata){
        if(err) return res.status(404).send("ID dell'opera non valido")
        
        return res.send(metadata);
    })
});

router.post('/update_metadata', async (req,res) => {
    
    const {error} = metadataValidation(req.body);
    if(error) return res.status(400).send(error.details[0].message);

    const objId = req.body.objId;
    let meta = {
        ident: req.body.ident,
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
    }

    const newMeta = await Metadata.findByIdAndUpdate({_id: objId}, meta, function(err,result){
        if(err) return res.status(400).send("Non sono riuscito ad aggiornare i metadati")
        })

    return res.send("Metadati aggiornati");

});

router.post('/save_metadata', async (req,res) => { // xasync finchè aspettiamo il salvataggio 

    const {error} = metadataValidation(req.body);
    if(error) return res.status(400).send(error.details[0].message);

    const dir = 'public/files';

    let file = req.body.file;
    let currPath = `${dir}/${file}`

    const metadata = new Metadata ({                    // crea un nuovo record di metadati
        ident: req.body.ident,
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
        return res.send(newFilename);
    });
});

router.get('/getId', async (req, res) => {
    const id = req.query.id
    let metadata = await Metadata.findById(id)
    let true_metadata = JSON.stringify(metadata)
    return res.send(true_metadata)
})

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