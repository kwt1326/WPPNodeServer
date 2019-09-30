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

// DB Sync
sequelize.sync();

// env parser
require('dotenv').config();

// template engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// library set
app.use(logger('dev'));  // logger
app.use(express.json()); // built in body-parser (after v4.16.0)
app.use(express.static(path.join(__dirname, 'public'))); // resource main save place
app.use(express.static(path.join(__dirname, 'public/images'))); // resource main save place
app.use(express.urlencoded({extended : false}));
app.use(cookieparser(process.env.COOKIE_SECRET));
app.use(session({
    resave : false,
    saveUninitialized : false,
    secret : process.env.COOKIE_SECRET,
    cookie : {
        httpOnly : true,
        secure : false,
    }
}))

// flash message
app.use(flash());

// passport init
app.use(passport.initialize());
app.use(passport.session());

// CORS 
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*"); 
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept"); 
    next();
});

// router
const router = require('./routers/index');
const passport_module = require('./routers/passport/index');
passport_module(passport);

app.use('/api', router);
app.use((req, res, next) => {
    const err = new Error('Not found');
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
app.listen(process.env.PORT, () => {
    console.log('[' + process.env.PORT + '] 번 포트에서 대기 중');
})
  
module.exports = app;