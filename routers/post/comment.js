const express = require('express');
const Sequelize = require('sequelize');
const op = Sequelize.Op;
const db_user = require('../../models/index').user;
const db_comment = require('../../models/index').cmt;
const db_post = require('../../models/index').post;

const { verifyToken } = require('../passport/checklogin');

// routers
const router = express.Router(); // INDEX ROUTER

// REST API
// 1. comment Read (GET)
router.get('/', verifyToken, function (req, res, next) 
{
    const guid = req.query.guid;
    const id = req.decoded.id;

    if(guid !== undefined && guid !== null)
    {
        db_post.findOne({ include: { model : db_comment, where : { postId : guid } } })
        .then(response => {
            console.log(response);
            res.send({ data : response.comments });
        })
        .catch(err => {
            console.log('Not Found Parent Post : ' + guid + err)
            res.send({ data : 'none' });
        })
    }
});

// 2. comment Apply (POST)
router.post('/', verifyToken, function(req, res, next) 
{
    const postid = req.query.postId;
    const guid = req.query.guid;
    const content = req.query.content;
    const id = req.decoded.id;

    if(content && guid && postid && id) {
        db_comment.create({
            guid : guid,
            writer : parseInt(id),
            content : content,
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
    else {
        console.log("FAIL APPLY COMMENT");
        res.status(404).send();
    }
});

// 3. comment Edit (PATCH)
router.patch('/', verifyToken, function(req, res, next) 
{
    const id = req.decoded.id;
    const guid = req.query.guid;

    if(guid && req.query.content) {
        db_comment.update({
            content: req.query.content,
        }, { where: { 
                guid : guid, 
                writer : id, 
            } })
        .then(response => {
            console.log('post updated : ' + guid);
            if(response[0] === 0) {
                res.status(404).send("you're not assigned update comment");
            }
            else
                res.send({ result: true });
        })
        .catch(err => {
            console.log("Can't update Post update : " + guid);
            res.status(404).send("Can't update comment");
        });
    }
});

// 4. comment Delete (DELETE)
router.delete('/', verifyToken, function(req, res, next) 
{
    const id = req.decoded.id;
    const guid = req.query.guid;

    if(guid) {
        db_comment.destroy({ where: { guid : guid, writer : id } })
        .then(response => {
            if(!response) {
                res.status(404).send("Wasn't destroid comment (maybe, you aren't writer)");
            }
            console.log('comment destroied : ' + response);
            res.send({ result: true });
        })
        .catch(err => {
            console.log("Can't destroy comment : " + err);
            res.status(404).send();
        });
    }
});

// other 1. increase comment Hearts (patch)
router.patch('/increase', verifyToken, function (req, res, next) 
{
    const guid = req.query.id;
    const num = req.query.num;
    const id = req.decoded.id;

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
                            let historyBase = (find_user.historys === null) ? "" : find_user.historys;
                            db_user.update({
                                historys: historyBase + '!heart$' + guid,
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
                        res.status(404).send("Can't update comment : " +err);
                    })
                })
                .catch(err => {
                    console.log("Can't increase heart");
                    res.status(404).send("Can't increase heart : " + err);
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