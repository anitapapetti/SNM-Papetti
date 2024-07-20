const IMAGE_URL_DEFAULT = "/images/blank-profile-picture.png";


// Display user's fav artists
function display_artists(artists){
    document.getElementById("artists").innerHTML = `<div id="container-artists" class="row row-cols-1 row-cols-lg-2 d-flex align-items-center g-2">
                </div>`;
    const container = document.getElementById("container-artists");
    container.innerHTML = "";

    for (let i=0; i < artists.length; i++){
        const artist_id = artists[i].id;
        const artist_name = artists[i].name;
        const artist_genres = artists[i].genres;
        let image_url = artists[i].image_url;
        if(image_url === null){
            image_url = IMAGE_URL_DEFAULT;
        }
        let genres = "";
        for(let j=0; j < artist_genres.length; j++){
            genres += artist_genres[j];
            if(j < artist_genres.length - 1){
                genres += ", ";
            }
        }
        container.innerHTML +=  `<div class="col" id="card-${i}">
                     <div class="card">
                        <div class="row g-0">
                            <div class="col-2">
                            <img class="img-fluid rounded-start" alt="..." src=${image_url}>
                            </div>
                            <div class="col-10">
                                <div class="card-body">
                                    <div id=${artist_id} class="row align-items-center">
                                        <p class="col-4">${artist_name}</p>
                                        <p class="col-8">${genres}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                     </div>
                 </div>`;
    }
}


// Display user's fav genres
function display_genres(genres){
    document.getElementById("genres").innerHTML = `<div id="container-genres" class="row g-2 mb-5">
                </div>`;
    const container = document.getElementById("container-genres");
    for(let i=0; i < genres.length; i++){
        container.innerHTML +=  `<div class="col" id="card-${i}">
                <div class="card">
                    <div class="card-body">
                        <p class="card-text">${genres[i]}</p>
                    </div>
                </div>
            </div>`;
    }

}


// Display user's profile
async function display_profile(info){
    // genres
    if(info.genres.length > 0){
        display_genres(info.genres);
    }

    // artists
    if(info.artists.length > 0){
        const artists = await get_artists(info.artists);
        display_artists(artists);
    }

    // playlists
    if(info.playlists.length > 0){
        document.getElementById("playlists").innerHTML = `<div id="container-playlists" class="row row-cols-2 row-cols-md-3 row-cols-lg-4 row-cols-xl-6 g-4 mb-5">
                    </div>`;
        display_playlists("container-playlists", info.playlists);   // function display_playlists is in library.js
    }
}


// Get artists info from Spotify
async function get_artists(artists_ids){
    if(artists_ids.length === 0){
        return;
    }

    // get artists info from Spotify
    console.log("Getting artists info from Spotify...");
    let ids = "ids=";
    for(let i=0; i < artists_ids.length; i++){
        ids += artists_ids[i];
        if( i < artists_ids.length - 1){
            ids += ",";
        }
    }
    const res = await fetch(`/artists/${ids}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            }
    });
    const res_json = await res.json();
    if(!res.ok){
        console.log(res_json.message);
        return;
    }

    return res_json.artists;
}


// Write profile info in html page
async function write_profile(){
    const url_components = window.location.pathname.split('/');
    let username_encoded = "";
    if(url_components.length === 3){
        username_encoded = window.location.pathname.split('/')[2];
    }
    
    const res = await fetch(`/profile-info/${username_encoded}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    });
    if(res.ok){
        const results = await res.json();
        console.log("Profile: ", results);

        const username = results.username;
        document.getElementById("title_genres").innerHTML = `${username}'s genres`;
        document.getElementById("title_artists").innerHTML = `${username}'s artists`;
        document.getElementById("title_playlists").innerHTML = `${username}'s playlists`;

        display_profile(results);
    }else{
        const error = await res.json();
        console.log(error.message);
    }
}