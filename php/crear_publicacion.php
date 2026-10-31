<?php
session_start();
require_once __DIR__ . "/conexion.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    header("Location: ../pages/crear_publicacion.html");
    exit;
}

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

$tipo = $_POST["tipo_contenido"] ?? "";
$contenido = trim($_POST["contenido"] ?? "");
$idCategoria = filter_input(
    INPUT_POST,
    "id_categoria",
    FILTER_VALIDATE_INT
);

if (!$idCategoria || $idCategoria <= 0) {
    regresarConError("Selecciona una categoría válida.");
} 

$tiposPermitidos = ["texto", "imagen", "video"];

if (!in_array($tipo, $tiposPermitidos, true)) {
    regresarConError("El tipo de publicación no es válido.");
}

if (mb_strlen($contenido) > 2000) {
    regresarConError("El texto no puede superar los 2000 caracteres.");
}

$archivoBinario = null;
$nombreArchivo = null;
$mimeType = null;
$tamanoBytes = null;

$hayArchivo =
    isset($_FILES["archivo"]) &&
    $_FILES["archivo"]["error"] !== UPLOAD_ERR_NO_FILE;

if ($tipo === "texto" && $contenido === "") {
    regresarConError("Escribe algo antes de publicar.");
}

if (($tipo === "imagen" || $tipo === "video") && !$hayArchivo) {
    regresarConError("Selecciona una imagen o un video.");
}

if ($tipo === "texto" && $hayArchivo) {
    regresarConError("Para publicar un archivo, selecciona Imagen o Video.");
}

if ($hayArchivo) {
    $archivo = $_FILES["archivo"];

    if ($archivo["error"] !== UPLOAD_ERR_OK) {
        regresarConError("Ocurrió un error al cargar el archivo. Código: " . $archivo["error"]);
    }

    // Límite de 50 MiB por archivo
    $limiteBytes = 50 * 1024 * 1024;

    if ($archivo["size"] <= 0 || $archivo["size"] > $limiteBytes) {
        regresarConError("El archivo debe pesar más de 0 bytes y no superar 50 MB.");
    }

    if (!is_uploaded_file($archivo["tmp_name"])) {
        regresarConError("El archivo recibido no es válido.");
    }

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mimeDetectado = $finfo->file($archivo["tmp_name"]);

    $mimeImagenes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp"
    ];

    $mimeVideos = [
        "video/mp4",
        "video/webm"
    ];

    if (
        $tipo === "imagen" &&
        !in_array($mimeDetectado, $mimeImagenes, true)
    ) {
        regresarConError("El archivo no es una imagen compatible (JPG, PNG, GIF o WebP).");
    }

    if (
        $tipo === "video" &&
        !in_array($mimeDetectado, $mimeVideos, true)
    ) {
        regresarConError("El archivo no es un video compatible (MP4 o WebM).");
    }

    $nombreArchivo = basename($archivo["name"]);
    $nombreArchivo = mb_substr($nombreArchivo, 0, 255);
    $mimeType = $mimeDetectado;
    $tamanoBytes = $archivo["size"];

    $archivoBinario = file_get_contents($archivo["tmp_name"]);

    if ($archivoBinario === false) {
        regresarConError("No se pudo leer el archivo cargado.");
    }
}

try {
    $conexion->begin_transaction();

    // usamos el primer usuario ya que aún no conectamos con le login
    $resultadoUsuario = $conexion->query(
        "SELECT id_usuario FROM USUARIOS ORDER BY id_usuario ASC LIMIT 1"
    );
    $usuarioFila = $resultadoUsuario->fetch_assoc();

    if (!$usuarioFila) {
        $conexion->rollback();
        regresarConError("Primero debes registrar al menos un usuario en FreeLink.");
    }

    $idUsuario = (int) $usuarioFila["id_usuario"];

   $stmtCategoria = $conexion->prepare(
    "SELECT id_categoria FROM CATEGORIAS WHERE id_categoria = ?"
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
// asosiamos los datos a la consulta 
$idCategoria = (int) $categoriaFila["id_categoria"];

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

    // multimedia es un dato binario.
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

    // Envia el BLOB mediante el protocolo de MySQL.
    if ($archivoBinario !== null) {
        $stmt->send_long_data(4, $archivoBinario);
    }

    $stmt->execute();
    $stmt->close();

    $conexion->commit();

    header("Location: ../pages/feed.html?publicacion=exitosa");
    exit;

} catch (Throwable $e) {
    try {
        $conexion->rollback();
    } catch (Throwable $ignorado) {
    }

    error_log("Error al guardar publicación: " . $e->getMessage());
    http_response_code(500);
    echo "No se pudo guardar la publicación. Revisa la configuración de PHP y MySQL y el registro de errores del servidor.";
    exit;
}
