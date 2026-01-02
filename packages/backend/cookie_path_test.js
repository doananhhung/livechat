
const express = require('express');
const app = express();
const port = 3001;

app.get('/api/v1/test-cookie', (req, res) => {
  // Set cookie WITHOUT explicit path
  res.cookie('test_default', 'value', { httpOnly: true });
  res.send('Cookie set');
});

const server = app.listen(port, async () => {
  console.log(`Test server running on port ${port}`);
  
  try {
      // Use fetch to inspect the raw Set-Cookie header
      const response = await fetch(`http://localhost:${port}/api/v1/test-cookie`);
      const setCookie = response.headers.get('set-cookie');
      console.log('RAW SET-COOKIE HEADER:', setCookie);
  } catch(e) {
      console.error(e);
  } finally {
      server.close();
  }
});
