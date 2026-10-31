<?php
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

ini_set('display_errors', '0');
// comprueba que se recibio el id
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
//prepara la consulta a mysql
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
        http_response_code(404);
        exit('No se encontró la publicación.');
    }

    if ($multimedia === null || strlen($multimedia) === 0) {
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
        http_response_code(415);
        exit('El tipo de archivo no está permitido.');
    }

    $stmt->close();
    // envia las cabeceras http
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
 
 