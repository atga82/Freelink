<?php
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/conexion.php';

function responder($exito, $mensaje, $codigo = 200) {
    http_response_code($codigo);

    echo json_encode([
        'success' => $exito,
        'message' => $mensaje
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

// Liberar todos los resultados pendientes de un CALL.
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

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    responder(false, 'Método no permitido.', 405);
}

// Recibir datos del formulario.
$nombre = trim($_POST['nombre'] ?? '');
$correo = trim($_POST['correo'] ?? '');
$password = $_POST['password'] ?? '';
$tipoUsuario = $_POST['tipo_usuario'] ?? '';

$intereses = $_POST['intereses'] ?? [];

// Validar campos obligatorios.
if ($nombre === '' || $correo === '' || $password === '') {
    responder(false, 'Completa todos los campos obligatorios.', 400);
}

if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
    responder(false, 'El correo electrónico no es válido.', 400);
}

if (strlen($password) < 8) {
    responder(false, 'La contraseña debe tener al menos 8 caracteres.', 400);
}

if (mb_strlen($nombre) > 100) {
    responder(false, 'El nombre es demasiado largo.', 400);
}

// Validar tipo de usuario.
$tiposPermitidos = [
    'vendedor_cliente',
    'cliente'
];

if (!in_array($tipoUsuario, $tiposPermitidos, true)) {
    responder(false, 'Selecciona un tipo de cuenta válido.', 400);
}

// Validar intereses.
$interesesPermitidos = [
    'diseno',
    'programacion',
    'fotografia',
    'video',
    'artesanias',
    'musica',
    'educacion',
    'creadores'
];

if (!is_array($intereses)) {
    responder(false, 'Los intereses enviados no son válidos.', 400);
}

$intereses = array_unique($intereses);

foreach ($intereses as $interes) {

    if (
        !is_string($interes) ||
        !in_array($interes, $interesesPermitidos, true)
    ) {
        responder(false, 'Se recibió un área de interés no válida.', 400);
    }
}

// Generar hash seguro.
$passwordHash = password_hash($password, PASSWORD_DEFAULT);

$transaccionIniciada = false;

try {

    // Iniciar transacción.
    $conexion->begin_transaction();
    $transaccionIniciada = true;

    // 1. REGISTRAR USUARIO

    $sql = "CALL sp_registrar_usuario(?, ?, ?, ?, ?)";

    $stmt = $conexion->prepare($sql);

    // El procedimiento recibe cinco parámetros.
    // La biografía se registra inicialmente como NULL.
    $biografia = null;

    $stmt->bind_param(
        "sssss",
        $nombre,
        $correo,
        $passwordHash,
        $tipoUsuario,
        $biografia
    );

    $stmt->execute();

    // Recuperar el ID devuelto por el procedimiento.
    $resultado = $stmt->get_result();

    $fila = $resultado->fetch_assoc();

    $resultado->free();

    // Limpiar posibles resultados adicionales del CALL.
    limpiarResultados($stmt);

    $stmt->close();

    if (!$fila || !isset($fila['id_usuario'])) {
        throw new RuntimeException(
            'No fue posible obtener el ID del usuario registrado.'
        );
    }

    $idUsuario = (int) $fila['id_usuario'];

    // 2. GUARDAR INTERESES DEL USUARIO

    if (!empty($intereses)) {

        $sqlIntereses = "CALL sp_guardar_interes_usuario(?, ?)";

        $stmtIntereses = $conexion->prepare($sqlIntereses);

        foreach ($intereses as $interes) {

            $stmtIntereses->bind_param(
                "is",
                $idUsuario,
                $interes
            );

            $stmtIntereses->execute();

            // Limpiar resultados de cada CALL.
            limpiarResultados($stmtIntereses);
        }

        $stmtIntereses->close();
    }

    // 3. CONFIRMAR TRANSACCIÓN

    $conexion->commit();
    $transaccionIniciada = false;

    responder(
        true,
        'Tu cuenta y tus áreas de interés se registraron correctamente.'
    );

} catch (mysqli_sql_exception $e) {

    // Deshacer el registro si ocurrió un error.
    if ($transaccionIniciada) {
        $conexion->rollback();
        $transaccionIniciada = false;
    }

    // Identificar el error controlado del procedimiento.
    if (strpos($e->getMessage(), 'CORREO_YA_REGISTRADO') !== false) {
        responder(
            false,
            'Este correo electrónico ya está registrado.',
            409
        );
    }

    error_log('Error al registrar usuario: ' . $e->getMessage());

    responder(false, 'No fue posible registrar tu cuenta.', 500);

} catch (Throwable $e) {

    if ($transaccionIniciada) {
        $conexion->rollback();
    }

    error_log('Error inesperado en registro: ' . $e->getMessage());

    responder(false, 'Ocurrió un error al registrar tu cuenta.', 500);
}


