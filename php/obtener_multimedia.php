<?php
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

ini_set('display_errors', '0');

require_once __DIR__ . '/sesion.php';

// Comprobar que el usuario inició sesión.
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    exit('Debes iniciar sesión para consultar este archivo.');
}

// Comprobar que se recibió el ID.
if (!isset($_GET['id']) || !ctype_digit($_GET['id'])) {
    http_response_code(400);
    exit('ID de publicación no válido.');
}

$id = (int) $_GET['id'];

if ($id <= 0) {
    http_response_code(400);
    exit('ID de publicación no válido.');
}

require_once __DIR__ . '/conexion.php';

try {
    $sql = "SELECT multimedia, mime_type
            FROM PUBLICACIONES
            WHERE id_publicacion = ?
              AND estado = 'activo'
            LIMIT 1";

    $stmt = $conexion->prepare($sql);
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $stmt->store_result();
    $stmt->bind_result($multimedia, $mimeType);

    if (!$stmt->fetch()) {
        $stmt->close();
        http_response_code(404);
        exit('No se encontró la publicación.');
    }

    if ($multimedia === null || strlen($multimedia) === 0) {
        $stmt->close();
        http_response_code(404);
        exit('La publicación no contiene multimedia.');
    }

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


 