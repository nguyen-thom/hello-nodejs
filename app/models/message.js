'use strict';

var MessageModel   = require('../database').models.message;
var User 		= require('../models/user');

var create = function (data, callback){
	var newMessage = new MessageModel(data);
	newMessage.save(callback);
};
var getTopMessage = function(mid, limit, callback){
    MessageModel.find({'mid': mid}).sort({'lt': 1}).limit(limit).exec(callback);
};


module.exports = {
    create,
    getTopMessage
};