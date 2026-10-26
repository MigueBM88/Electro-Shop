const express = require('express');
const path = require("path");


const app = express();

const PORT = 5002;


//Publicar toda la carpeta frontend hacia el servidor (incluye Public, css, js)
app.use(express.static(__dirname));


//Redirigir la raiz al index dentro de public
app.get("/", (req, res) => {
    res.redirect("/public/index.html");
});


app.listen(PORT, () => {
    console.log(`Server Front is running on port http://localhost:${PORT}`);
});