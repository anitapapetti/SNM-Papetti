# SNM (Social Network for Music)
Progetto che ho sviluppato per il corso "Tecnologie e Linguaggi per il Web" (corso a scelta nella laurea triennale in Informatica).

SNM è un'pplicazione web per la gestione di playlist musicali.

Nel frontend ho usato HTML, CSS e Javascript vanilla; nel Backend uso Javascript con Node.js e database MongoDB.

## Installazione
Requisiti: un account Spotify for developers, Node.js, un browser (es. Google Chrome), connessione internet

 - Modificare il file .env , di cui ho pubblicato un fac-simile:
    - inserire il CLIENT_ID e il CLIENT_SECRET corrispondenti al proprio account Spotify for developers. Si può accedere all’account o crearne uno dalla pagina https://developer.spotify.com/ 
    - inserire il JWT_SECRET, con cui verrà fatta la codifica del token di autorizzazione dell'applicazione (ad esempio, una stringa esadecimale di 32 caratteri).

- Installare i pacchetti necessari di Node.js:
    - Aprire un terminale, recarsi nella cartella del progetto ed eseguire il comando “npm install”

## Utilizzo
L’applicazione funziona in locale e può essere utilizzata in due passaggi:
- Aprire un terminale, recarsi nella cartella del progetto ed eseguire il comando “npm start”
- Aprire un browser e recarsi all’url http://localhost:4000/ (host e porta specificati nel file .env)

## Documentazione
Per ora non ho fatto uno swagger per le API di SNM.
Nella cartella [docs/](./docs/) si possono trovare i file forniti per la scrittura del progetto (i [requisiti](./docs/PWM_project_22_23.pdf) e una [breve guida per l'uso delle Spotify API](docs/Spotify_API.pdf)) e la [relazione di progetto](./docs/Relazione_SNM_Papetti.pdf) che ho scritto.

Nella relazione sono descritte, in forma discorsiva, le funzionalità implementate e le scelte implementative.

Nella cartella [Prove di funzionamento](./Prove%20di%20funzionamento/) ci sono delle schermate ottenute durante l'utilizzo dell'applicazione.

## Contribuire a questo progetto
Ho fatto questo progetto per un esame universitario e l'ho pubblicato su GitHub per mostrare le mie capacità attuali nello sviluppo di applicazioni web, quindi non accetto contributi esterni.

## Autore
Questo progetto è stato sviluppato nel giugno 2024 da [Anita Papetti](https://github.com/anitapapetti).

## Licenza
Questo progetto è pubblicato con licenza MIT.

Si può leggere la licenza nel file [LICENSE.txt](LICENSE.txt).