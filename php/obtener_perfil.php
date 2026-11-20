<?php
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/sesion.php';
require_once __DIR__ . '/conexion.php';

// Comprobamos que exista una sesion iniciada.
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);

    echo json_encode([
        'success' => false,
        'message' => 'Debes iniciar sesión.'
    ]);

    exit;
}

try {
    $idUsuario = (int) $_SESSION['user_id'];

    // Consultamos al usuario de la sesion actual.
    $sql = "SELECT
                id_usuario,
                nombre,
                correo,
                tipo_usuario,
                biografia,
                foto_perfil,
                fecha_registro
            FROM USUARIOS
            WHERE id_usuario = ?
              AND estado = 'activo'
            LIMIT 1";

    $stmt = $conexion->prepare($sql);
    $stmt->bind_param("i", $idUsuario);
    $stmt->execute();

    $resultado = $stmt->get_result();
    $usuario = $resultado->fetch_assoc();

    if (!$usuario) {
        http_response_code(404);

        echo json_encode([
            'success' => false,
            'message' => 'No se encontró el usuario.'
        ]);

        $stmt->close();
        exit;
    }
    // Consultamos las areas de interes del usuario.
    $sqlIntereses = "SELECT interes
                     FROM USUARIO_INTERESES
                     WHERE id_usuario = ?
                     ORDER BY interes ASC";

    $stmtIntereses = $conexion->prepare($sqlIntereses);
    $stmtIntereses->bind_param("i", $idUsuario);
    $stmtIntereses->execute();

    $resultadoIntereses = $stmtIntereses->get_result();

    $intereses = [];

    while ($fila = $resultadoIntereses->fetch_assoc()) {
        $intereses[] = $fila['interes'];
    }

    $stmtIntereses->close();
    // Convertimos la foto BLOB a Base64 para enviarla en JSON.
    $foto = null;

    if (!empty($usuario['foto_perfil'])) {
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->buffer($usuario['foto_perfil']);

        $tiposPermitidos = [
            'image/jpeg',
            'image/png',
            'image/webp'
        ];

        if (in_array($mime, $tiposPermitidos, true)) {
            $foto = 'data:' . $mime . ';base64,' .
                    base64_encode($usuario['foto_perfil']);
        }
    }

    echo json_encode([
        'success' => true,
        'usuario' => [
            'id' => (int) $usuario['id_usuario'],
            'nombre' => $usuario['nombre'],
            'correo' => $usuario['correo'],
            'tipo_usuario' => $usuario['tipo_usuario'],
            'biografia' => $usuario['biografia'] ?? '',
            'foto_perfil' => $foto,
            'intereses' => $intereses,   
            'fecha_registro' => $usuario['fecha_registro']
        ]
    ], JSON_UNESCAPED_UNICODE);

    $stmt->close();

} catch (Throwable $error) {
    error_log('Error al obtener perfil: ' . $error->getMessage());

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Ocurrió un error al consultar el perfil.'
    ]);
}
 