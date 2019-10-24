const express = require('express');
const { verifyToken } = require('../passport/checklogin');

const db_user = require('../../models/index').user;

// routers
const router = express.Router(); // INDEX ROUTER

router.get('/', verifyToken, function (req, res, next) {

   const id = req.decoded.id;

   if(id === undefined || id === null)
      return res.status(404).send("invalid id");

   db_user.findOne({ where: {id : id} })
   .then(find_user => {
      res.send({
         email: find_user.email,
         nickname: find_user.nickname,
         username: find_user.username,
         profileimg : find_user.profileimg,
         level : req.decoded.level
      });
   })
   .catch(err => {
      console.log(err);
      next(err);
   });
});

// delete user
router.delete('/', verifyToken, function (req, res, next) {

   const id = req.decoded.id;

   if(id === undefined || id === null)
      return res.status(404).send("invalid id");

   db_user.destroy({ where: {id : id} })
   .then(find_user => {
      if(!find_user) {
         return res.status(404).send("Failed destroy user : " + String(id));
      }
      else {
         console.log("Destroy user : " + String(id));
         req.logOut();
         res.clearCookie('userdata');
         res.clearCookie('jwttoken');
         res.send({ result : true });
      }
   })
   .catch(err => {
      console.log(err);
      next(err);
   });
});

router.get('/history', verifyToken, function (req, res, next) 
{
   const guid = req.query.id;
   const type = req.query.type;
   const id = req.decoded.id;

   if(id !== undefined || id !== null) {
      db_user.findOne({ where: {id : id} })
      .then(find_user => {
         if(guid !== undefined && type !== undefined) {
            const find_str = '!' + type + '$' + guid;
            if(find_user.historys !== null && find_user.historys.indexOf(find_str) !== -1) {
               res.send({ result : true });
            }
            else {
               res.send({result : false});
            }
         }
         else {
            console.log("because can't travel invalid value");
            res.status(404).send('invalid value');
         }
      })
      .catch(err => {
         console.log(err);
         res.status(404).send('invalid user');
      });      
   }
   else {
      console.log('Not yet login');
      res.status(404).send('Not yet login');
   }
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
router.patch('/', verifyToken, function(req, res, next) 
{
   const new_nickname = req.query.nickname;
   const new_username = req.query.username;
   const new_img = req.query.profileimg;

   if(new_nickname === undefined ||
      new_username === undefined) {
         alert("비어있는 값이 존재할 경우 변경이 불가능 합니다");
         return;
      }

   const id = req.decoded.id;

   db_user.update({
      nickname: new_nickname,
      username: new_username,
      profileimg : (new_img) ? new_img : ""
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