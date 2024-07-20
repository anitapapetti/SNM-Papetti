const menuElement = document.getElementById('menu');
menuElement.innerHTML = `<nav class="navbar navbar-expand-md navbar-dark">
            <div class="container-fluid">
                <a class="navbar-brand" href="/home">SNM</a>
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                    <span class="navbar-toggler-icon"></span>
                </button>
                <div class="collapse navbar-collapse" id="navbarNav">
                    <ul class="navbar-nav">
                        <li class="nav-item">
                            <a class="nav-link active" aria-current="page" href="/search">Search</a>
                        </li>
                        <li class="nav-item dropdown">
                            <a class="nav-link dropdown-toggle" href="#" id="dropdownPlaylist" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                                Playlists </a>
                            <ul class="dropdown-menu" aria-labelledby="dropdownPlaylist">
                                <li><a class="dropdown-item" href="/create-playlist"> Create new playlist </a></li>
                                <li><a class="dropdown-item" href="/library"> Your playlists </a></li>
                            </ul>
                        </li>
                        <li class="nav-item dropdown">
                            <a class="nav-link dropdown-toggle" href="#" id="navbarDropdownMenuLink" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                                Preferences </a>
                            <ul class="dropdown-menu" aria-labelledby="navbarDropdownMenuLink">
                                <li><a class="dropdown-item" href="/choose-genres">Edit favourite genres</a></li>
                                <li><a class="dropdown-item" href="/choose-artists">Edit favourite artists</a></li>
                            </ul>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link active" aria-current="page" href="/profile">Profile</a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link active" aria-current="page" href="/account">Account</a>
                        </li>
                        <li class="nav-item d-flex">
                            <a class="nav-link active" aria-current="page" href="#" onclick="logout()">Logout</a>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>`;

        
// Logout
async function logout(){
    sessionStorage.clear();
    await fetch('/logout', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    window.location.href = `http://localhost:4000/login`;
}