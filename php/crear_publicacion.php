<?php
session_start();
require_once __DIR__ . "/conexion.php";

// Comprobamos que la solicitud sea POST.
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    header("Location: ../pages/crear_publicacion.html");
    exit;
}

// errores de validacion.
function regresarConError($mensaje) {
    http_response_code(400);

    echo '<!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Error al publicar | FreeLink</title>
    </head>
    <body>
        <h2>No se pudo crear la publicación</h2>
        <p>' . htmlspecialchars($mensaje, ENT_QUOTES, "UTF-8") . '</p>
        <a href="../pages/crear_publicacion.html">Volver al formulario</a>
    </body>
    </html>';

    exit;
}

// Verificamos la sesion.
if (!isset($_SESSION["user_id"]) || (int) $_SESSION["user_id"] <= 0) {
    regresarConError("Debes iniciar sesión para crear una publicación.");
}

$idUsuario = (int) $_SESSION["user_id"];

// Obtenemos los datos del formulario.
$tipo = $_POST["tipo_contenido"] ?? "";
$contenido = trim($_POST["contenido"] ?? "");

$idCategoria = filter_input(
    INPUT_POST,
    "id_categoria",
    FILTER_VALIDATE_INT
);

// Validamos la categoria.
if (!$idCategoria || $idCategoria <= 0) {
    regresarConError("Selecciona una categoría válida.");
}

// Validamos el tipo de publicacion.
$tiposPermitidos = ["texto", "imagen", "video"];

if (!in_array($tipo, $tiposPermitidos, true)) {
    regresarConError("El tipo de publicación no es válido.");
}

// Validamos la longitud del texto.
if (mb_strlen($contenido) > 2000) {
    regresarConError("El texto no puede superar los 2000 caracteres.");
}

// Inicializamos los archivos
$imagenes = [];
$archivoBinario = null;
$nombreArchivo = null;
$mimeType = null;
$tamanoBytes = null;

$limiteBytes = 50 * 1024 * 1024;

// Obtenemos archivos enviados desde el formulario
$archivosRecibidos = $_FILES["archivos"] ?? null;

$archivosSubidos = [];

if ($archivosRecibidos !== null) {

    if (
        !isset(
            $archivosRecibidos["name"],
            $archivosRecibidos["type"],
            $archivosRecibidos["tmp_name"],
            $archivosRecibidos["error"],
            $archivosRecibidos["size"]
        ) ||
        !is_array($archivosRecibidos["name"])
    ) {
        regresarConError("El formato de los archivos recibidos no es válido.");
    }

    foreach ($archivosRecibidos["name"] as $indice => $nombre) {

        $errorArchivo = $archivosRecibidos["error"][$indice];

        // Ignoramos el campo vacío cuando no se seleccionó ningún archivo.
        if ($errorArchivo === UPLOAD_ERR_NO_FILE) {
            continue;
        }

        $archivosSubidos[] = [
            "name" => $nombre,
            "type" => $archivosRecibidos["type"][$indice],
            "tmp_name" => $archivosRecibidos["tmp_name"][$indice],
            "error" => $errorArchivo,
            "size" => $archivosRecibidos["size"][$indice]
        ];
    }
}

// Validamos publicaciones de texto.
if ($tipo === "texto") {

    if ($contenido === "") {
        regresarConError("Escribe algo antes de publicar.");
    }

    if (count($archivosSubidos) > 0) {
        regresarConError("Las publicaciones de texto no deben contener archivos.");
    }
}

// Validamos publicaciones de imagen.
if ($tipo === "imagen") {

    $cantidadImagenes = count($archivosSubidos);

    if ($cantidadImagenes === 0) {
        regresarConError("Selecciona al menos una imagen.");
    }

    if ($cantidadImagenes > 3) {
        regresarConError("Solo puedes agregar hasta 3 imágenes por publicación.");
    }

    $mimeImagenes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp"
    ];

    $finfo = new finfo(FILEINFO_MIME_TYPE);

    foreach ($archivosSubidos as $archivo) {

        if ($archivo["error"] !== UPLOAD_ERR_OK) {
            regresarConError(
                "Ocurrió un error al cargar una imagen. Código: " .
                $archivo["error"]
            );
        }

        if (
            $archivo["size"] <= 0 ||
            $archivo["size"] > $limiteBytes
        ) {
            regresarConError(
                "Cada imagen debe pesar más de 0 bytes y no superar 50 MB."
            );
        }

        if (!is_uploaded_file($archivo["tmp_name"])) {
            regresarConError("Una de las imágenes recibidas no es válida.");
        }

        // Detectamos el formato real del archivo.
        $mimeDetectado = $finfo->file($archivo["tmp_name"]);

        if (!in_array($mimeDetectado, $mimeImagenes, true)) {
            regresarConError(
                "Solo se permiten imágenes JPG, PNG, GIF o WebP."
            );
        }

        // Leemos los datos binarios.
        $binario = file_get_contents($archivo["tmp_name"]);

        if ($binario === false) {
            regresarConError("No se pudo leer una de las imágenes.");
        }

        $imagenes[] = [
            "binario" => $binario,
            "nombre" => mb_substr(basename($archivo["name"]), 0, 255),
            "mime" => $mimeDetectado,
            "tamano" => (int) $archivo["size"]
        ];
    }
}

// Validamos publicaciones de video.
if ($tipo === "video") {

    if (count($archivosSubidos) !== 1) {
        regresarConError("Selecciona exactamente un video.");
    }

    $archivo = $archivosSubidos[0];

    if ($archivo["error"] !== UPLOAD_ERR_OK) {
        regresarConError(
            "Ocurrió un error al cargar el video. Código: " .
            $archivo["error"]
        );
    }

    if (
        $archivo["size"] <= 0 ||
        $archivo["size"] > $limiteBytes
    ) {
        regresarConError("El video debe pesar más de 0 bytes y no superar 50 MB.");
    }

    if (!is_uploaded_file($archivo["tmp_name"])) {
        regresarConError("El video recibido no es válido.");
    }

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mimeDetectado = $finfo->file($archivo["tmp_name"]);

    $mimeVideos = [
        "video/mp4",
        "video/webm"
    ];

    if (!in_array($mimeDetectado, $mimeVideos, true)) {
        regresarConError("El video debe estar en formato MP4 o WebM.");
    }

    $archivoBinario = file_get_contents($archivo["tmp_name"]);

    if ($archivoBinario === false) {
        regresarConError("No se pudo leer el video cargado.");
    }

    $nombreArchivo = mb_substr(
        basename($archivo["name"]),
        0,
        255
    );

    $mimeType = $mimeDetectado;
    $tamanoBytes = (int) $archivo["size"];
}

// Guardamos publicacion y archivos en una transaccion.
try {

    $conexion->begin_transaction();

    // Comprobar que la categoría exista.
    $stmtCategoria = $conexion->prepare(
        "SELECT id_categoria
         FROM CATEGORIAS
         WHERE id_categoria = ?"
    );

    $stmtCategoria->bind_param("i", $idCategoria);
    $stmtCategoria->execute();

    $resultadoCategoria = $stmtCategoria->get_result();
    $categoriaFila = $resultadoCategoria->fetch_assoc();

    $stmtCategoria->close();

    if (!$categoriaFila) {
        $conexion->rollback();
        regresarConError("La categoría seleccionada no existe.");
    }

    $idCategoria = (int) $categoriaFila["id_categoria"];

    // Insertamos la publicacion principal.
    $sql = "INSERT INTO PUBLICACIONES
        (
            id_usuario,
            id_categoria,
            tipo_contenido,
            contenido,
            multimedia,
            nombre_archivo,
            mime_type,
            tamano_bytes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

    $stmt = $conexion->prepare($sql);

    $stmt->bind_param(
        "iissbssi",
        $idUsuario,
        $idCategoria,
        $tipo,
        $contenido,
        $archivoBinario,
        $nombreArchivo,
        $mimeType,
        $tamanoBytes
    );

    // El video se en PUBLICACIONES.multimedia.
    if ($archivoBinario !== null) {
        $stmt->send_long_data(4, $archivoBinario);
    }

    $stmt->execute();

    // Obtenemos el ID de la publicacion recien creada
    $idPublicacion = $conexion->insert_id;

    $stmt->close();

    // Guardamos las imagenes en la tabla adicional
    if ($tipo === "imagen") {

        $sqlImagen = "INSERT INTO PUBLICACION_MULTIMEDIA
            (
                id_publicacion,
                multimedia,
                nombre_archivo,
                mime_type,
                tamano_bytes,
                orden
            )
            VALUES (?, ?, ?, ?, ?, ?)";

        $stmtImagen = $conexion->prepare($sqlImagen);

        foreach ($imagenes as $indice => $imagen) {

            $binarioImagen = $imagen["binario"];
            $nombreImagen = $imagen["nombre"];
            $mimeImagen = $imagen["mime"];
            $tamanoImagen = $imagen["tamano"];
            $ordenImagen = $indice + 1;

            $stmtImagen->bind_param(
                "ibssii",
                $idPublicacion,
                $binarioImagen,
                $nombreImagen,
                $mimeImagen,
                $tamanoImagen,
                $ordenImagen
            );

            // Enviamos el BLOB de la imagen a MySQL.
            $stmtImagen->send_long_data(1, $binarioImagen);

            $stmtImagen->execute();
        }

        $stmtImagen->close();
    }

    // Confirmamos los cambios.
    $conexion->commit();

    header("Location: ../pages/feed.html?publicacion=exitosa");
    exit;

} catch (Throwable $e) {

    try {
        $conexion->rollback();
    } catch (Throwable $ignorado) {
    }

    error_log(
        "Error al guardar publicación: " . $e->getMessage()
    );

    http_response_code(500);
    echo "No se pudo guardar la publicación. Revisa la configuración de PHP y MySQL y el registro de errores del servidor.";
    exit;
}
 
