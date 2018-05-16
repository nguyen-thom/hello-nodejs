'use strict';

var Mongoose  = require('mongoose');
var logger 		= require('../../logger');
var counterModel = require('./user').counterModel;

/**
 * Each connection object represents a user connected through a unique socket.
 * Each connection object composed of {userId + socketId}. Both of them together are unique.
 *
 */
var RoomSchema = new Mongoose.Schema({
    //room id
    mid: {type: Number, required: false,unique: true},
    //room name
    n: { type: String, required: true },
    //member
    m: { type: [
        {
            //account id
            aid: Number,
            //account type (1: admin, 2 member normal)
            atp: Number
        }
    ]},
    //connection
    c: { type : [
        {
            sid: String, //socket id
            aid: Number  //account id
        }
    ]}
});


RoomSchema.pre('save', function(next) {
    var room = this;
    if(room.isNew){
        counterModel.findByIdAndUpdate({_id: 'mid'}, {$inc: { seq: 1} }, {new: true, upsert: true}).then(function(counter){
            console.log("...count: "+JSON.stringify(counter));
            room.mid = counter.seq;
            next();
        });
    }else{
        next();
    }

});

var roomModel = Mongoose.model('room', RoomSchema);



module.exports = roomModel;