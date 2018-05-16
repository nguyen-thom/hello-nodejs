'use strict';

var Mongoose 	= require('mongoose');
var bcrypt      = require('bcrypt-nodejs');

const SALT_WORK_FACTOR = 10;
const DEFAULT_USER_PICTURE = "/img/user.jpg";

var CounterSchema = new Mongoose.Schema({
    _id: {type: String, required: true},
    seq: { type: Number, default: 0 }
});

var counterModel = Mongoose.model('counter', CounterSchema);

/**
 * Every user has a username, password, socialId, and a picture.
 * If the user registered via username and password(i.e. LocalStrategy), 
 *      then socialId should be null.
 * If the user registered via social authenticaton, 
 *      then password should be null, and socialId should be assigned to a value.
 * 2. Hash user's password
 *
 */
var UserSchema = new Mongoose.Schema({
    aid: { type: Number, required: false, unique: true}, //account id
    n:   { type: String, required: true }, //name
    pw:  { type: String, default: null }, //password
    sid: { type: String, default: null }, //social id
    pic: { type: String, default:  DEFAULT_USER_PICTURE}, //picture
    logout_at: { type: Date, required: false, default: null}// last logout
});

/**
 * Before save a user document, Make sure:
 * 1. User's picture is assigned, if not, assign it to default one.
 * 2. Hash user's password
 *
 */
UserSchema.pre('save', function(next) {
    var user = this;
    // ensure user picture is set
    if(!user.pic){
        user.pic = DEFAULT_USER_PICTURE;
    }

    // only hash the password if it has been modified (or is new)
    if (!user.isModified('pw')) return next();


    // generate a salt
    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
        if (err) return next(err);

        // hash the password using our new salt
        bcrypt.hash(user.pw, salt, null, function(err, hash) {
            if (err) return next(err);

            // override the cleartext password with the hashed one
            user.pw = hash;
        });
    });
    //if new user then we must created account id.
    if(user.isNew){
        counterModel.findByIdAndUpdate({_id: 'aid'}, {$inc: { seq: 1} }).then(function(counter){
            console.log("...count: "+JSON.stringify(counter));
            user.aid = counter.seq;
            next();
        });
    }else{
        next();
    }

});

/**
 * Create an Instance method to validate user's password
 * This method will be used to compare the given password with the passwoed stored in the database
 * 
 */
UserSchema.methods.validatePassword = function(password, callback) {
    bcrypt.compare(password, this.pw, function(err, isMatch) {
        if (err) return callback(err);
        callback(null, isMatch);
    });
};

// Create a user model
var userModel = Mongoose.model('user', UserSchema);

module.exports = {
    userModel,
    counterModel
}
