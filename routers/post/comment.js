const express = require('express');
const Sequelize = require('sequelize');
const op = Sequelize.Op;
const db_user = require('../../models/index').user;
const db_comment = require('../../models/index').cmt;
const db_post = require('../../models/index').post;

const { isLogined } = require('../passport/checklogin');

// routers
const router = express.Router(); // INDEX ROUTER

// REST API
// 1. comment Read (GET)
router.get('/', isLogined, function (req, res, next) 
{
    const guid = req.query.guid;
    const id = req.session.passport.user;

    const process = async () => {
        return await db_post.findOne({ include: { model : db_comment, where : { postId : guid } } })
        .then(response => {
            console.log(response);
            res.send({ data : response.comments });
        })
        .catch(err => {
            console.log('Not Found Parent Post : ' + guid + err)
            res.send({ data : 'none' });
        })
    }

    if(guid !== undefined && guid !== null)
        process();          
});

// 2. comment Apply (POST)
router.post('/', isLogined, function(req, res, next) 
{
    const postid = req.query.postId;
    const guid = req.query.guid;
    const content = req.query.content;
    const usehide = req.query.usehide;
    const id = req.session.passport.user;

    const process = async () => {
        await db_comment.create({
            guid : guid,
            writer : parseInt(id),
            content : content,
            usehide : usehide,
            postId : postid,
        })
        .then(result => {
            res.send({ result: result });
        })
        .catch(err => {
            console.log("error");
            res.status(404).send('Not found Data : Comment');
        });    
    }

    if(!content || !guid || !postid || !id) {
        console.log("FAIL APPLY COMMENT");
        return;
    }

    process();          
});

// 3. comment Edit (PATCH)
router.patch('/', isLogined, function(req, res, next) 
{
    const guid = req.query.guid;

    // const process = async () => {
    //     return await db_post.update({
    //     title: req.query.title,
    //     content: req.query.content,
    //     category : req.query.category,
    //     password: req.query.password,
    //     usehide: req.query.usehide,
    //     }, { where: { guid : guid } })
    //     .then(response => {
    //         console.log('post updated : ' + guid);
    //         res.send({ result: true });
    //     })
    //     .catch(err => {
    //         console.log("Can't update Post update : " + guid);
    //         next(err);
    //     });
    // }

    // if(guid && req.query.title && req.query.content) {
    //     process();
    // }
});

// 4. comment Delete (DELETE)
router.delete('/', isLogined, function(req, res, next) 
{
    const id = req.session.passport.user;
    const guid = req.query.guid;

    const process = async () => {
        return await db_comment.destroy({ where: { guid : guid, userId : id } })
        .then(response => {
            console.log('comment destroied : ' + guid);
            res.send({ result: true });
        })
        .catch(err => {
            console.log("Can't destroy comment : " + guid);
            next(err);
        });
    }

    if(guid) {
        process();
    }
});

module.exports = router;