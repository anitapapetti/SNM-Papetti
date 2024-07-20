// Try to login and manage the outcome
async function login(){
    console.log("Trying to login...")
    document.getElementById("login_button").classList.add("btn-primary--loading");
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const invalid_field = validateLoginInfo(email, password);
    if(invalid_field !== null){
        document.getElementById("login_button").classList.remove("btn-primary--loading");
        show_invalid_login(invalid_field);
        return;
    }

    const user = {
        email: email,
        password: password
    }

    try{
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(user)
        });

        if (response.ok){
            //login successful
            response.json().then((userData) => {
                console.log(userData.message);
                // app auth token was sent back and saved in a cookie
                //spotify token was sent back and saved in a cookie
            })
            
            
        }else{
            // login failed
            response.json().then((error) => {
                console.log(error.message);
                document.getElementById("login_button").classList.remove("btn-primary--loading");
                show_invalid_login(error.invalid_field);
            })
            return;
        }

        // request user's starting page (automatically sends app auth token in cookies)
        window.location.href = BASE_URL + "/home";

    } catch(err){
        // Error while trying to login
        console.log(err);
        document.getElementById("login_button").classList.remove("btn-primary--loading");
    }
}


// Show user invalid field(s)
// if field_name is "email", show invalid email field and erase password
// if field_name is "pswd", leave email unchanged, erase password and show invalid password
// (if field_name is "all", show invalid email and password, and erase both)
// otherwise, leave email unchanged and erase password
function show_invalid_login(field_name){
    const email = document.getElementById('email');
    const password = document.getElementById('password');

    switch(field_name){
        case "email":
            email.classList.add('is-invalid');
            password.classList.remove('is-invalid');
            password.value = "";
            break;
        case "pswd":
            email.classList.remove('is-invalid');
            password.classList.add('is-invalid');
            password.value = "";
            break;
        case "all":
            email.classList.add('is-invalid');
            email.value = "";
            password.classList.add('is-invalid');
            password.value = "";
            break;
        default:
            email.classList.remove('is-invalid');
            password.classList.remove('is-invalid');
            password.value = "";
    }
    document.getElementById("login_button").classList.remove("btn-primary--loading");
    return;
}


// Validate user input before login
// Email is valid if in format any@any.any (any can contain other '.' characters)
// Password is valid if between 8 and 30 characters
// returns array with invalid fields (empty array if all fields are valid)
function validateLoginInfo(email, password){
    let invalid_field = null;

    const email_re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;    // any@any.any (any can contain other '.' characters)
    if (email == "" || !email_re.test(email)) {
        invalid_field = "email";
    }

    if ( password.length < 8 || password.length > 30 ) {
        if(invalid_field === "email"){
            invalid_field = "all";
        }else{
            invalid_field = "pswd";
        }
    }

    return invalid_field;
}