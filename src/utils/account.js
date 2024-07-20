// Ask to confirm and then delete account
async function delete_account(){
    document.getElementById("delete_button").classList.add("btn-danger--loading");
    let answer_delete = window.confirm("ARE YOU SURE?\nACCOUNT WILL BE DELETED AND PERMANENTLY LOST");

    if (answer_delete) {
        console.log("Deleting account...");
        
        const res = await fetch("/account", {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if( res.ok ){
            const response = await res.json();
            sessionStorage.clear();
            window.location.href = BASE_URL;
            console.log(response.message);
            return
        }else{
            const error = await res.json();
            console.log(error.message);
        }
    } 
    document.getElementById("delete_button").classList.remove("btn-danger--loading");
}


// Get user's current settings (username, email)
async function get_current_account_info(){
    // try to get settings from session storage
    let settings_json = sessionStorage.getItem("account");
    if(settings_json !== null){
        console.log("Sending back cached data...");
        return  JSON.parse(settings_json);
    }else{
        // get settings from db
        console.log("Getting current account info from db...");
        const res = await fetch("/get-account", {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if(res.ok){
            settings_json = await res.json();
            const settings = {username: settings_json.username, email: settings_json.email};
            // save settings in session storage
            try{
                sessionStorage.setItem("account", JSON.stringify(settings));
            }catch{ // QuotaExceededError
                sessionStorage.clear();
                sessionStorage.setItem("account", JSON.stringify(settings));
            }
            console.log("Sending back account info from db...");
            return settings;
        }else{
            const error = await res.json();
            console.log(error.message);
            return;
        }
    }
}


// Save changed settings values in db
async function save_account_info(){
    document.getElementById("save_button").classList.add("btn-primary--loading");

    const { username, email } = await get_current_account_info();

    const new_username = document.getElementById('username').value;
    const new_email = document.getElementById('email').value;
    const new_password = document.getElementById('password').value;
    const new_password2 = document.getElementById('password-confirm').value;

    const invalid_fields = validateUserInfo(new_username, new_email, new_password, new_password2);
    if(invalid_fields.length > 0){
        return show_invalid(invalid_fields);
    }

    let confirm_message = "New settings:\n";
    const changed = {};
    if( new_username != username){
        changed.username = new_username;
        confirm_message += "    - username = " + new_username + "\n";
    }
    if( new_email != email){
        changed.email = new_email;
        confirm_message += "    - email = " + new_email + "\n";
    }
    if( new_password != ""){
        // already checked that password == password2
        changed.password = new_password;
        const hidden_pswd = "*".repeat(new_password.length)
        confirm_message += "    - password = " + hidden_pswd + "\n";
    }
    
    if(confirm_message === "New settings:\n"){ // no changes
        window.location.href = BASE_URL + "/home";
        return;
    }

    confirm_message += "Old settings will be overwritten. Continue?";
    var answer = window.confirm(confirm_message);

    if (answer) {
        console.log("Saving...");
        
        const res = await fetch("/account", {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(changed)
        });
        
        if( res.ok ){
            const settings_json = await res.json();
            console.log(settings_json.message);

            const settings = {username: settings_json.username, email: settings_json.email};
            // save new settings in session storage
            try{
                sessionStorage.setItem("account", JSON.stringify(settings));
            }catch{ // QuotaExceededError
                sessionStorage.clear();
                sessionStorage.setItem("account", JSON.stringify(settings));
            }

            window.location.href = BASE_URL + "/home";
            return
        }else{
            const error = await res.json();
            console.log(error.message);
            
            if(res.status === 409){
                show_invalid(error.invalid_fields);
            }
        }
    }
    
    document.getElementById("save_button").classList.remove("btn-primary--loading");

}


// Show user which fields had invalid values
function show_invalid(invalid_fields){
    const username = document.getElementById('username');
    const email = document.getElementById('email');
    const password = document.getElementById('password');
    const password2 = document.getElementById('password-confirm');

    if(invalid_fields.includes("username")){
        username.classList.add('is-invalid');
    }else{
        username.classList.remove('is-invalid');
    }

    if(invalid_fields.includes("email")){
        email.classList.add('is-invalid');
    }else{
        email.classList.remove('is-invalid');
    }

    if(invalid_fields.includes("pswd")){
        password.classList.add('is-invalid');
        password2.classList.add('is-invalid');
    }else{
        password.classList.remove('is-invalid');
        password2.classList.remove('is-invalid');
    }
    password.value = "";
    password2.value = "";

    document.getElementById("save_button").classList.remove("btn-primary--loading");
    return;
}


// Validate user input before login
// Email is valid if in format any@any.any (any can contain other '.' characters)
// Password is valid if between 8 and 30 characters. Password and password-confirm must match
// returns array with invalid fields (empty array if all fields are valid)
function validateUserInfo(username, email, password, password2){
    let invalid_fields = [];

    if (username == "" || username.length < 3 || username.length > 15) {
        invalid_fields.push("username");
    }

    const email_re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;    // any@any.any (any can contain other '.' characters)
    if (email == "" || !email_re.test(email)) {
        invalid_fields.push("email");
    }

    if( !(password == "" && password2 == "")){
        if ( password.length < 8 || password.length > 30 || !(password === password2)) {
            invalid_fields.push("pswd");
        }
    }
    return invalid_fields;
}


// Write current settings in html page
async function write_current_account_info(){
    const {username, email} = await get_current_account_info();
    console.log("Writing ", username, email);
    document.getElementById('username').value = username;
    document.getElementById('email').value = email;
}