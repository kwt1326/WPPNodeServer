const express = require('express');
const bcrypt = require('bcrypt-nodejs');

const Sequelize = require('sequelize');
const op = Sequelize.Op;
const db_user = require('../../models/index').user;
const db_post = require('../../models/index').post;
const db_comment = require('../../models/index').cmt;

const { isLogined } = require('../passport/checklogin');

// routers
const router = express.Router(); // INDEX ROUTER
const file_r = require('./files'); // FILES ROUTER
const comment_r = require('./comment'); // COMMENT ROUTER

// REST API
// 1. Post Read (GET)
router.get('/', isLogined, function (req, res, next) 
{
    const guid = req.query.guid;
    const id = req.session.passport.user;

    const process = async () => {
        return await db_post.findOne({ where: { guid : guid }})
        .then(result => {
            res.send({
                content: result.content,
                createdAt: result.createdAt,
                updatedAt: result.updatedAt,
                category: result.category,
                userId: result.userId,
                title: result.title,
                id: result.id,
                views : result.views,
                hearts : result.hearts,
            });
        })
        .catch(err => {
            console.log("Not found Post");
            next(err);
        });
    }

    if(guid !== undefined && guid !== null)
        process();          
});

// 2. Post Apply (POST)
router.post('/', isLogined, function(req, res, next) 
{
    const title = req.query.title;
    const content = req.query.content;
    const usehide = req.query.usehide;
    const password = req.query.password;
    const category = req.query.category;
    const guid = req.query.guid;

    const id = req.session.passport.user;

    const process = async () => {
        return await db_post.create({
            title: title,
            usehide: usehide,
            password: password,
            content: content,
            category: category,
            userId: id,
            guid: guid,
        })
        .then(result => {
            res.send({ result: result });
        })
        .catch(err => {
            console.log("error");
            next(err);
        });
    }

    if(title !== undefined &&
       content !== undefined &&
       category !== undefined)
        process();          
});

// 3. Post Edit (PATCH)
router.patch('/', isLogined, function(req, res, next) 
{
    const guid = req.query.guid;

    const process = async () => {
        return await db_post.update({
        title: req.query.title,
        content: req.query.content,
        category : req.query.category,
        password: req.query.password,
        usehide: req.query.usehide,
        }, { where: { guid : guid } })
        .then(response => {
            console.log('post updated : ' + guid);
            res.send({ result: true });
        })
        .catch(err => {
            console.log("Can't update Post update : " + guid);
            next(err);
        });
    }

    if(guid && req.query.title && req.query.content) {
        process();
    }
});

// 4. Post Delete (DELETE)
router.delete('/', isLogined, function(req, res, next) 
{
    const guid = req.query.guid;

    const process = async () => {
        return await db_post.destroy({ where: { guid : guid } })
        .then(response => {
            console.log('post destroied : ' + guid);
            res.send({ result: true });
        })
        .catch(err => {
            console.log("Can't destroy Post : " + guid);
            next(err);
        });
    }

    if(guid) {
        process();
    }
});

// other 0. post list (get)
router.get('/list', function(req,res,next) 
{
    const category = req.query.category;
    const page = req.query.page - 1;

    const process = async () => {
        return await db_post.findAndCountAll({
            where : { category: category },
        })
        .then(result => {
            const result_rows = result.rows;
            const rowleng = result_rows.length;
            let rows = [];
            let pageleng = (rowleng > 10) ? 10 : rowleng;
            let ofs = rowleng - (page * 10) - 1;

            async function extract () {
                for(let i = 0; i < pageleng; i++) {
                    await db_user.findOne({ where: {id : result.rows[ofs - i].userId} })
                    .then(res_user => {
                        rows[i] = {
                            content : result.rows[ofs - i],
                            writer : res_user.nickname
                        }
                    })
                }
            }

            async function sendrows() {
                await extract();
                res.send({ 
                    result: true,
                    ofs : ofs,
                    count : rowleng,
                    rows : rows,
                 });
            }

            sendrows();
        })
        .catch(err => {
            console.log("error");
            next(err);
        });    
    }
    process();
})

// other 1. increase Views or Hearts (patch)
router.patch('/increase', isLogined, function (req, res, next) 
{
    const guid = req.query.id;
    const num = req.query.num;
    const type = req.query.type;
    const id = req.session.passport.user;

    const process = async () => {
        return await db_user.findOne({ where: {id : id} })
        .then((find_user) => {
            async function dataUpdate() {
                console.log("START HISTORY UPDATE : " + guid);
                return await db_post.findOne({ where: { guid: guid } })
                .then(result => {
                     // UPDATE VIEWS or HEARTS //
                    if (type === 'view') {
                        // VIEWS
                        db_post.update(
                            { views: parseInt(result.views) + parseInt(num) },
                            { where: { guid, guid } })
                        .then((result) => 
                        {
                            // UPDATE USER HISTORY //
                            if(find_user.historys === null || find_user.historys.indexOf('!view$' + guid) === -1) { // Save only first view histroy
                                db_user.update({
                                    historys: find_user.historys + '!view$' + guid,
                                }, { where: { id: id } })
                                .then(response => {
                                    console.log('view history updated');
                                    res.send({ result: true });
                                })
                                .catch(err => {
                                    console.log("Can't update user view history : " + guid);
                                    next(err);
                                });
                            }
                            else {
                                console.log('view history already updated');
                                res.send({ result: false });
                            }
                        })
                        .catch(err => {
                            console.log(err);
                        })
                    }
                    else if (type === 'heart') {
                        // HEARTS
                        db_post.update(
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
                                    console.log("Can't update user heart history : " + guid);
                                    next(err);
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
                                        res.send({ result: false });
                                    })
                                    .catch(err => {
                                        console.log("Can't update user heart history : " + guid);
                                        next(err);
                                    });    
                                }
                                console.log('heart history already updated');
                                res.send({ result: false });
                            }
                        })
                        .catch(err => {
                            console.log(err);
                        })
                    }
                })
                .catch(err => {
                    console.log("Can't increase " + type);
                    next(err);
                });
            }
            return dataUpdate();
        })
        .catch((err) => {
            console.log("invalid writer");
            next(err);
        })
    }

    if(guid !== undefined && guid !== null &&
        num !== undefined && num !== null &&
        type !== undefined && type !== null)
        process();
    else {
        alert('invalid Value');
    }
}) 

// other 2. Post & Comment Read (GET)
router.get('/reading', isLogined, function (req, res, next) 
{
    const guid = req.query.guid;
    const process = async () => {
        await db_post.findOne({ where: { guid : guid }})
        .then(result => { // POST Find
            return Promise.resolve({
                post : {
                    content: result.content,
                    createdAt: result.createdAt,
                    updatedAt: result.updatedAt,
                    category: result.category,
                    userId: result.userId,
                    title: result.title,
                    id: result.id,
                    views : result.views,
                    hearts : result.hearts,
                }
            })
        })
        .catch(err => {
            console.log("Not found Post");
            res.status(404).send('Not found Data : Post');
        })
        .then(result_post => {

            let nickname = "";

            async function finduser () {
                await db_user.findOne({where : {id : result_post.post.userId}})
                .then(res_user => {
                    nickname = res_user.nickname;
                })    
            }

            finduser();

            async function process () { // COMMENT Find
                await db_post.findOne({ include: { model : db_comment, where : { postId : result_post.post.id } } })
                .then(result_comment => {
                    let comments = result_comment.comments;
                    let expand = [];
                    async function writersimg() {
                        for(let i = 0 ; i < comments.length ; ++i) {
                            if(comments[i].writer) {
                                await db_user.findOne({where : {id : comments[i].writer}})
                                .then(result_user => {
                                    expand[i] = {
                                        profileimg : result_user.profileimg,
                                        nickname : result_user.nickname
                                    }
                                })
                            }
                        }
                    }
                    writersimg()
                    .then(result => {
                        console.log("PART OF ERROR : " + result_comment.nickname);
                        res.send({ 
                            post : result_post.post,
                            post_writer : nickname,
                            comment : comments,
                            comment_expands : expand
                        })
                    })
                    .catch(err => {
                        res.send({ 
                            post : result_post.post,
                            post_writer : nickname,
                            comment : comments,
                        })
                    })
                })
                .catch(err => {
                    console.log(nickname);
                    res.send({ 
                        post : result_post.post,
                        post_writer : nickname,
                    });
                })
            }
            process();
        })
        .catch(err => {
            console.log("Not found Comment");
            res.status(404).send('Not found Data : Comment');
        })
    }

    if(guid !== undefined && guid !== null)
        process();          
});

router.use('/files', file_r);
router.use('/comment', comment_r);

module.exports = router;