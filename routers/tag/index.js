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
    let name = req.query.name.split(',');

    // 기존 name 이 중복된 것이 있는지 모두 찾아서 제외 후, bulkCreate 로 일괄 등록
    // bulkCreate 에 updateOnDuplicate 가 있지만, 이 항목은 해당 id 만 중복 검사를 하고 컬럼 값에 대해서는
    // 검사 하지 않기에 중복 검사 루틴을 직접 짜주어야 한다.
    db_tag.findAll({ where : { name : name }})
    .then(async (result) => 
    {
        await result.forEach(elem => {
            const idx = name.findIndex((item) => {return item === elem.name});
            name.splice(idx, 1);
        })

        let names = new Array();
        await name.forEach(elem => {
            names.push({name : elem});
        });

        db_tag.bulkCreate(names, {
            fields:["name"] ,
            updateOnDuplicate: ["name"] 
        })
        .then(result => {
            console.log("Success Apply tags");
            res.send(result);
        })
        .catch(err => {
            console.log("tag add error : " + err);
            res.status(400).send("tag add error : " + err);
        })    
    })
    .catch(err => {
        console.log("tag find error : " + err);
    })
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