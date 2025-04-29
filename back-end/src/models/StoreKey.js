module.exports =(sequelize,DataTypes) => {
    const StoreKey = sequelize.define('StoreKey',{
        userIp:{
            type: DataTypes.STRING,
            allowNull: false,
            primaryKey: true,
        },
        key:{
            type:DataTypes.TEXT,
            allowNull: true,
            defaultValue:''
        }
    },{
        tableName: 'StoreKey',
        timestamps: false,
    })
    return StoreKey;
}