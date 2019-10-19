const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { verifyToken } = require('../passport/checklogin');

const fs = require('fs');
fs.readdir('./public/images', (err) => {
    if(err) {
        fs.mkdir('./public/images', {recursive: true}, err => {})
    }
})

const uploadSetting = multer({
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

// Multer Error handling
router.post('/', verifyToken, uploadSetting.single('img'), (err, req, res, next) => {
    if(err) { res.status(409).send("File Error : " + err); }
})

// Success upload
router.post('/', verifyToken, uploadSetting.single('img'), (req, res) => {
    console.log("UPLOAD file : " + req.file);
    res.send({ url: req.file.filename })
})

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
})

module.exports = router;