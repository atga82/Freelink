<?php
require_once __DIR__ . '/sesion.php';
require_once __DIR__ . '/conexion.php';

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    exit;
}
try {
    // Solo mostrar la portada de la persona autenticada.
    $idUsuario = (int) $_SESSION['user_id'];
    $stmt = $conexion->prepare('CALL sp_obtener_portada_usuario(?)');
    $stmt->bind_param('i', $idUsuario);
    $stmt->execute();
    $resultado = $stmt->get_result();
    $usuario = $resultado ? $resultado->fetch_assoc() : null;
    $stmt->close();
    if (!$usuario || empty($usuario['foto_portada'])) {
        http_response_code(404);
        exit;
    }
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = $finfo->buffer($usuario['foto_portada']);
    if (!in_array($mime, ['image/jpeg', 'image/png', 'image/webp'], true)) {
        http_response_code(415);
        exit;
    }
    header('Content-Type: ' . $mime);
    header('X-Content-Type-Options: nosniff');
    header('Cache-Control: private, no-cache, must-revalidate');
    if ($_SERVER['REQUEST_METHOD'] !== 'HEAD') echo $usuario['foto_portada'];
} catch (Throwable $error) {
    error_log('Error al obtener portada: ' . $error->getMessage());
    http_response_code(500);
}
