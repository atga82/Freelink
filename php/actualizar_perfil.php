<?php
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/sesion.php';
require_once __DIR__ . '/conexion.php';

// Verificar sesión.
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);

    echo json_encode([
        'success' => false,
        'message' => 'Debes iniciar sesión.'
    ]);

    exit;
}

// Verificar método.
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);

    echo json_encode([
        'success' => false,
        'message' => 'Método no permitido.'
    ]);

    exit;
}

$nombre = trim($_POST['nombre'] ?? '');
$biografia = trim($_POST['biografia'] ?? '');

if ($nombre === '') {
    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => 'El nombre es obligatorio.'
    ]);

    exit;
}

if (mb_strlen($nombre) > 100 || mb_strlen($biografia) > 2000) {
    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => 'Uno de los campos supera la longitud permitida.'
    ]);

    exit;
}

try {

    $idUsuario = (int) $_SESSION['user_id'];

    // Comprobar si se recibió una fotografía.
    $tieneFoto = isset($_FILES['foto_perfil']) &&
                 $_FILES['foto_perfil']['error'] !== UPLOAD_ERR_NO_FILE;

    if ($tieneFoto) {

        $archivo = $_FILES['foto_perfil'];

        // Comprobar errores de carga.
        if ($archivo['error'] !== UPLOAD_ERR_OK) {
            throw new RuntimeException(
                'Ocurrió un error al recibir la imagen.'
            );
        }

        // Límite de 5 MB.
        $limite = 5 * 1024 * 1024;

        if ($archivo['size'] > $limite) {
            throw new RuntimeException(
                'La imagen no puede superar los 5 MB.'
            );
        }

        // Comprobar que realmente sea una imagen.
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($archivo['tmp_name']);

        $tiposPermitidos = [
            'image/jpeg',
            'image/png',
            'image/webp'
        ];

        if (!in_array($mime, $tiposPermitidos, true)) {
            throw new RuntimeException(
                'Solo se permiten imágenes JPG, PNG o WebP.'
            );
        }

        if (getimagesize($archivo['tmp_name']) === false) {
            throw new RuntimeException(
                'El archivo seleccionado no es una imagen válida.'
            );
        }

        // Leer el archivo para almacenarlo como BLOB.
        $contenidoFoto = file_get_contents($archivo['tmp_name']);

        if ($contenidoFoto === false) {
            throw new RuntimeException(
                'No fue posible leer la imagen.'
            );
        }

        // Actualizar nombre, biografía y fotografía.
        $sql = "UPDATE USUARIOS
                SET nombre = ?, biografia = ?, foto_perfil = ?
                WHERE id_usuario = ?
                  AND estado = 'activo'";

        $stmt = $conexion->prepare($sql);

        $fotoTemporal = '';

        $stmt->bind_param(
            "ssbi",
            $nombre,
            $biografia,
            $fotoTemporal,
            $idUsuario
        );

        // Enviar el contenido binario al parámetro BLOB.
        $stmt->send_long_data(2, $contenidoFoto);

    } else {

        // Si no se seleccionó foto, conservar la anterior.
        $sql = "UPDATE USUARIOS
                SET nombre = ?, biografia = ?
                WHERE id_usuario = ?
                  AND estado = 'activo'";

        $stmt = $conexion->prepare($sql);

        $stmt->bind_param(
            "ssi",
            $nombre,
            $biografia,
            $idUsuario
        );
    }

    $stmt->execute();
    $stmt->close();

    // Comprobar que el usuario exista.
    $consulta = $conexion->prepare(
        "SELECT id_usuario
         FROM USUARIOS
         WHERE id_usuario = ?
           AND estado = 'activo'
         LIMIT 1"
    );

    $consulta->bind_param("i", $idUsuario);
    $consulta->execute();

    $existe = $consulta->get_result()->num_rows > 0;

    $consulta->close();

    if (!$existe) {
        http_response_code(404);

        echo json_encode([
            'success' => false,
            'message' => 'No se encontró el usuario.'
        ]);

        exit;
    }

    // Actualizar nombre en la sesión.
    $_SESSION['nombre'] = $nombre;

    echo json_encode([
        'success' => true,
        'message' => 'Perfil actualizado correctamente.',
        'usuario' => [
            'nombre' => $nombre,
            'biografia' => $biografia
        ]
    ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $error) {

    error_log(
        'Error al actualizar perfil: ' . $error->getMessage()
    );

    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => $error->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}

