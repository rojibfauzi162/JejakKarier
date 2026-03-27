import fetch from 'node-fetch';

const projectId = "jejakkarir-11379";
const apiKey = "AIzaSyCDvX0tJX24etCFWS9D-IG9B3_BV6xFGEk";
const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/system_metadata?key=${apiKey}`;

fetch(url, {
  headers: {
    "Referer": `https://${projectId}.firebaseapp.com/`
  }
})
.then(res => res.json())
.then(data => console.log(JSON.stringify(data, null, 2)))
.catch(console.error);
