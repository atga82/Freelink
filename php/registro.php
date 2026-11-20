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

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    responder(false, 'Método no permitido.', 405);
}

// Recibimos datos del formulario
$nombre = trim($_POST['nombre'] ?? '');
$correo = trim($_POST['correo'] ?? '');
$password = $_POST['password'] ?? '';
$tipoUsuario = $_POST['tipo_usuario'] ?? '';

$intereses = $_POST['intereses'] ?? [];

// Validamos los campos 
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

// Validamos el tipo de usuario
$tiposPermitidos = [
    'vendedor_cliente',
    'cliente'
];

if (!in_array($tipoUsuario, $tiposPermitidos, true)) {
    responder(false, 'Selecciona un tipo de cuenta válido.', 400);
}

// Validamos los intereses
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

// Generamos hash seguro
$passwordHash = password_hash($password, PASSWORD_DEFAULT);

try {

    // Iniciamos transaccióon
    $conexion->begin_transaction();

    // Registramos usuario
    $sql = "INSERT INTO USUARIOS (
                nombre,
                correo,
                password_hash,
                tipo_usuario,
                biografia,
                fecha_registro,
                estado
            ) VALUES (?, ?, ?, ?, NULL, NOW(), 'activo')";

    $stmt = $conexion->prepare($sql);

    $stmt->bind_param(
        "ssss",
        $nombre,
        $correo,
        $passwordHash,
        $tipoUsuario
    );

    $stmt->execute();

    // Obtenemos el ID del usuario recien registrado
    $idUsuario = $conexion->insert_id;

    $stmt->close();

    // Preparamos insercion de intereses
    if (!empty($intereses)) {

        $sqlIntereses = "INSERT INTO USUARIO_INTERESES (
                            id_usuario,
                            interes
                         ) VALUES (?, ?)";

        $stmtIntereses = $conexion->prepare($sqlIntereses);

        foreach ($intereses as $interes) {

            $stmtIntereses->bind_param(
                "is",
                $idUsuario,
                $interes
            );

            $stmtIntereses->execute();
        }

        $stmtIntereses->close();
    }

    // Confirmamos registro y preferencias
    $conexion->commit();

    responder(
        true,
        'Tu cuenta y tus áreas de interés se registraron correctamente.'
    );

} catch (mysqli_sql_exception $e) {

    // Si ocurre un error, se deshace toda la operación
    $conexion->rollback();

    if ($e->getCode() === 1062) {
        responder(false, 'Este correo electrónico ya está registrado.', 409);
    }

    error_log('Error al registrar usuario: ' . $e->getMessage());

    responder(false, 'No fue posible registrar tu cuenta.', 500);

} catch (Throwable $e) {

    $conexion->rollback();

    error_log('Error inesperado en registro: ' . $e->getMessage());

    responder(false, 'Ocurrió un error al registrar tu cuenta.', 500);
}

