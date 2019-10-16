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
                userId: result.userId,
                title: result.title,
                views : result.views,
                hearts : result.hearts,
                frontimg : result.frontimg,
                hashtag : result.hashtag,
                id : result.id,
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
    const id = req.session.passport.user;

    const guid = req.query.guid;
    const title = req.query.title;
    const content = req.query.content;
    const usehide = req.query.usehide;
    const password = req.query.password;
    const frontimg = req.query.frontimg;
    const hashtags = req.query.hashtag;
    let   category = req.query.category;

    const process = async () => {
        await db_user.findOne({where : {id : id}})
        .then(res => {
            switch (res.level) {
                case "user" : {
                    category = "default"
                    break;
                }
                case "admin" : {
                    if(hashtags)
                        category = "tagged"
                    break;
                }
            }
            
        })

        return await db_post.create({
            title: title,
            usehide: usehide,
            password: password,
            content: content,
            category: category,
            userId: id,
            hashtag : hashtags,
            guid: guid,
            frontimg : frontimg
        })
        .then(result => {
            res.send({ result: result });
        })
        .catch(err => {
            console.log("error");
            next(err);
        });
    }

    if(guid && title && content)
        process();          
});

// 3. Post Edit (PATCH)
router.patch('/', isLogined, function(req, res, next) 
{
    const guid = req.query.guid;
    const id = req.session.passport.user;

    const process = async () => {
        await db_user.findOne({where : {id : id}})
        .then(res => {
            switch (res.level) {
                case "user" : {
                    category = "default"
                    break;
                }
                case "admin" : {
                    category = "tagged"
                    break;
                }
            }
            
        })

        return await db_post.update({
            title: req.query.title,
            content: req.query.content,
            category : req.query.category,
            password: req.query.password,
            usehide: req.query.usehide,
            frontimg : req.query.frontimg,
            hashtag : req.query.hashtag
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
    const search = req.query.search;
    const category = (search === "board") ? "default" : "tagged";
    const page = req.query.page - 1;
    const where = { category: category };

    if(search !== "board") {
        where['hashtag'] = {
            [op.like]: "%" + search + "%"
        }
    }

    const process = async () => 
    {
        let row_count = 0;

        await db_post.count({
            where : where,
        })
        .then(res => {
            row_count = res;
        })

        let rows = [];
        let ofs = page * 10;
        let pageleng = 10;

        await db_post.findAll({
            offset : ofs,
            limit : pageleng,
            where : where,
            order: [['createdAt', 'DESC']],
        })
        .then(result => {
            async function getrows () {
                for(let i = 0 ; i < result.length ; ++i) {
                    await db_user.findOne({ where: { id: result[i].userId } })
                    .then(result_user => {
                        rows[i] = {
                            content: result[i],
                            writer: result_user.nickname
                        }
                    })
                }    
            }

            async function send () {
                await getrows();
                res.send({
                    result: true,
                    ofs: row_count - (page * 10),
                    count: row_count,
                    rows: rows,
                });        
            }

            send();
        })
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
                            let history = find_user.historys;
                            let matched = history.match(/!view/g); 
                            if (matched !== null) {
                                if(matched.length > 5) { // 최근 view 기록 한도
                                    const search_st = history.indexOf("!view$");
                                    const removeword = history.substring(history.indexOf("!view$"),history.indexOf("!", search_st + 5));
                                    history = history.replace(removeword, "");
                                }   
                            }

                            if(history === null || history.indexOf('!view$' + guid) === -1) { // Save only first view histroy
                                db_user.update({
                                    historys: history + '!view$' + guid,
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
                                // 기존 view 기록 지우고 뒤에 새로 붙임으로써 최근 기록 업데이트
                                const repword = history.replace(("!view$" + String(guid)), "");
                                db_user.update({
                                    historys: repword + '!view$' + guid,
                                }, { where: { id: id } })
                                .then(response => {
                                    console.log('view history updated (already updated)');
                                    res.send({ result: true });
                                })
                                .catch(err => {
                                    console.log("Can't update user view history : " + guid);
                                    next(err);
                                });
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

    if(guid && num && type)
        process();
    else {
        res.status(404).send("invalid Value : " + err);
    }
}) 

// other 2. Post & Comment Read (GET)
router.get('/reading', isLogined, function (req, res, next) 
{
    const guid = req.query.guid;
    async function process () { // COMMENT Find
        await db_post.findOne({ include: [{ model : db_comment }], where : { guid : guid } })
        .then(results => {

            let nickname = "";
            let comments = results.comments;
            let expand = [];

            async function finduser () { // POST WRITER (닉네임 user 에서 변경시 작성 당시와 달라지기 때문에 따로 로드)))
                await db_user.findOne({where : {id : results.userId}})
                .then(res_user => {
                    nickname = res_user.nickname;
                })    
            }
    
            // GET COMMENT expand info
            async function expandinfos() 
            {
                for(let i = 0 ; i < comments.length ; ++i) {
                    if(comments[i]) {
                        await db_user.findOne({where : {id : comments[i].writer}})
                        .then(result_user => {
                            expand[i] = {
                                profileimg : result_user.profileimg,
                                nickname : result_user.nickname,
                            }
                        });        
                    }
                }
            }

            async function createinfo () {
                await finduser();
                expandinfos()
                .then(result => {
                    res.send({ 
                        post : {
                            content: results.content,
                            createdAt: results.createdAt,
                            updatedAt: results.updatedAt,
                            category: results.category,
                            userId: results.userId,
                            title: results.title,
                            views: results.views,
                            hearts: results.hearts,
                            id : results.id,
                        },
                        post_writer : nickname,
                        comment : comments,
                        comment_expands : expand
                    })
                })    
            }

            createinfo();
        })
        .catch(err => { // NO COMMENTS
            res.status(404).send("Not Found Post : " + err);
        })
    }    

    if(guid)
        process();          
});

router.use('/files', file_r);
router.use('/comment', comment_r);

module.exports = router;