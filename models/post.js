module.exports = (sequelize, DataTypes) => (
    sequelize.define('post', {
        category : {
            type : DataTypes.STRING(15),
            allowNull : false,
            defaultValue : 'default'
        },
        title : {
            type : DataTypes.STRING(40),
            allowNull : false,
        },
        usehide : {
            type : DataTypes.BOOLEAN(),
            allowNull : false,
            defaultValue : 0,
        },
        password : {
            type : DataTypes.STRING(200),
            allowNull : true,
        },
        content : {
            type : DataTypes.TEXT(),
            allowNull : false,
        },
        hashtag : {
            type : DataTypes.STRING(200),
            allowNull : true,
        },
        guid : {
            type : DataTypes.STRING(100),
            allowNull : false,
            unique : true,
        },
        views : {
            type : DataTypes.INTEGER(),
            allowNull : false,
            defaultValue : 0,
        },
        hearts : {
            type : DataTypes.INTEGER(),
            allowNull : false,
            defaultValue : 0,
        }
    },
    {
        timestamps : true,
        paranoid : true,
    })
);