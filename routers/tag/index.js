const express = require('express');
const { verifyToken } = require('../passport/checklogin');

const db_tag  = require('../../models/index').hashtag;

// routers
const router = express.Router(); // INDEX ROUTER

// 1. get tags (GET)
router.get('/', function (req, res, next) 
{
    db_tag.findAll({attributes: ['name'], where : { category : req.query.category}})
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
        const category = (req.decoded.level === 'admin') ? req.query.category : 'board';

        await db_tag.findOne({
            where : {name : req.query.name, category : category}})
        .then(result => {
            console.log("hashtag - duplicate name!"); 
            next(new Error("hashtag - duplicate name!"));
        })

        await db_tag.create({
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

    process();
}); 

// 3. delete tags (DELETE)
router.delete('/', verifyToken, function (req, res, next) 
{
    const category = (req.decoded.level === 'admin') ? req.query.category : 'board';

    db_tag.destroy({
        where : { name : req.query.name, category : category }
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