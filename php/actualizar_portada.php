<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/sesion.php';
require_once __DIR__ . '/conexion.php';

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Debes iniciar sesión.']);
    exit;
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido.']);
    exit;
}
$archivo = $_FILES['foto_portada'] ?? null;
if (!$archivo || $archivo['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'No se recibió una imagen válida.']);
    exit;
}
if ($archivo['size'] <= 0 || $archivo['size'] > 5 * 1024 * 1024) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'La portada debe pesar máximo 5 MB.']);
    exit;
}
$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime = $finfo->file($archivo['tmp_name']);
if (!in_array($mime, ['image/jpeg', 'image/png', 'image/webp'], true)
    || getimagesize($archivo['tmp_name']) === false) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Solo se permiten imágenes JPG, PNG o WebP.']);
    exit;
}

try {
    $binario = file_get_contents($archivo['tmp_name']);
    if ($binario === false) throw new RuntimeException('No se pudo leer la imagen.');
    $idUsuario = (int) $_SESSION['user_id'];
    $stmt = $conexion->prepare('CALL sp_actualizar_portada_usuario(?, ?)');
    $datoBinario = null;
    $stmt->bind_param('ib', $idUsuario, $datoBinario);
    $stmt->send_long_data(1, $binario);
    $stmt->execute();
    $resultado = $stmt->get_result();
    $fila = $resultado ? $resultado->fetch_assoc() : null;
    $stmt->close();
    if (!$fila || (int) $fila['filas_actualizadas'] < 1) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'No se encontró el perfil activo.']);
        exit;
    }
    echo json_encode(['success' => true, 'message' => 'Portada actualizada.']);
} catch (Throwable $error) {
    error_log('Error al actualizar portada: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'No fue posible guardar la portada.']);
}
