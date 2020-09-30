const router = require('express').Router();
const fs = require('fs');
const fgc = require('file-get-contents');
const mkDir = require('make-dir');
const mammoth = require('mammoth');
const jwt = require('jsonwebtoken');
const Metadata = require('../model/Metadata');

const dir = 'public/files';
const src = /src=(["|\'])(?!http)(?!#footnote)/g;
const href = /href=(["|\'])(?!http)(?!#footnote)/g;



router.get('/list', async (req, res) => {
    try {
        const token = req.cookies.auth_token;
        if(!token) res.status(400).send("No token provided");

        const verified = jwt.verify(token,process.env.TOKEN_SECRET);
        const username = verified.username;
        let su = false;
        const out = [];

        if(username === "ProgettoAldoMoro" || username === "Francesco Paolucci") su = true; 

        fs.readdir(dir, (err,files) => {
            if (err) return console.log('ERROR',err);
            
            files.forEach(file => {
                if(file.substring(0,1) !== '.'){
                    let split = file.split("_");
                    
                    let user = split[0];
                    let sezione = split[1]
                    let volume = split[2]
                    let tomo = split[3]
                    let opera = split[4] //.replace(/([A-Z])/g, ' $1').trim()
                    let status = split[5];

                    let obj = {
                        url: file,
                        label: opera,
                        stat: status
                    };

                    if(user === username && su == false) out.push(obj);
                    if(su == true) {
                        obj.user = user;
                        out.push(obj)}
                } 
            })

            let final = {
                su: su,
                list: out
            }

            return res.send(final);
        })
    } catch (err) {
        res.status(400).send(err);
    }
});

router.get('/load', async (req, res) => {
    try {
        var json = {
            "metadata" : {},
            "html" : ""
        };

        let files = 'files/';
        let fileName = req.query.file;
        let content = await fgc(`${dir}/${fileName}/index.html`);
        
        content = content.replace(src,`src=$1${files}${fileName}/`);
        content = content.replace(href,`href=$1${files}${fileName}/`);

        json.html = content;

        //res.set('Content-Type: text/html');
        //Check metadata
        let split = fileName.split('_')
        const objId = split[6];

        if(!objId) return res.send(json);

        await Metadata.findOne({_id: objId}, function(err, data){
            if(err) return res.status(404).send("ID dell'opera non valido")
            
            json.metadata = data;
            return res.send(json);
        })
    } catch (err) {
        res.status(400).send(err);
    }
});

router.post('/upload', async (req,res) => {
    try{
        const token = req.cookies.auth_token;
        if(!token) res.status(400).send("No token provided");

        const verified = jwt.verify(token,process.env.TOKEN_SECRET);
        const username = verified.username;

        let opera = req.body.opera;
        let sez = req.body.sez;
        let vol = req.body.vol;
        let tom = req.body.tom;
        let fileName = `${username}_sez${sez}_vol${vol}_tom${tom}_${opera}_default`

        let path = `${dir}/${fileName}`;
        let htmlPath = `${path}/index.html`;
        let content;

        if (opera !== ""){
            if(!fs.existsSync(path)){
                await mkDir(path);
            }
        }
        //Conversione da DOCX a HTML
        if(req.files && req.body.type.match('docx')){
            
            let docFile = req.files.file;
            
            const result = await mammoth.convertToHtml({buffer: docFile.data});
            content = await result.value;

        }else{
            
            let newPath = `files/${fileName}`;
            
            let out = req.body.content;
            let regex = new RegExp(newPath,'g');

            content = out.replace(regex,"");
            content.replace(regex,"");
        }

        if(content!== "" && !content.includes("Key Words In Context")){
            fs.writeFile(htmlPath,content, (err) => {
                if(err) return res.status(400).send(`File ${opera} non salvato corretamente`);
            });
            return res.send(`File ${opera} salvato correttamente in ${htmlPath}`);
        };

        return res.send('File empty');

    }catch(err){
        res.status(400).send(err);
    }
});

router.post('/save' , async (req,res) => {
    
    try{
        let filename = req.body.filename;
        let path = `${dir}/${filename}`;
        let htmlPath = `${path}/index.html`;
        let content;

        if (filename !== ""){
            if(!fs.existsSync(path)){
                await mkDir(path);
            }
        }

        let newPath = `files/${filename}`;

        let out = req.body.content;
        let regex = new RegExp(newPath,'g');

        content = out.replace(regex,"");
        content.replace(regex,"");

        if(content!== "" && !content.includes("Key Words In Context")){
            fs.writeFile(htmlPath,content, (err) => {
                if(err) return res.status(400).send(`File non salvato corretamente`);
            });
            return res.send(`File salvato correttamente in ${htmlPath}`);
        };

        return res.send('File empty');

    }catch(err){
        res.status(400).send(err)
    }
})

router.post('/change' , (req,res) => {

    let fileName = req.body.file;
    let status = req.body.status;
    let newFileName, substring, split, old_status;

    switch(status) {
        case 'default':
            split = fileName.split('_');
            old_status = split[5];
            
            newFileName = `${split[0]}_${split[1]}_${split[2]}_${split[3]}_${split[4]}_default_${split[6]}`

            fs.rename(`${dir}/${fileName}`, `${dir}/${newFileName}` , function(err) {
                if ( err ) return res.status(400).send(`File ${fileName} non trovato`);
                return res.send(newFileName)
            });
            break
        case 'working':
            split = fileName.split('_');
            old_status = split[5];

            //substring = fileName.substring(0, fileName.length - old_status.length);
            //newFileName = substring.concat('working');
            newFileName = `${split[0]}_${split[1]}_${split[2]}_${split[3]}_${split[4]}_working_${split[6]}`

            fs.rename(`${dir}/${fileName}`, `${dir}/${newFileName}` , function(err) {
                if ( err ) return res.status(400).send(`File ${fileName} non trovato`);
                return res.send(newFileName)
            });
            break 
        case 'done':
            split = fileName.split('_');
            old_status = split[5];

            newFileName = `${split[0]}_${split[1]}_${split[2]}_${split[3]}_${split[4]}_done_${split[6]}`
            
            fs.rename(`${dir}/${fileName}`, `${dir}/${newFileName}` , function(err) {
                if ( err ) return res.status(400).send(`File ${fileName} non trovato`);
                return res.send(newFileName)
            });
            break 
    }

})

module.exports = router; 