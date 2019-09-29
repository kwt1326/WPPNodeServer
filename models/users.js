module.exports = (sequelize, DataTypes) => (
    sequelize.define('user', {
        email : {
            type : DataTypes.STRING(40),
            allowNull : false,
            unique : true,
        },
        nickname : {
            type : DataTypes.STRING(15),
            allowNull : false,
        },
        username : {
            type : DataTypes.STRING(15),
            allowNull : false,
        },
        password : {
            type : DataTypes.STRING(100),
            allowNull : false,
        },
        provider : {
            type : DataTypes.STRING(15),
            allowNull : false,
            defaultValue : 'local',
        },
        snsID : {
            type : DataTypes.STRING(40),
            allowNull : true,
        },
        numjoin : {
            type : DataTypes.INTEGER(5),
            allowNull : false,
        },
        historys : {
            type : DataTypes.TEXT(),
            allowNull : true,
        }
    },
    {
        timestamps : true,
        paranoid : true,
    })
);