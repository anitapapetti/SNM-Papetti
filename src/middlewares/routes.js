const express = require("express");
const authMiddleware = require("./authorization.js");
const authController = require("../controllers/authenticationController.js");
const pagesController = require("../controllers/pagesController.js");
const spotifyController = require("../controllers/spotifyController.js");
const dbController = require("../controllers/dbController.js");

const router = express.Router();

// authentication
router.post("/login", authController.login);
router.post("/signup", authController.signup);
router.get("/logout", authMiddleware.authorize, authController.logout);


// public pages
router.get("/", pagesController.welcome);
router.get("/login", pagesController.login);
router.get("/signup", pagesController.signup);

// authorized access only pages
router.get("/account", authMiddleware.authorize, pagesController.account);
router.get("/choose-artists", authMiddleware.authorize, pagesController.choose_artists);
router.get("/choose-artists/signup", authMiddleware.authorize, pagesController.choose_artists);
router.get("/choose-genres", authMiddleware.authorize, pagesController.choose_genres);
router.get("/choose-genres/signup", authMiddleware.authorize, pagesController.choose_genres);
router.get("/create-playlist", authMiddleware.authorize, pagesController.create_playlist);
router.get("/home", authMiddleware.authorize, pagesController.home);
router.get("/library", authMiddleware.authorize, pagesController.library);
router.get("/playlist/:title", authMiddleware.authorize, pagesController.playlist);
router.get("/playlist/:title/modify", authMiddleware.authorize, pagesController.modify_playlist);
router.get("/profile", authMiddleware.authorize, pagesController.profile);
router.get("/profile/:username", authMiddleware.authorize, pagesController.profile);
router.get("/search", authMiddleware.authorize, pagesController.search_page);


// requests to db
router.get("/artists", authMiddleware.authorize, dbController.get_artists);
router.get("/get-account", authMiddleware.authorize, dbController.get_account_info);
router.get("/get-user-genres", authMiddleware.authorize, dbController.get_user_genres);
router.get("/liked-playlists", authMiddleware.authorize, dbController.get_liked_playlists);
router.get("/playlist-info/:title", authMiddleware.authorize, dbController.get_playlist);
router.get("/playlist/search/:query/:limit/:offset", authMiddleware.authorize, dbController.search_playlists);
router.get("/playlists", authMiddleware.authorize, dbController.get_your_playlists);
router.get("/profile-info", authMiddleware.authorize, dbController.get_profile);
router.get("/profile-info/:username", authMiddleware.authorize, dbController.get_profile);
router.get("/profile/search/:username", authMiddleware.authorize, dbController.search_profile);

router.post("/create-playlist", authMiddleware.authorize, dbController.create_playlist);
router.post("/like", authMiddleware.authorize, dbController.like_dislike);

router.put("/account", authMiddleware.authorize, dbController.update_account);
router.put("/artists", authMiddleware.authorize, dbController.update_artists);
router.put("/genres", authMiddleware.authorize, dbController.update_genres);
router.put("/playlist/add-song", authMiddleware.authorize, dbController.add_song_to_playlist);
router.put("/playlist/remove-song", authMiddleware.authorize, dbController.remove_song_from_playlist);
router.put("/playlist/update-info", authMiddleware.authorize, dbController.update_playlist);

router.delete("/account", authMiddleware.authorize, dbController.delete_account);
router.delete("/playlist", authMiddleware.authorize, dbController.delete_playlist);


// requests to Spotify
router.get("/artists/:artists_ids", authMiddleware.authorize, spotifyController.get_many_artists);
router.get("/get-genres", authMiddleware.authorize, spotifyController.get_spotify_genres);
router.get("/search/:query/:type/:limit/:offset", authMiddleware.authorize, spotifyController.search);
router.get("/songs/:song_ids", authMiddleware.authorize, spotifyController.get_many_songs);



module.exports = router;