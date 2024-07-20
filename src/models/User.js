const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: () => new Date(),
        immutable: true
    },
    // updatedAt: Date,
    genres: [String],
    artists: [{
        type: String    // Spotidy_ID
    }],
    playlists: [{
        type: Schema.Types.ObjectId,
        ref: 'Playlist'
    }],
    liked_playlists: [{
        type: Schema.Types.ObjectId,
        ref: 'Playlist'
    }],
});
userSchema.index({username: 'text'});

var User = mongoose.model('User', userSchema);
module.exports = User;