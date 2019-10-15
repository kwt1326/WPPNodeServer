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
        profileimg : {
            type : DataTypes.TEXT(),
            allowNull : true,
        },
        historys : {
            type : DataTypes.TEXT(),
            allowNull : true,
        },
        level : {
            type : DataTypes.STRING(10),
            allowNull : false,
            defaultValue : 'user',
        }
    },
    {
        timestamps : true,
        paranoid : true,
    })
);