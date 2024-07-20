const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const playlistSchema = new Schema({
    title: {
        type: String,
        required: true,
        unique: true
    },
    descripted_by: {
        type: String,
        required: true
    },
    tags: { 
        type: [String],
        required: true
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    is_public: {
        type: Boolean,
        required: true
    },
    songs: [{
        type: String,   // Spotify_ID
    }],
    likes: {
        type: Number,
        required: true,
        get: v => Math.round(v),
        set: v => Math.round(v)
    }
});
playlistSchema.index({title: 'text', tags: 'text'});

var Playlist = mongoose.model('Playlist', playlistSchema);
module.exports = Playlist;