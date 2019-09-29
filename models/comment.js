module.exports = (sequelize, DataTypes) => (
    sequelize.define('comment', {
        guid : {
            type : DataTypes.STRING(100),
            allowNull : false,
            unique : true,
        },
        content : {
            type : DataTypes.TEXT(),
            allowNull : false,
        },
        usehide : {
            type : DataTypes.BOOLEAN(),
            allowNull : false,
            defaultValue : 0,
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