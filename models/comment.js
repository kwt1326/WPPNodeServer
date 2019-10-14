module.exports = (sequelize, DataTypes) => (
    sequelize.define('comment', {
        guid : {
            type : DataTypes.STRING(100),
            allowNull : false,
            unique : true,
        },
        writer : {
            type : DataTypes.INTEGER(10),
            allowNull : false,
        },
        content : {
            type : DataTypes.TEXT(),
            allowNull : false,
        },
        hearts : {
            type : DataTypes.INTEGER(),
            allowNull : false,
            defaultValue : 0,
        },
    },
    {
        timestamps : true,
        paranoid : true,
    })
);