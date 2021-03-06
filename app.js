//--* NODE EXPRESS SERVER MAIN *--//
const express = require('express');
const app = express();
const cookieparser = require('cookie-parser');
const logger = require('morgan');
const path = require('path');
const flash = require('connect-flash');
const sequelize = require('./models').sequelize;
const passport = require('passport');
const cors = require('cors');

// DB Sync
sequelize.sync();

// CORS 
app.use(cors());

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

// flash message
app.use(flash());

// helmet security
const helmet = require('helmet');
app.use(helmet());

// passport init
app.use(passport.initialize());

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
  });
  

// server start
let port = (process.env.NODE_ENV === "production") ? process.env.PORT : '3500';
app.listen(port, () => {
    console.log('[' + port + '] 번 포트에서 대기 중');
})
  
module.exports = app;