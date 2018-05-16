'use strict';

var Mongoose  = require('mongoose');

/**
 * Each connection object represents a user connected through a unique socket.
 * Each connection object composed of {userId + socketId}. Both of them together are unique.
 *
 */
var HistorySchema = new Mongoose.Schema({
    mid: { type: Number, required: true },
    last_id:   { type: String, require: false},
    tm : {type: Date, required: true, default: 0}
});

var HistoryModel = Mongoose.model('message', HistorySchema);

module.exports = HistoryModel;