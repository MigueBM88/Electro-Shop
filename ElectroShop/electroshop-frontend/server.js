const express = require('express');
const path = require("path");


const app = express();

const PORT = 5002;


//Publicar los archivos hacia el servidor frontend
app.use(express.static(
    path.join(__dirname, "public")
));


app.listen(PORT, () => {
    console.log(`Server Front is running on port http://localhost:${PORT}`);
});