const express = require('express');
const { isLogined } = require('../passport/checklogin');

const db_user = require('../../models/index').user;

// routers
const router = express.Router(); // INDEX ROUTER

router.get('/', isLogined, function (req, res, next) {

   const id = req.session.passport.user;
   db_user.findOne({ where: id })
   .then(find_user => {
      res.send({
         email: find_user.email,
         nickname: find_user.nickname,
         username: find_user.username
      });
   })
   .catch(err => {
      console.log(err);
      next(err);
   });
});

router.get('/history', isLogined, function (req, res, next) 
{
   const guid = req.query.id;
   const type = req.query.type;

   const id = req.session.passport.user;
   db_user.findOne({ where: id })
   .then(find_user => {
      if(guid !== undefined && type !== undefined) {
         const find_str = '!' + type + '$' + guid;
         if(find_user.historys !== null && find_user.historys.indexOf(find_str) !== -1) {
            res.send({ result : true });
         }
         else {
            res.send({ result : false });
         }
      }
      else {
         console.log("because can't travel invalid value");
         res.send({ result : false });
      }
   })
   .catch(err => {
      console.log(err);
      next(err);
   });
});

router.get('/search', function (req,res,next) 
{   
   db_user.findOne({ where: {id : req.query.userid }})
   .then(function (find_user) {
      res.send({
         email: find_user.email,
         nickname: find_user.nickname,
         username: find_user.username   
      })
   })
   .catch((err) => {
      res.send({
         nickname : 'invaild user',
         err : err
      })
   });
})

// 1. user info update (일부분 갱신, patch 명령 사용)
router.patch('/:email', isLogined, function(req, res, next) 
{
   const new_email = req.query.email;
   const new_nickname = req.query.nickname;
   const new_username = req.query.username;

   if(new_email === undefined ||
      new_nickname === undefined ||
      new_username === undefined) {
         alert("비어있는 값이 존재할 경우 변경이 불가능 합니다");
         return;
      }

   const id = req.session.passport.user;

   db_user.update({
      email: new_email,
      nickname: new_nickname,
      username: new_username,
   }, { where: { id: id } })
   .then(result => {
      res.send({ result: result });
   })
   .catch(err => {
      console.log("error");
      next(err);
   });   

   return;
});

module.exports = router;