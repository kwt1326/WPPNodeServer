// 파일들을 별개의 테이블을 통해 관리 (ex- 한 포스트의 여러개의 이미지)
module.exports = (sequelize, DataTypes) => (
    sequelize.define('files', {
        file : {
            type : DataTypes.STRING(250),
            allowNull : true,
        },
        name : {
            type : DataTypes.STRING(50),
            allowNull : false,
        },
        type : {
            type : DataTypes.STRING(15),
            allowNull : false,
            defaultValue : 'image',
        },
    },
    {
        timestamps : true,
        paranoid : true,
    })
);