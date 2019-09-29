const express = require('express');
const bcrypt = require('bcrypt-nodejs');

const Sequelize = require('sequelize');
const op = Sequelize.Op;
const db_user = require('../../models/index').user;
const db_file = require('../../models/index').file;
const db_post = require('../../models/index').post;

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
        return await db_user.findOne({ where : id })
        .then((find_user) => {
            async function findpost() {
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
                            writer: find_user.nickname,
                            views : result.views,
                            hearts : result.hearts,
                        });
                    })
                    .catch(err => {
                        console.log("Not found Post");
                        next(err);
                    });
            }
            return findpost();        
        })
        .catch((err) => {
            console.log("invalid writer");
            next(err);
        })
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
            title : title,
            usehide : usehide,
            password : password,
            content : content,
            category : category,
            userId : id,
            guid : guid
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
    const process = async () => {
        return await db_post.findAndCountAll({
            where : { [op.or]: [{category: 'default'}, {category: '오픈'}]},
        })
        .then(result => {
            res.send({ 
                result: true,
                count : result.count,
                rows : result.rows,
             });
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
        return await db_user.findOne({ where: id })
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

router.use('/files', file_r);
router.use('/comment', comment_r);

module.exports = router;