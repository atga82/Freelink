FreeLink
Plataforma web que conecta clientes y vendedores para compartir publicaciones, mostrar trabajos, ofrecer servicios y comunicarse entre usuarios.

Tecnologías utilizadas
HTML
CSS
JS
PHP
MySQL
XAMPP

Estructura del proyecto
css/: hojas de estilo.
js/: funcionalidades JavaScript.
pages/: páginas del sistema.
php/: procesos del servidor, autenticación, sesiones y conexión con la base de datos.
index.html: página principal.

Funcionalidades implementadas
Registro e inicio de sesión.
Manejo de sesiones de usuario.
Perfiles y fotografías de perfil.
Creación y visualización de publicaciones.
Almacenamiento de imágenes y videos mediante BLOB en MySQL.
Feed general de publicaciones.
Filtros por categorías.
Estructura para productos, servicios y mensajes.

Requisitos
XAMPP.
Apache.
MySQL.
PHP.
MySQL Workbench 

Instalación
Instalar y abrir XAMPP.
Iniciar Apache y MySQL.
Colocar la carpeta Freelink dentro de C:\xampp\htdocs\.
Crear la base de datos freelink_db utilizando el script SQL del proyecto.
Configurar las credenciales de conexión a MySQL en php/conexion.php.

Abrir el navegador y visitar:
http://localhost/Freelink/

Base de datos
La base de datos freelink_db contiene las tablas necesarias para gestionar usuarios, categorías, publicaciones, productos, servicios, mensajes e intereses.
Las imágenes y videos de las publicaciones se almacenan directamente en MySQL mediante campos BLOB.

Rama de desarrollo
cambios-freelink

Proyecto
FreeLink - Plataforma de conexión entre clientes y vendedores.
