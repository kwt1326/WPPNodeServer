
const Sequelize = require('sequelize');
const db = {};

const sequelize = new Sequelize(
  process.env.DBNAME_CDB, process.env.USER_CDB, process.env.PW_CDB, {
    host : process.env.HOSTING_CDB,
    dialect : 'mysql'
  }
);

// db 객체의 내부 변수가 복수형이 아닌 이유 : 시퀄라이즈에서 지원하는 메소드 명이 복수형으로 사용되기 때문 
// ex) const file = await post.find({where : {id : id}});
// file.get <- get 뒤에 관계된 내부변수 + 복수형 스펠링 (s) = file.getposts() 이렇게 만들어짐
// through 옵션 => 다대다일 경우 쓰이는 듯

db.sequelize = sequelize;
db.Sequelize = Sequelize;
db.user = require('./users')(sequelize, Sequelize);
db.post = require('./post')(sequelize, Sequelize);
db.cmt = require('./comment')(sequelize, Sequelize);
db.file = require('./files')(sequelize, Sequelize);
db.hashtag = require('./hashtag')(sequelize, Sequelize);
db.user.hasMany(db.post); // 1 user can write many post 1:N
db.post.belongsTo(db.user);
db.post.belongsToMany(db.file, {through : 'Post_Files'} ); // N:M -> 1 post has n(image or file)
db.file.belongsToMany(db.post, {through : 'Post_Files'} ); // N:M -> 1 file used n post
db.post.belongsToMany(db.hashtag, {through : 'Post_Hashtag'}); // N:M
db.hashtag.belongsToMany(db.post, {through : 'Post_Hashtag'}); // N:M


// Follow / Followers - 1 user has N followers / N user have you of user
db.user.belongsTo(db.user, {
  foreignKey : 'followingID',
  as : 'followers',
  through : 'follow',
})

db.user.belongsTo(db.user, {
  foreignKey : 'followerID',
  as : 'followings',
  through : 'follow',
})

// Post / comment - 1 post can write many comment 1:N
db.post.hasMany(db.cmt);  
db.cmt.belongsTo(db.post, {
  foreignKey : 'postId',
});

module.exports = db;
