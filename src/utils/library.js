var your_offset = 0;
var your_limit = 6;
var liked_offset = 0;
var liked_limit = 6;

// Display playlists in element with id=element_id in html page library
function display_playlists(element_id, playlists){
    if(playlists.length === 0){
        return;
    }
    
    document.getElementById(element_id).innerHTML = "";
    for(let i=0; i < playlists.length; i++){
        const title_encoded = encodeURIComponent(playlists[i].title);
        let visibility = "Public";
        let likes_p = `<p class="card-text hint">${playlists[i].likes} likes</p>`;
        if(playlists[i].is_public === false){
            visibility = "Private";
            likes_p = ``;
        }
        document.getElementById(element_id).innerHTML += `<div class="col" id="card-${i}">
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


// Get liked playlists
// Gets a number=limit of playlists, starting from offset
// If playlists in session storage, get them
// If not, get all playlists from db and save them in session storage
async function get_liked_playlists(limit = 6, offset = 0){
    // try to get playlists from session storage
    let playlists = sessionStorage.getItem("liked_playlists");
    if(playlists !== null){
        playlists = JSON.parse(playlists);
        console.log("Sending back cached data.");
    }else{
        // get liked playlists from db
        console.log("Getting liked playlists from db...");
        const res = await fetch("/liked-playlists", {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if(res.ok){
            playlists = await res.json();
            console.log("Res json from db: ", playlists);
            // save liked playlists in session storage
            try{
                sessionStorage.setItem("liked_playlists", JSON.stringify(playlists));
            }catch{ // QuotaExceededError
                sessionStorage.clear();
                sessionStorage.setItem("liked_playlists", JSON.stringify(playlists));
            }
            console.log("Obtained playlists from db.");
        }else{
            const error = await res.json();
            console.log(error.message);
            return;
        }
    }
    playlists = playlists.playlists;

    if(playlists.length <= limit){
        return playlists;
    }

    if( offset < 0){
        while(offset < 0){
            offset += playlists.length;
        }
        liked_offset = offset;
    }
    const start_index = offset % playlists.length;
    const end_index = (start_index + limit) % playlists.length;
    if(start_index <= end_index){
        return playlists.slice(start_index, end_index);
    }else{
        const first_part = playlists.slice(start_index, playlists.length);
        const second_part = playlists.slice(0, end_index);
        return first_part.concat(second_part);
    }
}


// Get user's playlists
// Gets a number=limit of playlists, starting from offset
// If playlists in session storage, get them
// If not, get all playlists from db and save them in session storage
async function get_playlists(limit = 6, offset = 0){
    // try to get user's playlists from session storage
    let playlists = sessionStorage.getItem("user_playlists");
    if(playlists !== null){
        playlists = JSON.parse(playlists);
        console.log("Sending back cached data.");
    }else{
        // get user's playlists from db
        console.log("Getting user's playlists from db...");
        const res = await fetch("/playlists", {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if(res.ok){
            playlists = await res.json();
            console.log("Res json from db: ", playlists);
            // save user's playlists in session storage
            try{
                sessionStorage.setItem("user_playlists", JSON.stringify(playlists));
            }catch{ // QuotaExceededError
                sessionStorage.clear();
                sessionStorage.setItem("user_playlists", JSON.stringify(playlists));
            }
            console.log("Obtained playlists from db.");
        }else{
            const error = await res.json();
            console.log(error.message);
            return;
        }
    }
    playlists = playlists.playlists;

    if(playlists.length <= limit){
        return playlists;
    }

    if( offset < 0){
        while(offset < 0){
            offset += playlists.length;
        }
        your_offset = offset;
    }
    const start_index = offset % playlists.length;
    const end_index = (start_index + limit) % playlists.length;
    if(start_index <= end_index){
        return playlists.slice(start_index, end_index);
    }else{
        const first_part = playlists.slice(start_index, playlists.length);
        const second_part = playlists.slice(0, end_index);
        return first_part.concat(second_part);
    }
}


// Get next number=limit of playlists, starting from current offset
async function next(){
    your_offset += your_limit;
    const playlists = await get_playlists(your_limit, your_offset);
    display_playlists("container-yours", playlists);
}


// Get next number=limit of liked playlists, starting from current offset
async function next_liked(){
    liked_offset += liked_limit;
    const playlists = await get_liked_playlists(liked_limit, liked_offset);
    display_playlists("container-liked", playlists);
}


// Get previous number=limit of playlists, starting from current offset
async function prev(){
    your_offset -= your_limit;
    const playlists = await get_playlists(your_limit, your_offset);
    display_playlists("container-yours", playlists);
}


// Get previous number=limit of liked playlists, starting from current offset
async function prev_liked(){
    liked_offset -= liked_limit;
    const playlists = await get_liked_playlists(liked_limit, liked_offset);
    display_playlists("container-liked", playlists);
}


// Write playlists previews in library page
async function write_library(){
    // get and display your playlists (playlists you authored)
    your_offset = 0;
    your_limit = 6;
    const playlists = await get_playlists(your_limit, your_offset);
    console.log("Playlists: ", playlists);
    
    if(playlists.length > 0){
        document.getElementById("your_playlists").innerHTML =  `<div class="row g-4">
                    <nav aria-label="Playlist navigation">
                        <ul class="pagination">
                            <li class="page-item"><button class="page-link" onclick="prev()">Prev</button></li>
                            <li class="page-item"><button class="page-link" onclick="next()">Next</button></li>
                        </ul>
                    </nav>
                </div>
                <div id="container-yours" class="row row-cols-2 row-cols-md-3 row-cols-lg-4 row-cols-xl-6 g-4">
                </div>`;
        
        display_playlists("container-yours", playlists);
    }

    // get and display playlists you liked
    liked_offset = 0;
    liked_limit = 6;
    const liked_playlists = await get_liked_playlists(liked_limit, liked_offset);
    console.log("Liked playlists: ", liked_playlists);
    
    if(liked_playlists.length > 0){
        document.getElementById("liked_playlists").innerHTML =  `<div class="row g-4">
                    <nav aria-label="Playlist navigation">
                        <ul class="pagination">
                            <li class="page-item"><button class="page-link" onclick="prev_liked()">Prev</button></li>
                            <li class="page-item"><button class="page-link" onclick="next_liked()">Next</button></li>
                        </ul>
                    </nav>
                </div>
                <div id="container-liked" class="row row-cols-2 row-cols-md-3 row-cols-lg-4 row-cols-xl-6 g-4 mb-5">
                </div>`;
        
        display_playlists("container-liked", liked_playlists);
    }
}
