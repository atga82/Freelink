<?php
require_once __DIR__ . '/sesion.php';
require_once __DIR__ . '/conexion.php';

// Verificar sesión.
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    exit;
}

// Obtener el ID del usuario cuya fotografía queremos mostrar.
$idUsuario = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);

if (!$idUsuario || $idUsuario <= 0) {
    http_response_code(400);
    exit;
}

try {

    $sql = "SELECT foto_perfil
            FROM USUARIOS
            WHERE id_usuario = ?
              AND estado = 'activo'
            LIMIT 1";

    $stmt = $conexion->prepare($sql);
    $stmt->bind_param("i", $idUsuario);
    $stmt->execute();

    $resultado = $stmt->get_result();
    $usuario = $resultado->fetch_assoc();

    $stmt->close();

    if (!$usuario || empty($usuario['foto_perfil'])) {
        http_response_code(404);
        exit;
    }

    // Identificar el tipo MIME real de la imagen.
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = $finfo->buffer($usuario['foto_perfil']);

    $tiposPermitidos = [
        'image/jpeg',
        'image/png',
        'image/webp'
    ];

    if (!in_array($mime, $tiposPermitidos, true)) {
        http_response_code(415);
        exit;
    }

    // Devolver la imagen directamente al navegador.
    header('Content-Type: ' . $mime);
    header('X-Content-Type-Options: nosniff');
    header('Cache-Control: private, max-age=3600');

    echo $usuario['foto_perfil'];

} catch (Throwable $error) {

    error_log(
        'Error al obtener foto de perfil: ' . $error->getMessage()
    );

    http_response_code(500);
}