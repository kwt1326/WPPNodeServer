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

// other 1. increase comment Hearts (patch)
router.patch('/increase', isLogined, function (req, res, next) 
{
    const guid = req.query.id;
    const num = req.query.num;
    const id = req.session.passport.user;

    const process = async () => {
        return await db_user.findOne({ where: {id : id} })
        .then((find_user) => {
            async function dataUpdate() {
                console.log("START HISTORY UPDATE : " + guid);
                return await db_comment.findOne({ where: { guid: guid } })
                .then(result => {
                    // HEARTS
                    db_comment.update(
                        { hearts: parseInt(result.hearts) + parseInt(num) },
                        { where: { guid, guid } })
                    .then((result) => 
                    {
                        // UPDATE USER HISTORY //
                        if (find_user.historys === null || find_user.historys.indexOf('!heart$' + guid) === -1) {
                            db_user.update({
                                historys: find_user.historys + '!heart$' + guid,
                            }, { where: { id: id } })
                            .then(response => {
                                console.log('heart history updated');
                                res.send({ result: true });
                            })
                            .catch(err => {
                                console.log("Can't update Comment (increase) : " + guid);
                                res.status(404).send("Can't update Comment (increase) : " + err);
                            });
                        }
                        else {
                            if(parseInt(num) < 0) {
                                const arr_split = find_user.historys.split('!heart$' + guid);
                                db_user.update({
                                    historys: arr_split.join(''),
                                }, { where: { id: id } })
                                .then(response => {
                                    console.log('heart history Deleted (decrease)');
                                    res.send({ result: true });
                                })
                                .catch(err => {
                                    console.log("Can't update Comment (decrease) : " + guid);
                                    res.status(404).send("Can't update Comment (decrease) : " + err);
                                });    
                            }
                        }
                    })
                    .catch(err => {
                        console.log("Can't update comment : " + err);
                        res.status(404).send(err);
                    })
                })
                .catch(err => {
                    console.log("Can't increase heart");
                    res.status(404).send(err);
                });
            }
            return dataUpdate();
        })
        .catch((err) => {
            console.log("invalid writer");
            res.status(404).send(err);
        })
    }

    if(guid !== undefined && guid !== null &&
        num !== undefined && num !== null)
        process();
    else {
        alert('invalid Value');
    }
}) 

module.exports = router;