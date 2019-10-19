module.exports = (sequelize, DataTypes) => (
    sequelize.define('hashtag', {
        name : {
            type : DataTypes.STRING(20),
            allowNull : false,
        },
        category : {
            type : DataTypes.STRING(10),
            allowNull : false,
        }
    },
    {
        timestamps : true,
        paranoid : true,
    })
);