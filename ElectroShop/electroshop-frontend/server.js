const express = require('express');
const path = require("path");


const app = express();

const PORT = 5002;


// La carpeta public es la raiz del sitio: http://localhost:5002/ sirve public/index.html
app.use(express.static(path.join(__dirname, "public")));

// Recursos compartidos y paneles por rol
app.use("/css", express.static(path.join(__dirname, "css")));
app.use("/js", express.static(path.join(__dirname, "js")));
app.use("/admin", express.static(path.join(__dirname, "admin")));
app.use("/vendedor", express.static(path.join(__dirname, "vendedor")));

// Compatibilidad: si algo viejo apunta a /public/..., redirigir a la raiz
app.get("/public/*", (req, res) => {
    res.redirect(req.path.replace(/^\/public/, ""));
});


app.listen(PORT, () => {
    console.log(`Server Front is running on port http://localhost:${PORT}`);
});
