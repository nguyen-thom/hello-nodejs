'use strict';

var roomModel   = require('../database').models.room;
var User 		= require('../models/user');

var create = function (data, callback){
	var newRoom = new roomModel(data);
	newRoom.save(callback);
};

var find = function (data, callback){
	roomModel.find(data, callback);
}

var findOne = function (data, callback){
	roomModel.findOne(data, callback);
}

var findById = function (id, callback){
	roomModel.findById(id, callback);
}

var findByIdAndUpdate = function(id, data, callback){
	roomModel.findByIdAndUpdate(id, data, { new: true }, callback);
}

/**
 * Add a user along with the corresponding socket to the passed room
 *
 */
var addMember = function(room, aid, atp, callback){
	// Get current user's id

	// Push a new member object(i.e. {userId + account type})
	var conn = { aid: aid, atp: atp};
	room.m.push(conn);
	room.save(callback);
}

/**
 * add user online to connection
 *
 */
var addConnection = function(room, socket, callback){
	// Get current user's id
	var aid = socket.request.session.passport.user;
	console.log('add connection to room with account:' + aid);
	var exist = false;
	//found user exit in list member of room
	room.m.forEach(function(member){
		if(member.aid === aid ){
			var conn = { aid: aid, sid: socket.id};
			var i = -1;
			room.c.forEach(function(connection,index){
				if(connection.aid === aid){
					i = index;
				}
			});
			if(i != -1){
				room.c.splice(i,1,conn);
			}else{
				room.c.push(conn);
			}
			room.save(callback);
		}
	});
}

/**
 * Get all member in chatroom
 *
 */
var getMembers = function(room, socket, callback){

	var users = [], vis = {}, cunt = 0;
	var aid = socket.request.session.passport.user;

	// Loop on room's connections, Then:
	room.m.forEach(function(member){

		// 1. Count the number of connections of the current user(using one or more sockets) to the passed room.
		if(member.aid === aid){
			cunt++;
		}

		// 2. Create an array(i.e. users) contains unique users' ids
		if(!vis[member.aid]){
			users.push(member.aid);
		}
		vis[member.aid] = true;
	});

	// Loop on each user id, Then:
	// Get the user object by id, and assign it to users array.
	// So, users array will hold users' objects instead of ids.
	users.forEach(function(aid, i){
		User.findOne({'aid': aid}, function(err, user){
			if (err) { return callback(err); }
			users[i] = user;
			if(i + 1 === users.length){
				return callback(null, users, cunt);
			}
		});
	});
}

/**
 * Get all connection user of room
 *
 */
var getConnectionUsers = function(room, socket, callback){

	var cons = [], vis = {}, cunt = 0;
	var aid = socket.request.session.passport.user;

	// Loop on room's connections, Then:
	room.c.forEach(function(connection){

		// 1. Count the number of connections of the current user(using one or more sockets) to the passed room.
		if(connection.aid === aid){
			cunt++;
		}

		// 2. Create an array(i.e. users) contains unique users' ids
		if(!vis[connection.aid]){
			cons.push(connection);
		}
		vis[connection.aid] = true;
	});
	return callback(null, cons, cunt);
}

/**
 * Remove a user along with the corresponding socket from a room
 *
 */
var removeUser = function(socket, callback){

	// Get current user's id
	var aid = socket.request.session.passport.user;

	find(function(err, rooms){
		if(err) { return callback(err); }

		// Loop on each room, Then:
		rooms.every(function(room){
			var pass = true, cunt = 0, target = 0;

			// For every room, 
			// 1. Count the number of connections of the current user(using one or more sockets).
			room.c.forEach(function(conn, i){
				if(conn.aid === aid){
					cunt++;
				}
				if(conn.sid === socket.id){
					pass = false, target = i;
				}
			});

			// 2. Check if the current room has the disconnected socket, 
			// If so, then, remove the current connection object, and terminate the loop.
			if(!pass) {
				room.c.id(room.c[target]._id).remove();
				room.save(function(err){
					callback(err, room, aid, cunt);
				});
			}

			return pass;
		});
	});
}

module.exports = {
	create,
	find,
	findOne,
	findById,
	addMember,
	addConnection,
	//getUsers,
	getConnectionUsers,
	getMembers,
	removeUser
};