/**
 * Created by wll17331 on 2016/8/17.
 */

var mongodb = require('./mongodb');

var userSchema = new mongodb.mongoose.Schema({
    name: String,
    password: String
}, {
    collection: 'users'
});//users集合

var userModel = mongodb.mongoose.model('User', userSchema);

function User(user) {
    this.name = user.name;
    this.password = user.password;
};

User.prototype.save = function (callback) {
    var user = {
        name: this.name,
        password: this.password
    }
    var newUser = new userModel(user);

    newUser.save(function (err, user) {
        if (err) {
            return callback(err);
        }
        callback(null, user);
    });
};//保存

User.get = function (name, callback) {
    userModel.findOne({name: name}, function (err, user) {
        if (err) {
            return callback(err);
        }
        callback(null, user);
    });
}//查询

module.exports = User;
