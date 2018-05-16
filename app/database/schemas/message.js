'use strict';

var Mongoose  = require('mongoose');

/**
 * Each connection object represents a user connected through a unique socket.
 * Each connection object composed of {userId + socketId}. Both of them together are unique.
 *
 */
var MessageSchema = new Mongoose.Schema({
    mid: { type: Number, required: true },
    aid: { type: Number, required: true},
    message: { type: String, required: false, default: null},
    lt : {type: Number, required: true, default: 0}
});

var messageModel = Mongoose.model('message', MessageSchema);

module.exports = messageModel;