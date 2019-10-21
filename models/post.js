module.exports = (sequelize, DataTypes) => (
    sequelize.define('post', {
        title : {
            type : DataTypes.STRING(40),
            allowNull : false,
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
        },
        frontimg : {
            type : DataTypes.STRING(100),
            allowNull : true,
        },
    },
    {
        timestamps : true,
        paranoid : true,
    })
);