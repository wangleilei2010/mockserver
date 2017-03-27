/**
 * Created by wll17331 on 2016/8/17.
 */
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/test');
exports.mongoose = mongoose;