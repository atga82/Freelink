<?php
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

ini_set('display_errors', '0');

require_once __DIR__ . '/sesion.php';

// Comprobamos que el usuario inicio sesión.
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    exit('Debes iniciar sesión para consultar este archivo.');
}

require_once __DIR__ . '/conexion.php';

$mimePermitidos = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/avif',
    'video/mp4',
    'video/webm',
    'video/ogg'
];

try {

    // recuperar una imagen de PUBLICACION_MULTIMEDIA.
    if (isset($_GET['media_id']) && ctype_digit($_GET['media_id'])) {

        $idMultimedia = (int) $_GET['media_id'];

        if ($idMultimedia <= 0) {
            http_response_code(400);
            exit('ID de multimedia no válido.');
        }

        $sql = "SELECT pm.multimedia, pm.mime_type
                FROM PUBLICACION_MULTIMEDIA pm
                INNER JOIN PUBLICACIONES p
                    ON p.id_publicacion = pm.id_publicacion
                WHERE pm.id_multimedia = ?
                  AND p.estado = 'activo'
                LIMIT 1";

        $stmt = $conexion->prepare($sql);
        $stmt->bind_param('i', $idMultimedia);

    // recupera archivos antiguos y videos.
    } elseif (isset($_GET['id']) && ctype_digit($_GET['id'])) {

        $idPublicacion = (int) $_GET['id'];

        if ($idPublicacion <= 0) {
            http_response_code(400);
            exit('ID de publicación no válido.');
        }

        $sql = "SELECT multimedia, mime_type
                FROM PUBLICACIONES
                WHERE id_publicacion = ?
                  AND estado = 'activo'
                LIMIT 1";

        $stmt = $conexion->prepare($sql);
        $stmt->bind_param('i', $idPublicacion);

    } else {
        http_response_code(400);
        exit('ID de multimedia o publicación no válido.');
    }

    $stmt->execute();
    $stmt->store_result();
    $stmt->bind_result($multimedia, $mimeType);

    if (!$stmt->fetch()) {
        $stmt->close();
        http_response_code(404);
        exit('No se encontró el archivo multimedia.');
    }

    if ($multimedia === null || strlen($multimedia) === 0) {
        $stmt->close();
        http_response_code(404);
        exit('El archivo multimedia está vacío.');
    }

    if (!in_array($mimeType, $mimePermitidos, true)) {
        $stmt->close();
        http_response_code(415);
        exit('El tipo de archivo no está permitido.');
    }

    $stmt->close();

    header('Content-Type: ' . $mimeType);
    header('Content-Length: ' . strlen($multimedia));
    header('X-Content-Type-Options: nosniff');
    header('Cache-Control: private, max-age=3600');

    echo $multimedia;
    exit;

} catch (Throwable $e) {

    error_log('Error al obtener multimedia: ' . $e->getMessage());

    http_response_code(500);
    exit('Error al recuperar el archivo multimedia.');
}



 