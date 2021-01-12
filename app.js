const express = require('express');
const app = express();
const cors = require('cors');
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: true, credentials: true, methods: 'GET' }));
app.options('*', cors());

app.use(require('./routes/index'));

app.listen(PORT, () => {
  console.log(`El servidor está inicializado en el puerto ${PORT}!`);
});