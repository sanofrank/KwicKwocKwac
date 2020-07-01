const router = require('express').Router();
const fs = require('fs');
const fgc = require('file-get-contents');
const mkDir = require('make-dir');
const mammoth = require('mammoth');

const dir = 'public/files';
const src = /src=(["|\'])(?!http)(?!#footnote)/g;
const href = /href=(["|\'])(?!http)(?!#footnote)/g;
const out = [];

let listing = new Promise((resolve, reject) => {
    fs.readdir(dir, (err, files) => {
        if (err) return console.log('ERROR',err);
        else {
            files.forEach(file => {
                if (file.substring(0,1) !== '.') {
                    let obj = {
                        url: file,
                        label: file
                    };
                    out.push(obj);
                };
            });
        };
        resolve('success');
    });
});

router.get('/list', async (req, res) => {
    try {
        listing.then(
           res.send(out)
        );
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

            let out = req.body.content;
            let regex = new RegExp(path,'g');

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

module.exports = router; 