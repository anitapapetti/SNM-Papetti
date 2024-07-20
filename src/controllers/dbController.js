const mongoose = require("mongoose");
const Playlist = require("../models/Playlist.js");
const User = require("../models/User.js");
const db_uri = process.env.MONGO_URI;
const { encrypt } = require("../controllers/authenticationController.js");
const path = require("path")


// Add song to playlist
exports.add_song_to_playlist = async (req, res) => {
    try{ 
        await check_db_connection();
    }catch (error){
        res.status(500).json({ message: "Error with db connection." });
        return;
    }

    let playlist = await Playlist.findOne({title: req.body.title}).populate('author', 'id').exec();
    if( playlist === null){
        return res.status(400).json({message: "Error: could not find playlist to update"});
    }

    // check that user is the author and can remove the song
    if(playlist.author.id !== req.id){
        return res.status(401).json({message: "Error: Unauthorized"});
    }

    if( !playlist.songs.includes(req.body.song_id)){
        playlist.songs.push(req.body.song_id);
        await playlist.save();
        return res.status(200).json({message: "Added song to playlist."});
    }else{
        return res.status(204).json({message: "Warning: song already in playlist"});
    }
}


// If not connected, connect to database
// Throws error if there is an error while connecting to db
const check_db_connection = async function (){
    if(mongoose.connection.readyState != 1){
        console.log("Connecting to database...");
        mongoose.connection.on("error", (error) => {
            check_db_connection();
        });
        mongoose.connection.once("connected", () => {
            console.log("Successfully connected to database");
        });
        await mongoose.connect(db_uri);
    }
}


// Create new Playlist document
exports.create_playlist = async (req, res) => {
    try{ 
        await check_db_connection();
    }catch (error){
        res.status(500).json({ message: "Error with db connection." });
        return;
    }

    console.log(req.body.title);
    // check if title is already used for an existing playlist
    console.log("Checking if title is already in use...");
    await Playlist.findOne({ title: req.body.title })
      .then((response) => {
        if(response !== null){
          console.log("Found already existing playlist: ", response.id);
          res.status(409).json({ message: "Could not create playlist. This title is already in use.", invalid_fields: ["title"] });
          return;
        }
      });

    // insert new playlist
    console.log("Saving new playlist in db...");
    const playlist = await Playlist.create({
      title: req.body.title,
      descripted_by: req.body.descripted_by,
      tags: req.body.tags,
      author: req.id,
      is_public: req.body.is_public,
      likes: 0
    });

    const user = await User.findById(req.id).exec();

    if(playlist !== null && user !== null){
        user.playlists.push(playlist._id);
        await user.save();
        return res.status(201).json({ message: "Plalist created.", playlist_id: playlist.id });
    }else{
        return res.status(500).json({message: "Error: could not save new playlist."});
    }
}


// Delete account
// Drop user from db
exports.delete_account = async (req, res) => {
    try{ 
        await check_db_connection();
    }catch (error){
        res.status(500).json({ message: "Error with db connection." });
        return;
    }

    console.log("Deleting user from db...");
    const user = await User.findById(req.id).exec();
    if(user === null){
        return res.status(404).json({message: "Error: could not find user."});
    }

    // delete all playlists created by user
    for(let i=0; i < user.playlists.length; i++){
        await Playlist.deleteOne({_id: user.playlists[i]});  
    }

    // delete user
    const deleted = await User.findOneAndDelete({_id: req.id}).exec();

    // close db connection
    await mongoose.connection.close();
    console.log("Db connection closed.");
  
    if(deleted !== null){
        return res.status(200).clearCookie("access_token").clearCookie("spotify_token").json({message: "Account deleted."});
    }else{
        return res.status(500).json({message: "Could not delete user's account."});
    }
}


// Delete playlist
// Drop playlist from db
// Remove playlist from author's playlists
// Lazy remove from user's liked playlists: remove playlist id from user's liked playlist next time when they try to get it
exports.delete_playlist = async (req, res) => {
    try{ 
        await check_db_connection();
    }catch (error){
        res.status(500).json({ message: "Error with db connection." });
        return;
    }

    console.log("Deleting playlist from db...");
    console.log("Title: ", req.body.title);
    const playlist = await Playlist.findOne({title: req.body.title}).populate('author', 'id').exec();
    if(playlist === null){
        return res.status(404).json({message: "Error: could not find playlist."});
    }

    console.log("Author", playlist.author.id, "User", req.id);
    // check that user is the author and can delete the playlist
    if(playlist.author.id !== req.id){
        return res.status(401).json({message: "Error: Unauthorized"});
    }
    
    const user = await User.findById(req.id).exec();
    if(user === null){
        return res.status(404).json({message: "Error: could not find user."});
    }

    const index = user.playlists.indexOf(playlist._id);
    if( index >= 0){
        user.playlists.splice(index, 1);;
        await user.save();
    }

    await playlist.deleteOne();
    
    return res.status(200).json({message: "Playlist deleted."});
}


// Get user's current settings from db
exports.get_account_info = async (req, res) => {
    try{ 
        await check_db_connection();
    }catch (error){
        res.status(500).json({ message: "Error with db connection." });
        return;
    }

    const user = await User.findById(req.id, 'username email').exec();
    
    if(user !== null){
        return res.status(200).json({username: user.username, email: user.email});
    }else{
        return res.status(404).json({message: "Error: could not find user."});
    }
}


// Get user's favourite artists from db
exports.get_artists = async (req, res) => {
    try{ 
        await check_db_connection();
    }catch (error){
        res.status(500).json({ message: "Error with db connection." });
        return;
    }

    const user = await User.findById(req.id, 'artists').exec();
    if(user === null){
        return res.status(404).json({message: "Error: could not find user."});
    }

    console.log("Artists found in db: ", user.artists);
    if(!user.artists){
        user.artists = [];
    }

    return res.status(200).json({artists: user.artists});
}


// Get liked playlist info from db
// If deleted palylists are found in liked playlists, remove them
exports.get_liked_playlists = async (req, res) => {
    try{ 
        await check_db_connection();
    }catch (error){
        res.status(500).json({ message: "Error with db connection." });
        return;
    }

    const user = await User.findById(req.id).exec();
    console.log("User:", user);
    if(user === null){
        return res.status(404).json({message: "Error: could not find user."});
    }

    const playlists = [];
    const indexes_to_delete = [];
    if(user.liked_playlists && user.liked_playlists.length > 0){
        await User.populate(user, {path: 'liked_playlists', select: 'title descripted_by likes is_public'});
        for(let i=0; i < user.liked_playlists.length; i++){
            if(!user.liked_playlists[i].title){
                // playlist deleted - doesn't exist anymore
                indexes_to_delete.push(i);
            }else{
                playlists.push({title: user.liked_playlists[i].title, descripted_by: user.liked_playlists[i].descripted_by, likes: user.liked_playlists[i].likes, is_public: user.liked_playlists[i].is_public});
            }
        }
    }
    console.log(playlists);
    
    // remove deleted playlists from liked playlists
    for(index of indexes_to_delete){
        user.liked_playlists.slice(index, 1);
    }
    await user.save();

    return res.status(200).json({playlists: playlists});
}


// Get playlist info from db
exports.get_playlist = async (req, res) => {
    try{ 
        await check_db_connection();
    }catch (error){
        res.status(500).json({ message: "Error with db connection." });
        return;
    }

    const title = decodeURIComponent(req.params.title);
    const playlist = await Playlist.findOne({title: title}).populate('author', 'id username').exec();
    console.log("Playlist found in db: ", playlist);
    if(playlist === null){
        return res.status(404).json({message: "Error: could not find playlist."});
    }

    let is_yours = playlist.author.id == req.id;
    if(is_yours === false && playlist.is_public === false){
        return res.status(401).json({message: "Error: Unauthorized"});
    }else{
        let liked = false;
        const user = await User.findById(req.id, 'liked_playlists').exec();
        if(user === null){
            return res.status(404).json({message: "Error: could not find user."});
        }

        if(user.liked_playlists !== null && user.liked_playlists.includes(playlist._id)){
            liked = true;
        }
        
        return res.status(200).json({title: playlist.title, descripted_by: playlist.descripted_by, tags: playlist.tags, author: playlist.author.username, is_public: playlist.is_public, songs: playlist.songs, likes: playlist.likes, is_yours: is_yours, liked: liked});
    }
}


// Get user's profile with username
// if username is "", get your own profile
// Profile info: username, playlists created, fav artists, fav genres
exports.get_profile = async (req, res) => {
    try{ 
        await check_db_connection();
    }catch (error){
        res.status(500).json({ message: "Error with db connection." });
        return;
    }

    let user = null;
    if(!req.params.username){
        user = await User.findById(req.id).exec();
    }else{
        const username = decodeURIComponent(req.params.username);
        user = await User.findOne({username: username}).exec();
    }
    if(user === null){
        return res.status(404).json({message: "Error: could not find user."});
    }

    const playlists = [];
    if(user.playlists && user.playlists.length > 0){
        await User.populate(user, {path: 'playlists', select: 'title descripted_by likes is_public'});
        for(let i=0; i < user.playlists.length; i++){
            if(user.playlists[i].is_public === true){
                playlists.push({title: user.playlists[i].title, descripted_by: user.playlists[i].descripted_by, likes: user.playlists[i].likes, is_public: user.playlists[i].is_public});
            }
        }
    }
    
    return res.status(200).json({username: user.username, playlists: playlists, artists: user.artists, genres: user.genres});
}


// Get user's favourite genres from db
exports.get_user_genres = async (req, res) => {
    try{ 
        await check_db_connection();
    }catch (error){
        res.status(500).json({ message: "Error with db connection." });
        return;
    }

    const user = await User.findById(req.id, 'genres').exec();
    if(user !== null){
        if(!user.genres){
            user.genres = [];
        }
        return res.status(200).json({genres: user.genres});
    }else{
        return res.status(404).json({message: "Error: could not find user."});
    }
}


// Get your own playlists info (title, descripted_by, likes) from db
exports.get_your_playlists = async (req, res) => {
    try{ 
        await check_db_connection();
    }catch (error){
        res.status(500).json({ message: "Error with db connection." });
        return;
    }

    const user = await User.findById(req.id).exec();
    if(user === null){
        return res.status(404).json({message: "Error: could not find user."});
    }

    const playlists = [];
    if(!user.playlists){
        user.playlists = [];
        await user.save();
    }
    if(user.playlists.length > 0){
        await User.populate(user, {path: 'playlists', select: 'title descripted_by likes is_public'});
        for(let i=0; i < user.playlists.length; i++){
            playlists.push({title: user.playlists[i].title, descripted_by: user.playlists[i].descripted_by, likes: user.playlists[i].likes, is_public: user.playlists[i].is_public});
        }
    }
    console.log(playlists);
        
    return res.status(200).json({playlists: playlists});
}


// Add or remove like
// Add/remove 1 like to playlist likes
// Add/remove playlist from user's liked playlists
exports.like_dislike = async (req, res) => {
    try{ 
        await check_db_connection();
    }catch (error){
        res.status(500).json({ message: "Error with db connection." });
        return;
    }

    const playlist = await Playlist.findOne({title: req.body.title});
    const user = await User.findById(req.id);
    if(playlist === null || user === null){
        return res.status(400).json({message: "Error: could not find playlist/user to update"});
    }

    const index = user.liked_playlists.indexOf(playlist._id);
    switch(req.body.action){
        case "add":
            if( index < 0){
                playlist.likes = playlist.likes + 1;
                user.liked_playlists.push(playlist._id);       
            }else{
                return res.status(400).json({message: "Error: trying to add like to an already liked playlist"});
            } 
            break;
        case "remove":
            if( playlist.likes <= 0){
                return res.status(400).json({message: "Error: trying to assign a negative number of likes"});
            }
            if( index < 0){
                return res.status(400).json({message: "Error: trying to remove like from a not-liked playlist"});
            }else{
                playlist.likes = playlist.likes - 1;
                user.liked_playlists.splice(index, 1);
            }
            break;
        default:
            return res.status(400).json({message: "Error: unrecognized action on number of likes"});
    }
    await playlist.save();
    await user.save();
    return res.status(200).json({message: "Successfully updated likes info in db"});
}


// remove song from playlist
exports.remove_song_from_playlist = async (req, res) => {
    try{ 
        await check_db_connection();
    }catch (error){
        res.status(500).json({ message: "Error with db connection." });
        return;
    }

    let playlist = await Playlist.findOne({title: req.body.title}).populate('author', 'id').exec();
    if( playlist === null){
        return res.status(400).json({message: "Error: could not find playlist to update"});
    }
    // check that user is the author and can remove the song
    if(playlist.author.id !== req.id){
        return res.status(401).json({message: "Error: Unauthorized"});
    }

    const index = playlist.songs.indexOf(req.body.song_id);
    if( index >= 0){
        playlist.songs.splice(index, 1);;
        await playlist.save();
        return res.status(200).json({message: "Removed song from playlist."});
    }else{
        return res.status(204).json({message: "Warning: song to remove is not in playlist"});
    }    
}


// Search public playlists in db
exports.search_playlists = async (req, res) => {
    try{ 
        await check_db_connection();
    }catch (error){
        res.status(500).json({ message: "Error with db connection." });
        return;
    }
    
    const query = decodeURIComponent(req.params.query);
    const limit = req.params.limit;
    const offset = req.params.offset;
    // console.log("Query is ", query, "limit =", limit, "offset =", offset);
    const playlists = await Playlist.find({$text: {$search: query, $caseSensitive: false}, is_public: true}).skip(offset).limit(limit).exec();
    if(playlists === null){
        return res.status(200).json({playlists: []});
    }else{
        return res.status(200).json({playlists: playlists})
    }
}


// Search for another user's profile by username
exports.search_profile = async (req, res) => {
    try{ 
        await check_db_connection();
    }catch (error){
        res.status(500).json({ message: "Error with db connection." });
        return;
    }

    const username = decodeURIComponent(req.params.username);
    const users = await User.find({$text: {$search: username, $caseSensitive: false}}).exec();
    if(users === null){
        return res.status(200).json({users: []});
    }else{
        let usernames = [];
        for(let i=0; i < users.length; i++){
            usernames.push(users[i].username);
        }
        return res.status(200).json({users: usernames});
    }
}


// Overwrite user's settings with new settings
exports.update_account = async (req, res) => {
    try{ 
        await check_db_connection();
    }catch (error){
        res.status(500).json({ message: "Error with db connection." });
        return;
    }

    const { username, email, password } = req.body;

    let message = "";
    let invalid_fields = [];
    // check if user email is already used for an existing account
    console.log("Checking if email is already registered...");
    await User.findOne({ email: email })
      .then((user) => {
        if(user !== null){
          console.log("Found already existing user: ", user.id);
          message = "Could not update email. This email address is already registered.\n";
          invalid_fields.push("email");
        }
      });

    // check if user username is already used for an existing account
    console.log("Checking if username is already registered...");
    await User.findOne({ username: username })
      .then((user) => {
        if(user !== null){
          console.log("Found already existing user: ", user.id);
          message += "Could not sign up. This username is already registered.";
          invalid_fields.push("username");
        }
      });
    
    if(message !== ""){
        return res.status(409).json({message: message, invalid_fields: invalid_fields});
    }
    
    const user = await User.findById(req.id).exec();
    if(user === null){
        return res.status(404).json({message: "Error: could not find user"});
    }

    if(username){
        // console.log("Saving new username: ", username);
        user.username = username;
    }
    if(email){
        // console.log("Saving new email: ", email);
        user.email = email;
    }
    if(password){
        const encrypted = encrypt(password);
        // console.log("Saving new password: ", encrypted);
        user.password = encrypted;
    }
    await user.save();
    
    return res.status(200).json({message: "Account info updated.", username: user.username, email: user.email});
}


// Save favourite artists Spotify_IDs as user's artists
exports.update_artists = async (req, res) => {
    try{ 
        await check_db_connection();
    }catch (error){
        res.status(500).json({ message: "Error with db connection." });
        return;
    }

    const user = await User.findById(req.id).exec();
    if(user === null){
        return res.status(404).json({message: "Error: could not find user"});
    }
    user.artists = req.body.artists;
    await user.save();

    return res.status(200).json({message: "Favourite artists updated."});
}


// Save genres as user's favourite genres
exports.update_genres = async (req, res) => {
    try{ 
        await check_db_connection();
    }catch (error){
        res.status(500).json({ message: "Error with db connection." });
        return;
    }

    const user = await User.findById(req.id).exec();
    if(user === null){
        return res.status(404).json({message: "Error: could not find user"});
    }
    user.genres = req.body.genres;
    await user.save();

    return res.status(200).json({message: "Genres preferences updated."});
}


// Update playlist info
exports.update_playlist = async (req, res) => {
    try{ 
        await check_db_connection();
    }catch (error){
        res.status(500).json({ message: "Error with db connection." });
        return;
    }

    const playlist = await Playlist.findOne({title: req.body.old_title}).populate('author', 'id').exec();
    if(playlist === null){
        return res.status(404).json({message: "Error: could not find playlist."});
    }

    // check if user is author
    if(playlist.author.id !== req.id){
        return res.status(401).json({message: "Error: Unauthorized"});
    }

    playlist.title = req.body.title;
    playlist.descripted_by = req.body.descripted_by;
    playlist.tags = req.body.tags;
    playlist.is_public = req.body.is_public;
    await playlist.save();

    return res.status(200).json({message: "Successfully updated playlist."});
}