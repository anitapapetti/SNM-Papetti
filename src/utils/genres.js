// Save user's favourite genres
async function save_genres(){
    document.getElementById("save_button").classList.add("btn-primary--loading");

    const fav_genres = [];
    const all_genres_labels = document.getElementsByClassName('form-check-label');
    for (genre_label of all_genres_labels){
        let id = genre_label.getAttribute('for');
        if( document.getElementById(id).checked === true){
            fav_genres.push(genre_label.textContent.trim());
        }
    }

    // if user made no changes, do nothing and go back to home page
    let old_fav_genres = sessionStorage.getItem("user_genres");
    if(old_fav_genres !== null){
        old_fav_genres = JSON.parse(old_fav_genres);
        old_fav_genres = old_fav_genres.genres;
        if(old_fav_genres.sort().join(',') === fav_genres.sort().join(',')){
            console.log("No changes.");
            // go back to /home (default) or go to /choose-artists (during signup)
            const url_components = window.location.pathname.split('/');
            if(url_components.length === 3 && url_components[2] === "signup"){
                window.location.href = BASE_URL + "/choose-artists/signup";
            }else{
                window.location.href = BASE_URL + "/home";
            }
            return;
        }
    }

    // save favourite genres in db
    console.log("Saving genres: ", fav_genres);
    const res = await fetch("/genres", {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({genres: fav_genres}),
    });

    if(res.ok){
        console.log("Saved.");

        // save user's new favourite genres in session storage
        try{
            sessionStorage.setItem("user_genres", JSON.stringify({genres: fav_genres}));
        }catch{ // QuotaExceededError
            sessionStorage.clear();
            sessionStorage.setItem("user_genres", JSON.stringify({genres: fav_genres}));
        }

        // go back to /home (default) or go to /choose-artists (during signup)
        if( document.getElementById("dont-save").children[0].tagName == 'A'){
            window.location.href = BASE_URL + "/choose-artists/signup";
        }else{
            window.location.href = BASE_URL + "/home";
        }
    }else{
        document.getElementById("save_button").classList.remove("btn-primary--loading");
        const error = await res.json();
        console.log(error.message);
    }
}


// Get music genres from Spotify API and write them in choose-genres.html
// If in signup, changes cancel button to "maybe later" link
async function write_genres(){
    const url_components = window.location.pathname.split('/');
    if(url_components.length === 3 && url_components[2] === "signup"){
        document.getElementById("dont-save").innerHTML = '<a href="/choose-artists/signup">Maybe later</a>';
    }

    // try to get spotify genres from session storage
    let genres_json = sessionStorage.getItem("spotify_genres");
    if(genres_json !== null){
        genres_json = JSON.parse(genres_json);
        console.log("Sending back cached data.");
    }else{
        // get genres from Spotify
        console.log("Requesting genres from Spotify...");
        const res = await fetch("/get-genres", {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if(res.ok){
            genres_json = await res.json();
            // save spotify genres in session storage
            try{
                sessionStorage.setItem("spotify_genres", JSON.stringify(genres_json));
            }catch{ // QuotaExceededError
                sessionStorage.clear();
                sessionStorage.setItem("spotify_genres", JSON.stringify(genres_json));
            }
            console.log("Obtained genres from Spotify.");
        }else{
            const error = await res.json();
            console.log(error.message);
            return;
        }
    }


    // get user's favourite genres
    // try to get user's genres from session storage
    let fav_genres = sessionStorage.getItem("user_genres");
    if(fav_genres !== null){
        fav_genres = JSON.parse(fav_genres);
        console.log("Sending back cached data.");
    }else{
        // get user's genres from db
        console.log("Requesting user's genres from db...");
        const res = await fetch("/get-user-genres", {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if(res.ok){
            fav_genres = await res.json();
            // save user's genres in session storage
            try{
                sessionStorage.setItem("user_genres", JSON.stringify(fav_genres));
            }catch{ // QuotaExceededError
                sessionStorage.clear();
                sessionStorage.setItem("user_genres", JSON.stringify(fav_genres));
            }
            console.log("Obtained genres from db.");
        }else{
            const error = await res.json();
            console.log(error.message);
            return;
        }
    }
    fav_genres = fav_genres.genres;

    // write genres in html page
    const div = document.getElementById("genres");
    div.innerHTML = '';

    const start_col_div = `<div class="col">\n`;
    const end_col_div = `</div>\n`;
    const number_of_columns = 4;
    const genres_per_column = Math.ceil(genres_json.genres.length / number_of_columns);
    let counter = 0;
    let content = start_col_div;
    let check = "";
    for (genre of genres_json.genres){
        if((counter > 0) && ( counter % genres_per_column == 0)){
            content += end_col_div;
            div.innerHTML += content;
            content = start_col_div;
        }
        // check checkbox if it's one of user's current favourite genres
        if(fav_genres.includes(genre)){
            check = "checked";
        }else{
            check = "";
        }

        content += `<div class="form-check">
            <input class="form-check-input" type="checkbox" value="" id="genre-${counter}" ${check}>
            <label class="form-check-label" for="genre-${counter}">
                ${genre}
            </label>
        </div>`;
        counter++;
    }
    // write remaining genres in last column
    // if genres are a multiple of number_of_columns, it adds an empty div
    content += end_col_div;
    div.innerHTML += content;
}