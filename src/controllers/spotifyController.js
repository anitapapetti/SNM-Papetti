// https://developer.spotify.com/documentation/web-api

const express = require("express");
const SPOTIFY_BASE = "https://api.spotify.com/v1/";


// Get artists info from Spotify
exports.get_many_artists = async (req, res) => {
    // Check token. If expired, get a new one
    let token = req.cookies.spotify_token;
    if(!token){
        token = await this.get_spotify_token();
        res.cookie("spotify_token", token, {
            httpOnly: true,
            secure: true,
            maxAge: 1000 * 60 * 60 * 1, // 1h
          });
    }

    const response = await fetch(`${SPOTIFY_BASE}artists?${req.params.artists_ids}`, {  // max 100 artists
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: "Bearer " + token,
        }
    });
    if( response.ok){
        const response_json = await response.json();
        const artists = response_json.artists;
        let leaner_artists = [];
        for(let i=0; i < artists.length; i++){
            const images = artists[i].images;
            let image_url = null;
            if(images.length > 0){
                image_url = images[images.length - 1].url;
            }
            let artist = {id: artists[i].id, name: artists[i].name, image_url: image_url, genres: artists[i].genres};
            leaner_artists.push(artist);
        }

        console.log(leaner_artists);
        
        return res.status(200).json({artists: leaner_artists});
    }else{
        return res.status(500).json({message: "Error: could not get artists from Spotify."})
    }
}


// Get song info from Spotify
exports.get_many_songs = async (req, res) => {
    // Check token. If expired, get a new one
    let token = req.cookies.spotify_token;
    if(!token){
        token = await this.get_spotify_token();
        res.cookie("spotify_token", token, {
            httpOnly: true,
            secure: true,
            maxAge: 1000 * 60 * 60 * 1, // 1h
          });
    }

    const response = await fetch(`${SPOTIFY_BASE}tracks?${req.params.song_ids}`, {  // max 100 songs
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: "Bearer " + token,
        }
    });
    if( response.ok){
        const response_json = await response.json();
        const tracks = response_json.tracks;
        let leaner_tracks = [];
        for(let i=0; i < tracks.length; i++){
            let artists_string = "";
            let artists = tracks[i].artists;
            for(let j=0; j < artists.length; j++){
                artists_string += artists[j].name;
                if( j < artists.length - 1){
                    artists_string += ", ";
                }
            }

            let track = {id: tracks[i].id, name: tracks[i].name, artists: artists_string, album: tracks[i].album.name, release_date: tracks[i].album.release_date, duration_ms: tracks[i].duration_ms};
            leaner_tracks.push(track);
        }
        return res.status(200).json({tracks: leaner_tracks});
    }else{
        return res.status(500).json({message: "Error: could not get songs from Spotify."})
    }
}


// Make Spotify API request to get all music genres
exports.get_spotify_genres = async (req, res) => {
    // Check token. If expired, get a new one
    let token = req.cookies.spotify_token;
    if(!token){
        token = await this.get_spotify_token();
        res.cookie("spotify_token", token, {
            httpOnly: true,
            secure: true,
            maxAge: 1000 * 60 * 60 * 1, // 1h
          });
    }

    const response = await fetch(`${SPOTIFY_BASE}recommendations/available-genre-seeds`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: "Bearer " + token,
        }
    });
    if( response.ok){
        const genres_json = await response.json();
        return res.status(200).json(genres_json);
    }else{
        return res.status(500).json({message: "Error: could not get genres from Spotify."})
    }
}


// Gets token to use Spotify API
// Possible errors are to be managed by the caller
exports.get_spotify_token = async (req, res) => {
    const client_id = process.env.CLIENT_ID;
    const client_secret = process.env.CLIENT_SECRET;
    var url = "https://accounts.spotify.com/api/token"

    const response = await fetch(url, {
        method: "POST",
        headers: {
        Authorization: "Basic " + btoa(`${client_id}:${client_secret}`),
        "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ grant_type: "client_credentials" }),
    });

    const tokenResponse = await response.json();
    return tokenResponse.access_token;
}


// Search artist/song/other in Spotify API
exports.search = async (req, res) => {
    // Check token. If expired, get a new one
    let token = req.cookies.spotify_token;
    if(!token){
        token = await this.get_spotify_token();
        res.cookie("spotify_token", token, {
            httpOnly: true,
            secure: true,
            maxAge: 1000 * 60 * 60 * 1, // 1h
          });
    }
    
    const query = decodeURIComponent(req.params.query);
    const type = req.params.type;
    const limit = req.params.limit;
    const offset = req.params.offset;
    // console.log("Query is ", query, "Type is", type, "limit =", limit, "offset =", offset);
    const response = await fetch(`${SPOTIFY_BASE}search?type=${type}&q=${query}&limit=${limit}&offset=${offset}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: "Bearer " + token,
        }
    });
    if( response.ok){
        const genres_json = await response.json();
        return res.status(200).json(genres_json);
    }else{
        return res.status(response.status).json({message: "Error: could not do Spotify search."})
    }
}