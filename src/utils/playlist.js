var playlist_duration_ms = 0;

// add songs in playlist:
// - add song to playlist in db
// - move song from results table to playlist songs table, changing add button to remove button
async function add_song(Spotify_ID){
    // prepare to move song to playlist table
    const playlist_songs = document.getElementById("songs");

    const song_row = document.getElementById(Spotify_ID);
    const tds = song_row.getElementsByTagName("td");
    const duration = tds[tds.length - 2].textContent;
    console.log(duration);
    tds[tds.length - 1].innerHTML = `<button class="btn btn-outline-light btn-dark" type="button" onclick="remove_song('${Spotify_ID}')">Remove</button>`;

    const song_count_th = document.createElement("th");
    song_count_th.setAttribute("scope", "row");
    const song_count = playlist_songs.getElementsByTagName("tr").length + 1;
    song_count_th.innerHTML = song_count;
    song_row.appendChild(song_count_th);
    song_row.insertBefore(song_count_th, song_row.firstChild);
    

    // add song to playlist in db
    const res = await fetch(`/playlist/add-song`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({title: title, song_id: Spotify_ID})
    });
    if(res.ok){
        // add to playlist duration
        let times = duration.split(":");
        playlist_duration_ms += (Number(times[0]) * 60 + Number(times[1])) * 1000;
        write_playlist_duration();
        // display added song in playlist table
        playlist_songs.appendChild(song_row);
    }
    const results = await res.json();
    console.log(results.message);
}


// Create new playlist with playlist info (title, description, tags) and display it
async function create_playlist(){
    document.getElementById("save_button").classList.add("btn-primary--loading");

    let all_valid = true;
    // save title
    let input = document.getElementById("title").value
    if(!input){
        document.getElementById("title").classList.add("is-invalid");
        all_valid = false;
    }else{
        var title = input;
    }
    // save description
    input = document.getElementById("description").value
    if(!input){
        document.getElementById("description").classList.add("is-invalid");
        all_valid = false;
    }else{
        var descripted_by = input;
    }
    // save tags
    input = document.getElementById("tags").value
    if(!input){
        document.getElementById("tags").classList.add("is-invalid");
        all_valid = false;
    }else{
        var tags = input.split(" ");
    }
    if(all_valid === false){
        document.getElementById("save_button").classList.remove("btn-primary--loading");
        return;
    }
    var is_public = false;
    if (document.getElementById('public').checked) {
        is_public = true;
    }

    // create playlist in db
    console.log("Creating playlist...");
    const res = await fetch("/create-playlist", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({title: title, descripted_by: descripted_by, tags: tags, is_public: is_public}),
    });

    if(res.ok){
        console.log("New playlist saved.");
        sessionStorage.removeItem("user_playlists");
        // display playlist
        window.location.href = BASE_URL + `/playlist/${title}`;
    }else{
        document.getElementById("save_button").classList.remove("btn-primary--loading");
        const error = await res.json();
        console.log(error.message);
    }
}


// Delete playlist
async function delete_playlist(){
    document.getElementById("delete_button").classList.add("btn-danger--loading");
    let answer_delete = window.confirm("PERMANENTLY DELETE PLAYLIST?");

    if (answer_delete) {
        console.log("Deleting playlist...");
        
        const res = await fetch(`/playlist`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({title: title})
        });
        const response = await res.json();
        console.log(response.message);
        document.getElementById("delete_button").classList.remove("btn-danger--loading");

        if( res.ok ){
            sessionStorage.removeItem("user_playlists");
            window.location.href = BASE_URL + "/library";
            return;
        }
    }
    document.getElementById("delete_button").classList.remove("btn-danger--loading");
}


// Displays song's search results
function display_search_results(tracks_info, number_to_display = 8){
    number_to_display = Math.min(number_to_display, tracks_info.limit);
    const results = document.getElementById("search_results");
    results.innerHTML = "";
    for (let i=0; i < number_to_display; i++){
        let song = tracks_info.items[i];
        let name = song.name;
        let album = song.album.name;
        let release_date = song.album.release_date;
        let duration = msToTime(song.duration_ms);
        
        let artists = "";
        for(let j=0; j < song.artists.length; j++){
            artists += song.artists[j].name;
            if(j < song.artists.length-1){
                artists += ", ";
            }
        }

        results.innerHTML += `<tr id="${song.id}">
        <td>${name}</td>
        <td>${artists}</td>
        <td>${album}</td>
        <td>${release_date}</td>
        <td>${duration}</td>
        <td>
        <button class="btn btn-outline-light btn-dark" type="button" onclick="add_song('${song.id}')">Add</button>
        </td>
      </tr>`;
    }
}


// Get playlist info and list of song ids from db
async function get_playlist(title_encoded){
    console.log("Requesting playlist from db...");
    const res = await fetch(`/playlist-info/${title_encoded}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    });
    
    if(res.ok){
        const playlist = await res.json();
        console.log("Res json from db: ", playlist);
        return playlist;
    }else{
        const error = await res.json();
        console.log(error.message);
        // send to search page
        window.location.href = BASE_URL + "/search"
        return;
    }
}


// Go to modify playlist page
async function get_modify_playlist(){
    const title_encoded = encodeURIComponent(title);
    window.location.href = BASE_URL + "/playlist/" + title_encoded + "/modify";
}


// Remove song from playlist in db and from displayed songs
async function remove_song(Spotify_ID){
    // disable remove button
    const song_row = document.getElementById(Spotify_ID);
    const tds = song_row.getElementsByTagName("td");
    const duration = tds[tds.length - 2].textContent;
    const remove_button = song_row.getElementsByTagName("button")[0];
    remove_button.disabled = true;

    // remove from db
    const res = await fetch(`/playlist/remove-song`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({title: title, song_id: Spotify_ID})
    });
    const response = await res.json();
    console.log(response.message);

    if(res.status === 200){
        // remove from display
        song_row.parentNode.removeChild(song_row);
        // subtract from playlist duration
        let times = duration.split(":");
        playlist_duration_ms -= (Number(times[0]) * 60 + Number(times[1])) * 1000;
        write_playlist_duration();
    }else{
        remove_button.disabled = false;
    }
}


// Search for song with Spotify API
async function search_song(){
    document.getElementById("search_button").classList.add("btn--loading");
    const song = document.getElementById("search").value;
    if(song === ""){
        return;
    }
    let song_uri = encodeURI(song);

    console.log("Searching song ", song, " in Spotify...");
    const res = await fetch(`/search/${song_uri}/track/10/0`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    });
    if(res.ok){
        const results = await res.json();
        console.log("Songs found: ", results.tracks);
        document.getElementById("search_button").classList.remove("btn--loading");
        display_search_results(results.tracks, 10);

    }else{
        const error = await res.json();
        console.log(error.message);
    }
    document.getElementById("search_button").classList.remove("btn--loading");
}


// change label "like" <-> "liked"
// add/remove like to playlist in db
// add/remove playlist to user's liked playlists in db
async function toggle_like(){
    const was_liked = document.getElementById("like").checked;  // checked value before click
    let likes_number = document.getElementById("likes").innerHTML.split(" ")[0];
    let action = "add";
    if(was_liked === true){
        // remove "like"
        document.getElementById("like").nextElementSibling.innerHTML = "like";
        likes_number = Number(likes_number) - 1;
        action = "remove";
    }else{
        // add "like"
        document.getElementById("like").nextElementSibling.innerHTML = "liked";
        likes_number = Number(likes_number) + 1;
    }
    document.getElementById("likes").innerHTML = likes_number + " likes";
    
    const res = await fetch("/like", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({action: action, title: title}),
    });

    const results = await res.json();
    console.log(results.message);
    sessionStorage.removeItem("liked_playlists");
}


// update playlist info (title, visibility, description, tags)
async function update_playlist(){
    console.log("Updating playlist info...");
    document.getElementById("save_button").classList.add("btn-primary--loading");

    // check that new info is present and save it
    let all_valid = true;
    // save title
    let input = document.getElementById("title").value
    if(!input){
        document.getElementById("title").classList.add("is-invalid");
        all_valid = false;
    }else{
        var new_title = input;
    }
    // save description
    input = document.getElementById("description").value
    if(!input){
        document.getElementById("description").classList.add("is-invalid");
        all_valid = false;
    }else{
        var new_description = input;
    }
    // save tags
    input = document.getElementById("tags").value
    if(!input){
        document.getElementById("tags").classList.add("is-invalid");
        all_valid = false;
    }else{
        var new_tags = input.trim().split(" ");
    }
    if(all_valid === false){
        document.getElementById("save_button").classList.remove("btn-primary--loading");
        return;
    }

    var is_public = false;
    if (document.getElementById('public').checked) {
        is_public = true;
    }

    const res = await fetch(`/playlist/update-info`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({old_title: title, title: new_title, descripted_by: new_description, tags: new_tags, is_public: is_public})
    });
    
    const results = await res.json();
    console.log(results.message);

    if(res.ok){
        title = new_title;
        sessionStorage.removeItem("user_playlists");
        window.location.href = BASE_URL + "/playlist/" + new_title;
    }
}


// Write current playlist info (title, visibility, description, tags) in modify playlist page
async function write_modify_playlist(){
    const title_encoded = window.location.pathname.split('/')[2];
    title = decodeURIComponent(title_encoded);

    const playlist = await get_playlist(title_encoded);

    if( playlist.is_yours === false){
        conole.log("Error: Unauthorized.");
        window.location.href = BASE_URL + "/library";
        return;
    }

    document.getElementById("title").value = title;

    document.getElementById("description").value = playlist.descripted_by;

    let tags_display = "";
    for(let i=0; i < playlist.tags.length; i++){
        tags_display += playlist.tags[i];
        if( i < playlist.tags.length - 1){
            tags_display += " ";
        }
    }
    document.getElementById("tags").value = tags_display;

    if(playlist.is_public === true){
        document.getElementById("public").checked = true;
    }else{
        document.getElementById("private").checked = true;
    }
}



// Write playlist info in html page
// If user is playlist's author, display playlist info, songs with remove button and put search bar
// If not: if searched playlist is public then show it, otherwise go to search page
async function write_playlist(){
    const title_encoded = window.location.pathname.split('/')[2];
    title = decodeURIComponent(title_encoded);
    
    const playlist = await get_playlist(title_encoded);

    // display playlist info
    document.getElementById("title").innerHTML = title;
    document.getElementById("description").innerHTML = playlist.descripted_by;
    document.getElementById("likes").innerHTML = playlist.likes + " likes";

    let caption = "Public playlist";
    if( playlist.is_public === false){
        caption = "Private playlist";
        document.getElementById("likes_row").innerHTML = '<p id="duration" class="hint col"></p>';
    }
    caption += " by " + playlist.author;
    document.getElementById("visibility").innerHTML = caption;

    
    let tags_display = "Tags: ";
    for(let i=0; i < playlist.tags.length; i++){
        tags_display += playlist.tags[i];
        if( i < playlist.tags.length - 1){
            tags_display += ", ";
        }
    }
    document.getElementById("tags").innerHTML = tags_display;

    if(playlist.liked === true && playlist.is_public === true){
        document.getElementById("like").checked = true;
        document.getElementById("like").nextElementSibling.innerHTML = "liked";
    }

    playlist_duration_ms = 0;
    // search playlist current songs in Spotify and display them
    if(playlist.songs.length > 0){
        let song_ids = "ids=";
        for(let i=0; i < playlist.songs.length; i++){
            song_ids += playlist.songs[i];
            if( i < playlist.songs.length - 1){
                song_ids += ",";
            }
        }
        console.log("Getting playlist songs info from Spotify...");
        const res = await fetch(`/songs/${song_ids}`, {
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

        const songs = res_json.tracks;
        const playlist_songs = document.getElementById("songs");    // tbody
        for(let i=0; i < songs.length; i++){
            // extract info and display
            let name = songs[i].name;
            let artists = songs[i].artists;
            let album = songs[i].album;
            let release_date = songs[i].release_date;
            let duration = msToTime(songs[i].duration_ms);
            playlist_duration_ms += songs[i].duration_ms;

            playlist_songs.innerHTML += `<tr id="${songs[i].id}">
            <th scope="row">${i+1}</th>
            <td>${name}</td>
            <td>${artists}</td>
            <td>${album}</td>
            <td>${release_date}</td>
            <td>${duration}</td>
            <td>
            <button class="btn btn-outline-light btn-dark" type="button" onclick="remove_song('${songs[i].id}')">Remove</button>
            </td>
        </tr>`;

        }
    }
    // write playlist duration
    write_playlist_duration();

    if( playlist.is_yours == false){
        // remove remove button table column (last column)
        const buttons_col_head = document.getElementById("songs_head_row").lastChild;
        buttons_col_head.remove();

        const song_rows = document.getElementById("songs").getElementsByTagName("tr");
        for (row of song_rows){
            const tds = row.getElementsByTagName("td");
            tds[tds.length - 1].innerHTML = "";
        }
    }else{
        // add modify/delete buttons
        document.getElementById("modify_row").innerHTML = `<div class="m-2">
                    <button id="modify_button" class="btn btn-outline-light btn-dark" type="button" onclick="get_modify_playlist()">Modify info</button>
                </div>
                <div class="m-2">
                    <button id="delete_button" type="button" class="btn btn-danger btn-outline-light" onclick="delete_playlist()">Delete playlist</button>
                </div>`;
        // add search part
        document.getElementById("search_row").innerHTML = `<div class="row">
                    <p> Add songs to your playlist: </p>
                    <form class="d-flex mb-2">
                        <input id="search" class="form-control me-2" type="search" placeholder="Search" aria-label="Search">
                        <button id="search_button" class="btn btn-outline-light btn-dark" type="button" onclick="search_song()">Search</button>
                    </form>
                </div>
                
                <!-- <div class="row my-3 justify-content-center" id="search_results"></div> -->
                <table class="table table-sm align-middle">
                    <thead>
                        <tr>
                          <th scope="col">Title</th>
                          <th scope="col">Artists</th>
                          <th scope="col">Album</th>
                          <th scope="col">Released</th>
                          <th scope="col">Duration</th>
                          <th scope="col"></th>
                        </tr>
                      </thead>
                      <tbody id="search_results">
                      </tbody>
                </table>`;
    }
}


// Write playlist duration in playlist page
function write_playlist_duration(){
    let s = playlist_duration_ms;
        let ms = s % 1000;
        s = (s - ms) / 1000;
        let secs = s % 60;
        s = (s - secs) / 60;
        let mins = s % 60;
        let hrs = (s - mins) / 60;
    
        if(mins < 10){
            mins = '0' + mins.toString();
        }
        if(hrs < 10){
            hrs = '0' + hrs.toString();
        }
        s = hrs + "h " + mins + "min";
        if(hrs === '00'){
            s = mins + "min";
        }
        document.getElementById("duration").innerHTML = s;
}