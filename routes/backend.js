const router = require('express').Router();
const fs = require('fs');
const fgc = require('file-get-contents');
const mkDir = require('make-dir');
const mammoth = require('mammoth');
const jwt = require('jsonwebtoken');

const dir = 'public/files';
const src = /src=(["|\'])(?!http)(?!#footnote)/g;
const href = /href=(["|\'])(?!http)(?!#footnote)/g;



router.get('/list', async (req, res) => {
    try {
        const token = req.cookies.auth_token;
        if(!token) res.status(400).send("No token provided");

        const verified = jwt.verify(token,process.env.TOKEN_SECRET);
        const username = verified.username;
        const out = [];

        fs.readdir(dir, (err,files) => {
            if (err) return console.log('ERROR',err);
            
            files.forEach(file => {
                let split = file.split("_");

                if(split[0] === username){
                    let volume = split[1];
                    let tomo = split[2];
                    let opera = split[3].replace(/([A-Z])/g, ' $1').trim()
                    let status = split[4];

                    switch(status){
                        case "0":
                            status = "default";
                            break
                        case "1":
                            status = "working";
                            break
                        case "2":
                            status = "done";
                            break
                    }
                    
                    let obj = {
                        url: file,
                        label: opera,
                        stat: status
                    };
                    console.log(obj)
                    out.push(obj);
                }
            })

            return res.send(out);
        })

        // let listing = new Promise((resolve, reject) => {
        //     fs.readdir(dir, (err, files) => {
        //         if (err) return console.log('ERROR',err);
        //         else {
        //             files.forEach(file => {
        //                 if (file.substring(0,1) !== '.') {
        //                     let split = file.split("_");
        //                     console.log("split, username", split, username)
        //                     if(split[0] === username){
        //                         let obj = {
        //                             url: file,
        //                             label: file
        //                         };
        //                         out.push(obj);
        //                     }
        //                 };
        //             });
        //         };
        //         resolve('success');
        //     });
        // });

        // listing.then(
        //    res.send(out)
        // );
    } catch (err) {
        res.status(400).send(err);
    }
});

router.get('/load', async (req, res) => {
    try {
        let files = 'files/';
        let fileName = req.query.file;
        let content = await fgc(`${dir}/${fileName}/index.html`);
        
        content = content.replace(src,`src=$1${files}${fileName}/`);
        content = content.replace(href,`href=$1${files}${fileName}/`);
        
        res.set('Content-Type: text/html');
        res.send(content);
    } catch (err) {
        res.status(400).send(err);
    }
});

router.post('/upload', async (req,res) => {
    try{

        let fileName = req.body.filename;
        let path = `${dir}/${fileName}`;
        let htmlPath = `${path}/index.html`;
        let content;

        if (fileName !== ""){
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
                if(err) return res.status(400).send(`File ${fileName} non salvato corretamente`);
            });
            return res.send(`File ${fileName} salvato correttamente in ${htmlPath}`);
        };

        return res.send('File empty');

    }catch(err){
        res.status(400).send(err);
    }
});

router.post('/change' , (req,res) => {

    let fileName = req.body.file;
    let status = req.body.status;
    let newFileName, substring;

    console.log(req.body);

    switch(status) {
        case 0:
            substring = fileName.substring(0,fileName.length -2);
            newFileName = substring.concat('_0');

            fs.rename(`${dir}/${fileName}`, `${dir}/${newFileName}` , function(err) {
                if ( err ) return res.status(400).send(`File ${fileName} non trovato`);
                return res.send(newFileName)
            });
            break
        case 1:
            substring = fileName.substring(0,fileName.length - 2);
            newFileName = substring.concat('_1');

            fs.rename(`${dir}/${fileName}`, `${dir}/${newFileName}` , function(err) {
                if ( err ) return res.status(400).send(`File ${fileName} non trovato`);
                return res.send(newFileName)
            });
            break 
        case 2:
            substring = fileName.substring(0,fileName.length - 2);
            newFileName = substring.concat('_2');
            
            fs.rename(`${dir}/${fileName}`, `${dir}/${newFileName}` , function(err) {
                if ( err ) return res.status(400).send(`File ${fileName} non trovato`);
                return res.send(newFileName)
            });
            break 
    }

})

module.exports = router; 