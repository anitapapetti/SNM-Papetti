const IMAGE_URL_DEFAULT = "/images/blank-profile-picture.png";

// Moves artist from results to favourite artists list in display
function add_artist(artist){
    const [ id, image_url, name ] = artist.split(",");
    const artist_display = document.getElementById(id);
    const add_button = artist_display.getElementsByClassName("btn")[0];
    artist_display.removeChild(add_button);
    artist_display.innerHTML += `<button class="btn btn-outline-light btn-dark col-3" type="button" onclick="remove_artist('${id}')">Remove</button>`;
    const favourites = document.getElementById("fav_artists");
    favourites.appendChild(artist_display);
}


// Displays current favourite artists
// If in signup, changes cancel button to "maybe later" link
async function display_current_fav_artists(){
    const url_components = window.location.pathname.split('/');
    if(url_components.length === 3 && url_components[2] === "signup"){
        document.getElementById("dont-save").innerHTML = '<a href="/home">Maybe later</a>';
    }

    // get current fav artists ids
    const artists_ids = await get_current_fav_artists();
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

    const artists_info = res_json.artists;

    // display them
    const fav_div = document.getElementById("fav_artists");
    fav_div.innerHTML = "";
    for (let i=0; i < artists_info.length; i++){
        const artist_id = artists_info[i].id;
        const artist_name = artists_info[i].name;
        let image_url = artists_info[i].image_url;
        if(image_url === null){
            image_url = IMAGE_URL_DEFAULT;
        }
        fav_div.innerHTML += `<div id=${artist_id} class="row d-flex align-items-center mb-2">
                        <img class="col-3" src=${image_url}>
                        <p class="col-6">${artist_name}</p>
                        <button class="btn btn-outline-light btn-dark col-3" type="button" onclick="remove_artist('${artist_id}')">Remove</button>
                    </div>`;
    }
}


// Displays artist's search results
function display_search_results(artists_info, number_to_display = 6){
    number_to_display = Math.min(number_to_display, artists_info.limit);
    const results_div = document.getElementById("search_results");
    results_div.innerHTML = "<h3>Results:</h3>";
    let image_url = IMAGE_URL_DEFAULT;
    for (let i=0; i < number_to_display; i++){
        let artist = artists_info.items[i];
        let images = artist.images;
        if(images && images.length){
            image_url = images[images.length-1].url;
        }
        results_div.innerHTML += `<div id=${artist.id} class="row align-items-center mb-2">
                        <img class="col-3" src=${image_url}>
                        <p class="col-6">${artist.name}</p>
                        <button class="btn btn-outline-light btn-dark col-3" type="button" onclick="add_artist('${artist.id},${image_url},${artist.name}')">Add</button>
                    </div>`;
    }
}


// Get user's current favourite artists ids
async function get_current_fav_artists(){
    // get user's favourite artists ids
    // try to get user's artists ids from session storage
    let fav_artists = sessionStorage.getItem("user_artists");
    if(fav_artists !== null){
        fav_artists = JSON.parse(fav_artists);
        console.log("Sending back cached data.");
    }else{
        // get user's artists ids from db
        console.log("Requesting user's artists from db...");
        const res = await fetch("/artists", {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if(res.ok){
            fav_artists = await res.json();
            console.log("Res json from db: ", fav_artists);
            // save user's artists in session storage
            try{
                sessionStorage.setItem("user_artists", JSON.stringify(fav_artists));
            }catch{ // QuotaExceededError
                sessionStorage.clear();
                sessionStorage.setItem("user_artists", JSON.stringify(fav_artists));
            }
            console.log("Obtained fav artists from db.");
        }else{
            const error = await res.json();
            console.log(error.message);
            return;
        }
    }
    fav_artists = fav_artists.artists;
    console.log("Current fav artists: ", fav_artists);

    return fav_artists;
}


// Remove artist from displayed fav artists list
function remove_artist(Spotify_ID){
    const element = document.getElementById(Spotify_ID);
    element.parentNode.removeChild(element);
}

// Save user's favourite artists
async function save_artists(){
    document.getElementById("save_button").classList.add("btn-primary--loading");
    console.log("Saving artists...");

    const new_favourites_display = document.getElementById("fav_artists").children;
    let new_favourites = [];
    for(let i=0; i < new_favourites_display.length; i++){
        let artist_display = new_favourites_display[i];
        new_favourites.push(artist_display.id);
    }

    // save favourite artists in db
    console.log("Saving artists: ", new_favourites);
    const res = await fetch("/artists", {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({artists: new_favourites}),
    });

    if(res.ok){
        console.log("Saved.");

        // save user's new favourite artists ids in session storage
        try{
            sessionStorage.setItem("user_artists", JSON.stringify({artists: new_favourites}));
        }catch{ // QuotaExceededError
            sessionStorage.clear();
            sessionStorage.setItem("user_artists", JSON.stringify({artists: new_favourites}));
        }

        // go back to home page
        window.location.href = BASE_URL + "/home";
    }else{
        document.getElementById("save_button").classList.remove("btn-primary--loading");
        const error = await res.json();
        console.log(error.message);
    }

}


// Search artist
async function search_artist(){
    document.getElementById("search_button").classList.add("btn--loading");
    let artist = document.getElementById("search").value;
    artist = encodeURIComponent(artist);

    console.log("Searching artist ", artist, " in Spotify...");
    const res = await fetch(`/search/${artist}/artist/6/0`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    });
    if(res.ok){
        const results = await res.json();
        console.log("Artists found: ", results.artists);
        display_search_results(results.artists, 6);
        document.getElementById("search_button").classList.remove("btn--loading");

    }else{
        const error = await res.json();
        console.log(error.message);
    }
    document.getElementById("search_button").classList.remove("btn--loading");
}