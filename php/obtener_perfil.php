<?php
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/sesion.php';
require_once __DIR__ . '/conexion.php';

// Liberar resultados pendientes de un CALL.
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

// Comprobar que exista una sesión iniciada.
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

    // 1. CONSULTAR PERFIL COMPLETO

    $sql = "CALL sp_obtener_perfil_completo(?)";

    $stmt = $conexion->prepare($sql);
    $stmt->bind_param("i", $idUsuario);
    $stmt->execute();

    $resultado = $stmt->get_result();
    $usuario = $resultado->fetch_assoc();

    $resultado->free();

    limpiarResultados($stmt);

    $stmt->close();

    // Comprobar que se haya encontrado el usuario.
    if (!$usuario) {
        http_response_code(404);

        echo json_encode([
            'success' => false,
            'message' => 'No se encontró el usuario.'
        ]);

        exit;
    }

    // 2. CONSULTAR INTERESES DEL USUARIO

    $sqlIntereses = "CALL sp_obtener_intereses_usuario(?)";

    $stmtIntereses = $conexion->prepare($sqlIntereses);
    $stmtIntereses->bind_param("i", $idUsuario);
    $stmtIntereses->execute();

    $resultadoIntereses = $stmtIntereses->get_result();

    $intereses = [];

    while ($fila = $resultadoIntereses->fetch_assoc()) {
        $intereses[] = $fila['interes'];
    }

    $resultadoIntereses->free();

    limpiarResultados($stmtIntereses);

    $stmtIntereses->close();


    // 3. CONVERTIR FOTOGRAFÍA BLOB A BASE64

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

    // 4. DEVOLVER INFORMACIÓN EN JSON

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

} catch (Throwable $error) {

    error_log('Error al obtener perfil: ' . $error->getMessage());

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Ocurrió un error al consultar el perfil.'
    ], JSON_UNESCAPED_UNICODE);
}

 