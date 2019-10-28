//--* NODE EXPRESS SERVER MAIN *--//
const express = require('express');
const app = express();
const cookieparser = require('cookie-parser');
const logger = require('morgan');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const sequelize = require('./models').sequelize;
const passport = require('passport');
const cors = require('cors');

// DB Sync
sequelize.sync();

// env parser
require('dotenv').config();

// Redis db
// const redis = require('redis');
// let redisstore = require('connect-redis')(session); // dependency to session
// let redisclient = (process.env.NODE_ENV === "production") ? redis.createClient({
//     host : process.env.HOST_REDIS,
//     port : process.env.PORT_REDIS,
//     password : process.env.PW_REDIS,
// }) : null;

// if(process.env.NODE_ENV === "production") {
//     redisclient.unref();
//     redisclient.on('error', console.log);
// }

// let store = (process.env.NODE_ENV === "production") ? new redisstore({ 
//     client : redisclient,
//     host : process.env.HOST_REDIS,
//     port : process.env.PORT_REDIS,
//     pass : process.env.PW_REDIS,
//     logErrors : true,
// }) : null;

// template engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// library set
app.use(logger('dev'));  // logger
app.use(express.json()); // built in body-parser (after v4.16.0)
app.use(express.static(path.join(__dirname, 'public'))); // resource main save place
app.use(express.static(path.join(__dirname, 'public/images'))); // resource main save place
app.use(express.urlencoded({extended : false}));
app.use(cookieparser((process.env.NODE_ENV === "production") ? process.env.COOKIE_SECRET : "localsecret"));
// app.use(session({
//     resave : false,
//     saveUninitialized : false,
//     secret : (process.env.NODE_ENV === "production") ? process.env.COOKIE_SECRET : "localsecret",
//     cookie : {
//         httpOnly : true,
//         secure : false,
//     },
//     store : (process.env.NODE_ENV === "production") ? store : undefined,
// }))

// flash message
app.use(flash());

// passport init
app.use(passport.initialize());
//app.use(passport.session());

// CORS 
app.use(cors());

// router
const router = require('./routers/index');
const passport_module = require('./routers/passport/index');
passport_module(passport);

app.use('/api', router);
app.get('/', function (req, res) {
    res.render('main', {title : "app main"});
});

app.use((req, res, next) => {
    const err = new Error('Not found from app');
    err.status = 404;
    next(err);
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'dev' ? err : {};
  
    // render the error page
    res.status(err.status || 500);
    //res.render('error');
  });
  

// server start
let port = (process.env.NODE_ENV === "production") ? process.env.PORT : '3500';
app.listen(port, () => {
    console.log('[' + port + '] 번 포트에서 대기 중');
})
  
module.exports = app;