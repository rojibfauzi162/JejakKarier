import fetch from 'node-fetch';

fetch('http://localhost:3000/api/dk/methods', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ amount: 10000 })
})
.then(res => res.text())
.then(text => console.log(text))
.catch(console.error);
