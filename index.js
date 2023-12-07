const express=require('express');
const morgan = require('morgan');
const fs=require('fs');
const path=require('path');
const mysql =require('mysql2/promise');
const bearerToken = require('express-bearer-token'); 
const app=express();
const cors = require('cors');
var accessLogStream = fs.createWriteStream(path.join(__dirname,'access.log'),{flags:'a'});
const swaggerUI = require('swagger-ui-express');
const swaggerjsDoc= require('swagger-jsdoc');
app.use(morgan('combined',{stream:accessLogStream}));
app.use(cors());
app.use(express.json());
app.use(bearerToken());

const multer = require('multer');
const folder = path.join(__dirname+'/archivos/');
const storage = multer.diskStorage({
    destination : function(req,file,cb) {cb(null,folder)},
    filename: function (req,file,cb) {cb(null,file.originalname)}
});
const upload = multer({storage:storage})
app.use(express.urlencoded({extended:true}));
app.use(upload.single('archivo'));
const PORT = process.env.PORT || 8080
const PORTE = process.env.MYSQLPORT ;
const HOST = process.env.MYSQLHOST || 'localhost';
const USER = process.env.MYSQLUSER || 'root';
const PASSWORD = process.env.MYSQLPASSWORD || '5365';
const DATABASE = process.env.MYSQL_DATABASE || 'login';
const URL = process.env.URL

const MySqlConnection = {host : HOST, user : USER, password : PASSWORD, database: DATABASE,port : PORTE}
const data = fs.readFileSync(path.join(__dirname,'./Options.json'),{ encoding: 'utf8', flag: 'r' });
const obj = JSON.parse(data)

const swaggerOptions = {
    definition: obj,
    apis: [`${path.join(__dirname,"./index.js")}`],
}
/**
 * @swagger
 * /usuario:
 *   get:
 *     summary: Obtener información de todos los usuarios.
 *     description: Endpoint para obtener una lista de todos los usuarios almacenados.
 *     responses:
 *       200:
 *         description: OK. La solicitud fue exitosa.
 *         content:
 *           application/json:
 *             example:
 *               - Tipo: 1
 *                 Nombre: Hector Machado
 *                 Contraseña: HecMac123
 *               - Tipo: 2
 *                 Nombre: Wendy Reyes
 *                 Contraseña: WenRey456
 *       500:
 *         description: Error del servidor.
 *         content:
 *           application/json:
 *             example:
 *               mensaje: Error al obtener usuarios desde la base de datos.
 *     security:
 *       - BearerAuth: []
 */
app.get("/usuario", async (req, res) => {    
    try {
        const token = req.token;

            const conn = await mysql.createConnection(MySqlConnection);
            const [rows, fields] = await conn.query('SELECT * from usuario');
            res.json(rows);
        
    } catch (err) {
        res.status(500).json({ mensaje: err.sqlMessage });
    }
});
/**
 * @swagger
 * /usuario/{Tipo}:
 *   get:
 *     summary: Obtener información de usuarios por tipo.
 *     description: Endpoint para obtener una lista de usuarios filtrados por tipo.
 *     parameters:
 *       - in: path
 *         name: Tipo
 *         required: true
 *         description: Tipo de usuario a filtrar.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK. La solicitud fue exitosa.
 *         content:
 *           application/json:
 *             example:
 *               - Tipo: 1
 *                 Nombre: Hector Machado
 *                 Contraseña: HecMac123
 *               - Tipo: 2
 *                 Nombre: Wendy Reyes
 *                 Contraseña: WenRey456
 *       404:
 *         description: Usuario no encontrado.
 *         content:
 *           application/json:
 *             example:
 *               mensaje: Usuario no encontrado
 *       500:
 *         description: Error del servidor.
 *         content:
 *           application/json:
 *             example:
 *               mensaje: Error al obtener usuarios desde la base de datos.
 *     security:
 *       - BearerAuth: []
 */
app.get("/usuario/:Tipo",async(req,res)=>{    
    console.log(req.params.posicion);
        
    const conn = await mysql.createConnection(MySqlConnection);
    
    const [rows, fields] = await conn.query('SELECT * FROM usuario WHERE tipo = ?', [req.params.Tipo]);
    
    if (rows.length === 0) {
        res.status(404).json({ mensaje: "Usuario no encontrado" });
    } else {
        res.json(rows);
    }
});
/**
 * @swagger
 * /insertar:
 *   post:
 *     summary: Insertar un nuevo usuario.
 *     description: Endpoint para agregar un nuevo usuario a la base de datos.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 description: Nombre del nuevo usuario.
 *               contraseña:
 *                 type: string
 *                 description: Contraseña del nuevo usuario.
 *             required:
 *               - Nombre
 *               - Contraseña
 *     responses:
 *       200:
 *         description: OK. Los datos se insertaron correctamente.
 *         content:
 *           application/json:
 *             example:
 *               message: Datos insertados correctamente de Usuario1
 *       500:
 *         description: Error del servidor.
 *         content:
 *           application/json:
 *             example:
 *               message: Error al insertar datos
 *     security:
 *       - BearerAuth: []
 */
app.post('/insertar', async (req, res) => {
    try {
        const conn = await mysql.createConnection(MySqlConnection);

        const { nombre,contraseña} = req.body;

        const [rows, fields] = await conn.execute('INSERT INTO usuario (Nombre,Contraseña) VALUES (?, ?)', [nombre,contraseña]);

        res.json({ message: 'Datos insertados correctamente de '+nombre });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al insertar datos' });
    }
});
/**
 * @swagger
 * /usuario/{Tipo}:
 *   put:
 *     summary: Actualizar información de un usuario por tipo.
 *     description: Endpoint para actualizar la información de un usuario existente en la base de datos.
 *     parameters:
 *       - in: path
 *         name: Tipo
 *         required: true
 *         description: Tipo de usuario a actualizar.
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               Nombre:
 *                 type: string
 *                 description: Nuevo nombre del usuario.
 *               Contraseña:
 *                 type: string
 *                 description: Nueva contraseña del usuario.
 *             required:
 *               - Nombre
 *               - Contraseña
 *     responses:
 *       200:
 *         description: OK. La información del usuario se actualizó correctamente.
 *         content:
 *           application/json:
 *             example:
 *               mensaje: ACTUALIZADO Usuario1
 *       500:
 *         description: Error del servidor.
 *         content:
 *           application/json:
 *             example:
 *               mensaje: Error al actualizar la información del usuario.
 *     security:
 *       - BearerAuth: []
 */
app.put("/usuario/:Tipo", async (req, res) => {
    try {
        const conn = await mysql.createConnection(MySqlConnection);
        const { Nombre,Contraseña } = req.body;
        console.log(req.body);
        await conn.query('UPDATE usuario SET Nombre = ?, Contraseña = ? WHERE Tipo = ?', [Nombre,Contraseña,req.params.Tipo]);
        res.json({ mensaje: "ACTUALIZADO"+Nombre });
    } catch (err) {
        res.status(500).json({ mensaje: err.sqlMessage });
    }
});
/**
 * @swagger
 * /usuario/{Tipo}:
 *   delete:
 *     summary: Eliminar un usuario por tipo.
 *     description: Endpoint para eliminar un usuario de la base de datos por su tipo.
 *     parameters:
 *       - in: path
 *         name: Tipo
 *         required: true
 *         description: Tipo de usuario a eliminar.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK. El usuario fue eliminado correctamente.
 *         content:
 *           application/json:
 *             example:
 *               mensaje: Registro Eliminado TipoA
 *       404:
 *         description: Registro no encontrado.
 *         content:
 *           application/json:
 *             example:
 *               mensaje: Registro No Eliminado
 *       500:
 *         description: Error del servidor.
 *         content:
 *           application/json:
 *             example:
 *               mensaje: Error al eliminar el usuario.
 *     security:
 *       - BearerAuth: []
 */
app.delete("/usuario/:Tipo", async (req, res) => {    
    try {
        const conn = await mysql.createConnection(MySqlConnection);
        const tipos = req.params.Tipo;
        const [rows, fields] = await conn.query('DELETE FROM usuario WHERE Tipo = ?', [req.params.Tipo]);

        if (rows.affectedRows == 0) {
            res.json({ mensaje: "Registro No Eliminado" });
        } else {
            res.json({ mensaje: "Registro Eliminado"+tipos });
        }

    } catch (err) {
        res.status(500).json({ mensaje: err.sqlMessage });
    }
});

const swaggerDocs = swaggerjsDoc(swaggerOptions);

app.use("/api-docs",swaggerUI.serve,swaggerUI.setup(swaggerDocs));
app.get("/options",(req,res)=>
{
    res.json(data)
})

app.use("/api-docs-json",(req,res)=>{
    res.json(swaggerDocs);
});



app.listen(PORT,()=>{
    console.log("Servidor express escuchando en el puerto "+PORT);
});