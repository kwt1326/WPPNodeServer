const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary');
const { verifyToken } = require('../passport/checklogin');

const fs = require('fs');
fs.readdir('./public/images', (err) => {
    if(err) {
        fs.mkdir('./public/images', {recursive: true}, err => {console.log(err);})
    }
});

// single local storage
const singlelocal = multer({
    storage : multer.diskStorage({
        destination(req, file, cb) {
            cb(null, './public/images/');
        },
        filename(req,file,cb) {
            const ext = path.extname(file.originalname);
            cb(null, path.basename(file.originalname, ext) + Date.now() + ext);
        },
    }),
    limits : {fileSize : 5 * 1024 * 1024},
});

// single memory storage
const singlememory = multer({
    storage : multer.memoryStorage(),
    limits : {fileSize : 5 * 1024 * 1024},
});

// Multer Error handling // if error handling, must have 4 parameter.
router.post('/', verifyToken, singlelocal.single('img'), (err, req, res, next) => {
    if(err) { res.status(409).send("File Error : " + err); }
});

// Success upload
router.post('/', verifyToken, singlelocal.single('img'), (req, res) => {
    console.log("UPLOAD file : " + req.file);
    res.send({ url: req.file.filename })
});

// production - cloudinary uploader
router.post('/ci', verifyToken, singlememory.single('img'), (err,req,res,next) => {
    if(err) { res.status(409).send("File Error : " + err); }
});

router.post('/ci', verifyToken, singlememory.single('img'), (req,res) => 
{
    const file = req.file;
    const newDate = Date.now();
    const ext = path.extname(file.originalname);
    const newName = path.basename(file.originalname, ext) + newDate;
    const stream = cloudinary.uploader.upload_stream(function(result) {
        console.log("UPLOAD file : " + newName);
        res.send({url : result.url});
    }, {public_id: newName});
    stream.write(file.buffer);
    stream.end();
});

// local destroy (single)
router.delete('/', verifyToken, (req,res) => {
    fs.unlink('./public/images/' + req.query.name, function(err) {
        if(err) {
            console.log(err);
        }
        else {
            res.send ({
                status: "200",
                responseType: "string",
                response: { result : "success removed image" }
            });
        }
    });
});

// cloudinary Cloud Storage 에서 이미지 삭제 (single)
router.delete('/ci', verifyToken, (req,res) => {
    const destroyName = req.query.destroyId;
    cloudinary.uploader.destroy(destroyName, () => {console.log(`Destroy file : ${destroyName}`)});
});

module.exports = router;