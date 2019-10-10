const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { isLogined } = require('../passport/checklogin');

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

router.post('/', isLogined, uploadSetting.single('img'), (req,res) => {
    console.log("UPLOAD file : " + req.file);
    res.send({url : req.file.filename})
})

router.delete('/', isLogined, (req,res) => {
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