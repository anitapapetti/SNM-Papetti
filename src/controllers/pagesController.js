const path = require("path")

// public pages
exports.login = (req, res) => {
	res.sendFile(path.join(__dirname, '../html/login.html'));
};
exports.signup = (req, res) => {
	res.sendFile(path.join(__dirname, '../html/signup.html'));
};
exports.welcome = (req, res) => {
	res.sendFile(path.join(__dirname, '../html/index.html'));
};


// authorized access only pages
exports.account = (req, res) => {
	res.sendFile(path.join(__dirname, '../html/account.html'));
}
exports.choose_artists = (req, res) => {
	res.sendFile(path.join(__dirname, '../html/choose-artists.html'));
}
exports.choose_genres = (req, res) => {
	res.sendFile(path.join(__dirname, '../html/choose-genres.html'));
}
exports.create_playlist = (req, res) => {
	res.sendFile(path.join(__dirname, '../html/create-playlist.html'));
}
exports.home = (req, res) => {
	res.sendFile(path.join(__dirname, '../html/home.html'));
}
exports.library = (req, res) => {
	res.sendFile(path.join(__dirname, '../html/library.html'));
}
exports.modify_playlist = (req, res) => {
	res.sendFile(path.join(__dirname, '../html/modify-playlist.html'));
}
exports.playlist = (req, res) => {
	res.sendFile(path.join(__dirname, '../html/playlist.html'));
}
exports.profile = (req, res) => {
	res.sendFile(path.join(__dirname, '../html/profile.html'));
}
exports.search_page = (req, res) => {
	res.sendFile(path.join(__dirname, '../html/search-page.html'));
}