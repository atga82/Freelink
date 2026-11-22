<?php
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/sesion.php';
require_once __DIR__ . '/conexion.php';

// Responder en formato JSON.
function responder($exito, $mensaje, $codigo = 200, $datos = []) {
    http_response_code($codigo);

    echo json_encode(array_merge([
        'success' => $exito,
        'message' => $mensaje
    ], $datos), JSON_UNESCAPED_UNICODE);

    exit;
}

// Liberar los resultados pendientes de un CALL.
function limpiarResultados($stmt) {

    while ($stmt->more_results()) {

        if (!$stmt->next_result()) {
            break;
        }

        $resultadoExtra = $stmt->get_result();

        if ($resultadoExtra) {
            $resultadoExtra->free();
        }
    }
}

// Verificar sesión.
if (!isset($_SESSION['user_id'])) {
    responder(false, 'Debes iniciar sesión.', 401);
}

// Verificar método.
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    responder(false, 'Método no permitido.', 405);
}

// Recibir datos.
$nombre = trim($_POST['nombre'] ?? '');
$biografia = trim($_POST['biografia'] ?? '');

// Validar campos.
if ($nombre === '') {
    responder(false, 'El nombre es obligatorio.', 400);
}

if (mb_strlen($nombre) > 100 || mb_strlen($biografia) > 2000) {
    responder(
        false,
        'Uno de los campos supera la longitud permitida.',
        400
    );
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

        // Comprobar el tipo MIME real.
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

        // Comprobar que sea una imagen válida.
        if (getimagesize($archivo['tmp_name']) === false) {
            throw new RuntimeException(
                'El archivo seleccionado no es una imagen válida.'
            );
        }

        // Leer el contenido binario.
        $contenidoFoto = file_get_contents($archivo['tmp_name']);

        if ($contenidoFoto === false) {
            throw new RuntimeException(
                'No fue posible leer la imagen.'
            );
        }

        // ==========================================
        // ACTUALIZAR PERFIL CON FOTOGRAFÍA
        // ==========================================

        $sql = "CALL sp_actualizar_perfil_con_foto(?, ?, ?, ?)";

        $stmt = $conexion->prepare($sql);

        // Variable temporal para enviar el BLOB.
        $fotoTemporal = '';

        $stmt->bind_param(
            "issb",
            $idUsuario,
            $nombre,
            $biografia,
            $fotoTemporal
        );

        // Enviar el contenido binario al cuarto parámetro.
        $stmt->send_long_data(3, $contenidoFoto);

    } else {

        // ==========================================
        // ACTUALIZAR PERFIL SIN CAMBIAR FOTOGRAFÍA
        // ==========================================

        $sql = "CALL sp_actualizar_perfil(?, ?, ?)";

        $stmt = $conexion->prepare($sql);

        $stmt->bind_param(
            "iss",
            $idUsuario,
            $nombre,
            $biografia
        );
    }

    // Ejecutar procedimiento.
    $stmt->execute();

    // Limpiar posibles resultados adicionales.
    limpiarResultados($stmt);

    $stmt->close();

    // Actualizar nombre en la sesión.
    $_SESSION['nombre'] = $nombre;

    responder(
        true,
        'Perfil actualizado correctamente.',
        200,
        [
            'usuario' => [
                'nombre' => $nombre,
                'biografia' => $biografia
            ]
        ]
    );

} catch (RuntimeException $error) {

    // Errores de validación de la fotografía.
    responder(false, $error->getMessage(), 400);

} catch (mysqli_sql_exception $error) {

    // Identificar si el procedimiento no encontró al usuario.
    if (strpos($error->getMessage(), 'USUARIO_NO_ENCONTRADO') !== false) {
        responder(false, 'No se encontró el usuario.', 404);
    }

    error_log(
        'Error al actualizar perfil: ' . $error->getMessage()
    );

    responder(
        false,
        'Ocurrió un error al actualizar el perfil.',
        500
    );

} catch (Throwable $error) {

    error_log(
        'Error inesperado al actualizar perfil: ' . $error->getMessage()
    );

    responder(
        false,
        'Ocurrió un error al actualizar el perfil.',
        500
    );
}


