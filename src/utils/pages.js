const BASE_URL = "http://localhost:4000";


// Get html page with url given
async function get_page_with_url(url="/home"){
    window.location.href = BASE_URL + url;
}


// Convert time in milliseconds in string minutes:seconds 
function msToTime(s) {
    let ms = s % 1000;
    s = (s - ms) / 1000;
    let secs = s % 60;
    s = (s - secs) / 60;
    let mins = s % 60;
    // let hrs = (s - mins) / 60;
    
    if(secs < 10){
        secs = '0' + secs.toString();
    }
  
    return mins + ':' + secs;
}


// Remove 'is-invalid' from given entry field
function reset_entry_to_valid(field_id){
    const element = document.getElementById(field_id);
    element.classList.remove('is-invalid');
}