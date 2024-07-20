var type = "track";
var query_encoded = "";
var limit = 12;
var offset = 0;
const IMAGE_URL_DEFAULT = "/images/blank-profile-picture.png";


// Display artists
function display_artists(artists_info){
    // document.getElementById("search_results").innerHTML = `<div id="container-artists" class="row d-flex align-items-center mb-2 g-2"></div>`;
    document.getElementById("search_results").innerHTML = `<div id="container-artists" class="col-lg-8 col-xl-6 align-center"></div>`;
    const container = document.getElementById("container-artists");
    let image_url = IMAGE_URL_DEFAULT;
    container.innerHTML = `<div class="row align-items-center mb-2">
                        <img class="col-2 col-xl-1">
                        <p class="col-4 col-xl-4"></p>
                        <p class="col-6 col-xl-7"><b>Genres:</b></p>
                    </div>`;
    for (let i=0; i < artists_info.items.length; i++){
        let artist = artists_info.items[i];
        let images = artist.images;
        if(images && images.length){
            image_url = images[images.length-1].url;
        }
        let genres = "";
        for(let j=0; j < artist.genres.length; j++){
            genres += artist.genres[j];
            if(j < artist.genres.length - 1){
                genres += ", ";
            }
        }
        container.innerHTML += `<div id=${artist.id} class="row align-items-center mb-2">
                        <img class="col-2" src=${image_url}>
                        <p class="col-4">${artist.name}</p>
                        <p class="col-6">${genres}</p>
                    </div>`;
    }
}


// Display search result navigation buttons (prev/next)
// prev is initially disabled
function display_page_nav(){
    document.getElementById("page_nav").innerHTML =  `<div class="row g-4">
                    <nav aria-label="Playlist navigation">
                        <ul class="pagination">
                            <li class="page-item"><button id="prev_button" class="page-link" onclick="prev()" disabled>Prev</button></li>
                            <li class="page-item"><button id="next_button" class="page-link" onclick="next()">Next</button></li>
                        </ul>
                    </nav>
                </div>`;
}


// Display playlists
function display_playlists(playlists){
    if(playlists.length <= limit){
        document.getElementById("prev_button").disabled = true;
        document.getElementById("next_button").disabled = true;
    }
    const outer = document.getElementById("search_results");
    outer.setAttribute("class","text-center");
    outer.innerHTML = `<div id="container-playlists" class="row row-cols-2 row-cols-md-3 row-cols-lg-4 row-cols-xl-6 g-4">
                </div>`;
    const results = document.getElementById("container-playlists");
    results.innerHTML = "";

    for(let i=0; i < playlists.length; i++){
        const title_encoded = encodeURIComponent(playlists[i].title);
        let visibility = "Public";
        let likes_p = `<p class="card-text hint">${playlists[i].likes} likes</p>`;
        if(playlists[i].is_public === false){
            visibility = "Private";
            likes_p = ``;
        }
        results.innerHTML += `<div class="col" id="card-${i}">
                <div class="card">
                    <div class="card-body">
                        <p class="card-text hint"><small>${visibility} playlist</small></p>
                        <p class="card-text"><b>${playlists[i].title}</b></p>
                        ${likes_p}
                        <p class="card-text"><small>${playlists[i].descripted_by}</small></p>
                    </div>
                    <div class="card-footer mb-1">
                        <a href="/playlist/${title_encoded}" class="btn btn-primary btn-outline-dark">View playlist</a>
                    </div>

                </div>
            </div>`;
    }
}


// Display users
function display_profiles(usernames){
    document.getElementById("page_nav").innerHTML = "";
    document.getElementById("search_results").innerHTML = `<div id="container-users" class="row d-flex align-items-center my-5 g-2">
                </div>`;
    const container = document.getElementById("container-users");
    // const container = document.getElementById("search_results");
    for (let i=0; i < usernames.length; i++){
        const username_encoded = encodeURIComponent(usernames[i]);
        container.innerHTML += `<div class="row justify-content-center mb-2">
                        <p class="col-2">${usernames[i]}</p>
                        <a role="button" href="/profile/${username_encoded}" class="col-2 btn btn-primary btn-outline-dark">View profile</a>
                    </div>`;
    }
}



// Display tracks
function display_songs(tracks_info){
    document.getElementById("search_results").innerHTML = `<div class="col-xl-8 align-center">
                <table class="table table-sm align-middle">
                    <thead>
                        <tr>
                          <th scope="col">Title</th>
                          <th scope="col">Artists</th>
                          <th scope="col">Album</th>
                          <th scope="col">Released</th>
                          <th scope="col">Duration</th>
                        </tr>
                      </thead>
                      <tbody id="songs">
                      </tbody>
                </table>
            </div>`;

    const results = document.getElementById("songs");
    results.innerHTML = "";
    for (let i=0; i < tracks_info.items.length; i++){
        let song = tracks_info.items[i];
        let name = song.name;
        let album = song.album.name;
        let release_date = song.album.release_date;
        let duration = msToTime(song.duration_ms);
        
        // let genres = [];
        let artists = "";
        for(let j=0; j < song.artists.length; j++){
            artists += song.artists[j].name;
            if(j < song.artists.length-1){
                artists += ", ";
            }
            // genres.concat(song.artists[j].genres);
        }
        // genres = [...new Set(genres)];  // remove duplicates

        results.innerHTML += `<tr id="${song.id}">
        <td>${name}</td>
        <td>${artists}</td>
        <td>${album}</td>
        <td>${release_date}</td>
        <td>${duration}</td>
      </tr>`;
    }
}


// Get next results, starting from current offset
async function next(){
    if(offset == 0){
        document.getElementById("prev_button").disabled = false;
    }
    offset += limit;
    let results = [];
    switch(type){
        case "artist":
        case "track":
            results = await search_spotify();
            break;
        case "playlist":
            results = await search_playlists();
            break;
    }
}


// Get previous results, starting from current offset
async function prev(){
    offset -= limit;
    if(offset <= 0){
        offset = 0;
        document.getElementById("prev_button").disabled = true;
    }
    let results = [];
    switch(type){
        case "artist":
        case "track":
            results = await search_spotify();
            break;
        case "playlist":
            results = await search_playlists();
            break;
    }
}



// Search
// Search playlists, profiles in db
// Search songs, authors in Spotify API
async function search_snm(){
    document.getElementById("search_button").classList.add("btn--loading");

    type = document.getElementById("type").value;
    const query = document.getElementById("search").value;
    query_encoded = encodeURIComponent(query);
    limit = 6;
    offset = 0;

    display_page_nav();
    switch(type){
        case "playlist":
            await search_playlists();
            break;
        case "track":
            limit = 12;
            await search_spotify();
            break;
        case "artist":
            await search_spotify();
            break;
        case "profile":
            await search_profile();
            break;
    }

    document.getElementById("search_button").classList.remove("btn--loading");
}


// Search playlists in db, by title or by tags
async function search_playlists(){
    const res = await fetch(`/playlist/search/${query_encoded}/${limit}/${offset}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    });
    if(res.ok){
        const results = await res.json();
        console.log("Search results: ", results);
        display_playlists(results.playlists);
        document.getElementById("search_button").classList.remove("btn--loading");

    }else{
        const error = await res.json();
        console.log(error.message);
    }
    document.getElementById("search_button").classList.remove("btn--loading");
}



// Search for user profile (username, public playlists) by username
// No limit, no offset
async function search_profile(){
    const res = await fetch(`/profile/search/${query_encoded}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    });
    if(res.ok){
        const results = await res.json();
        console.log("Search results: ", results);
        display_profiles(results.users);
        document.getElementById("search_button").classList.remove("btn--loading");

    }else{
        const error = await res.json();
        console.log(error.message);
    }
    document.getElementById("search_button").classList.remove("btn--loading");

}


// Search for artist in Spotify API
async function search_spotify(){
    const res = await fetch(`/search/${query_encoded}/${type}/${limit}/${offset}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    });
    if(res.ok){
        const results = await res.json();
        console.log("Search results: ", results);
        switch(type){
            case "artist":
                display_artists(results.artists);
                break;
            case "track":
                display_songs(results.tracks);
                break;
        }
        document.getElementById("search_button").classList.remove("btn--loading");

    }else{
        const error = await res.json();
        console.log(error.message);
    }
    document.getElementById("search_button").classList.remove("btn--loading");

}