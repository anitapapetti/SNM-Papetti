// Show user which signup fields had invalid values
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


// Signup new user
async function signup(){
    console.log("Trying to signup...");
    document.getElementById("save_button").classList.add("btn-primary--loading");

    const username = document.getElementById('username');
    const email = document.getElementById('email');
    const password = document.getElementById('password');
    const password2 = document.getElementById('password-confirm');

    // check if user input is valid
    const invalid_fields = validateSignupInfo(username.value, email.value, password.value, password2.value);
    if(invalid_fields.length !== 0){
        show_invalid(invalid_fields);
        return;
    }

    const user = {
        username: username.value,
        email: email.value,
        password: password.value
    }

    try{
        const response = await fetch('/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(user)
        });

        if (response.ok) {
            response.json().then(userData => {
                console.log(userData.message);
                // app auth token was sent back and saved in a cookie
                //spotify token was sent back and saved in a cookie
            });
        } else {
            response.json().then((err) => {
                console.log(err.message);
                document.getElementById("save_button").classList.remove("btn-primary--loading");
                show_invalid(err.invalid_fields);
            })
            return;
        }

        // save empty array as user's favourite genres in session storage to avoid useless db query in choose-genres
        try{
            sessionStorage.setItem("user_genres", JSON.stringify({genres: []}));
        }catch{ // QuotaExceededError
            sessionStorage.clear();
            sessionStorage.setItem("user_genres", JSON.stringify({genres: []}));
        }

        // save empty array as user's favourite artists in session storage to avoid useless db query in choose-artists
        try{
            sessionStorage.setItem("user_artists", JSON.stringify({artists: []}));
        }catch{ // QuotaExceededError
            sessionStorage.clear();
            sessionStorage.setItem("user_artists", JSON.stringify({artists: []}));
        }

        // request choose-genres page (automatically sends app auth token in cookies)
        window.location.href = BASE_URL + "/choose-genres/signup";
        
    } catch(err){
        // Error while trying to signup
        console.log(err);
        document.getElementById("save_button").classList.remove("btn-primary--loading");
    }
}


// Validate user input before signup
// Username is valid if between 3 and 15 characters
// Email is valid if in format any@any.any (any can contain other '.' characters)
// Password is valid if between 8 and 30 characters. Password and password-confirm must match
// returns array with invalid fields (empty array if all fields are valid)
function validateSignupInfo(username, email, password, password2){
    let invalid_fields = [];

    if (username == "" || username.length < 3 || username.length > 15) {
        invalid_fields.push("username");
    }

    const email_re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;    // any@any.any (any can contain other '.' characters)
    if (email == "" || !email_re.test(email)) {
        invalid_fields.push("email");
    }

    if (password == "" || password.length < 8 || password.length > 30 || !(password === password2)) {
        invalid_fields.push("pswd");
    }
    return invalid_fields;
}
