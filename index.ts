import * as express from 'express'
import * as multer from 'multer'
import * as cors from 'cors'
import * as fs from 'fs'
import * as path from 'path'
import * as Loki from 'lokijs'
import { imageFilter, loadCollection, cleanFolder } from './utils';

// setup
const DB_NAME = 'db.json';
const COLLECTION_NAME = 'images';
const UPLOAD_PATH = 'uploads';
//const upload = multer({ dest: `${UPLOAD_PATH}/`, fileFilter: imageFilter });
const db = new Loki(`${UPLOAD_PATH}/${DB_NAME}`, { persistenceMethod: 'fs' });

// optional: clean all data before start
// cleanFolder(UPLOAD_PATH);

// app

//const multer = require('multer')
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, `${UPLOAD_PATH}/`)
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
})
const upload = multer({storage: storage})




const app = express();
app.use(cors());

app.get('/', async (req, res) => {
    // default route
    res.send(`
        <h1>Demo file upload</h1>
        <p>Please refer to <a href="https://scotch.io/tutorials/express-file-uploads-with-multer">my tutorial</a> for details.</p>
        <ul>
            <li>GET /images   - list all upload images</li>
            <li>GET /images/{id} - get one uploaded image</li>
            <li>POST /profile - handle single image upload</li>
            <li>POST /photos/upload - handle multiple images upload</li>
        </ul>
    `);
})

app.post('/profile', upload.single('avatar'), async (req, res) => {
    try {
        const col = await loadCollection(COLLECTION_NAME, db);
        console.log(req.body.test);
        //const data = col.insert({file:req.file,imprint:req.body.test});
        const data = col.insert(req.file);
        data.text = req.body.test;
        data.imprint = req.body.imprint;
        data.boundingBoxes = req.body.boundingBoxes;

        db.saveDatabase();
        
        let line = data.filename + "," + req.body.test;
        var fs = require('fs');

        // var jsondata = fs.readFileSync(`${UPLOAD_PATH}/` + "test.json",function(err){
        //     if(err){
        //         return console.log(err);
        //     }
        //     console.log("The file was saved!");
        // });
        
        // var json = JSON.parse(jsondata);
        // console.log(json)
        // json.push({
        //     name:data.filename,
        //     imprint:data.imprint,
        //     boundingBoxes:data.boundingBoxes
        // })

        var dataToWrite = {
            name:data.filename,
            imprint:data.imprint,
            boundingBoxes:data.boundingBoxes
        }
        
        console.log(dataToWrite);
        fs.writeFile(`${UPLOAD_PATH}/` +data.filename +".json", JSON.stringify(dataToWrite), function (err) {
            if (err) {
                return console.log(err);
            }
            console.log("The file was saved!");
        });
        res.send({ id: data.$loki, fileName: data.filename, originalName: data.originalname });
         //var json = JSON.parse(jsondata);
        // console.log(json)



        // fs.writeFile(`${UPLOAD_PATH}/` + "test.json",line, function (err) {
        //     if (err) {
        //         return console.log(err);
        //     }

        //     console.log("The file was saved!");
        // });
    } catch (err) {
        res.sendStatus(400);
    }
})

app.post('/photos/upload', upload.array('photos', 12), async (req, res) => {
    try {
        const col = await loadCollection(COLLECTION_NAME, db)
        let data = [].concat(col.insert(req.files));

        db.saveDatabase();
        res.send(data.map(x => ({ id: x.$loki, fileName: x.filename, originalName: x.originalname })));
    } catch (err) {
        res.sendStatus(400);
    }
})

app.get('/images', async (req, res) => {
    try {
        const col = await loadCollection(COLLECTION_NAME, db);
        res.send(col.data);
    } catch (err) {
        res.sendStatus(400);
    }
})

app.get('/images/:id', async (req, res) => {
    try {
        const col = await loadCollection(COLLECTION_NAME, db);
        const result = col.get(req.params.id);

        if (!result) {
            res.sendStatus(404);
            return;
        };

        res.setHeader('Content-Type', result.mimetype);
        fs.createReadStream(path.join(UPLOAD_PATH, result.filename)).pipe(res);
    } catch (err) {
        res.sendStatus(400);
    }
})

app.listen(3000, function () {
    console.log('listening on port 3000!');
})