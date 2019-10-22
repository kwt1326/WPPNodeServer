const express = require('express');
const { verifyToken } = require('../passport/checklogin');

const db_tag  = require('../../models/index').hashtag;

// routers
const router = express.Router(); // INDEX ROUTER

// 1. get tags (GET)
router.get('/', function (req, res, next) 
{
    db_tag.findAll({attributes: ['name']})
    .then(tags => {
       res.send({
         tags: tags,
       });
    })
    .catch(err => {
       console.log(err);
       next(err);
    });
});

// 2. add tags (POST)
router.post('/', verifyToken, function (req, res, next) 
{
    async function process () 
    {
        await db_tag.findOne({
            where : {name : req.query.name}})
        .then(result => {
            if(result === null) {
                db_tag.create({
                    name : req.query.name
                })
                .then(result => {
                    res.send(result);
                })
                .catch(err => {
                   console.log(err);
                   res.status(400).send("Can't post request 'add tag' : " + err);
                });        
            }
            else {
                console.log("hashtag - duplicate name!"); 
                res.status(400).send("Can't post request 'add tag' : duplicate");
            }
        })
    }

    process();
}); 

// 3. delete tags (DELETE)
router.delete('/', verifyToken, function (req, res, next) 
{
    db_tag.destroy({
        where : { name : req.query.name }
    })
    .then(result => {
        res.send(result);
    })
    .catch(err => {
       console.log(err);
       res.status(400).send("Can't delete request : " + err);
    });
}); 

module.exports = router;