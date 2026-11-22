<?php
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/conexion.php';
require_once __DIR__ . '/sesion.php';

function responder($exito, $mensaje, $codigo = 200, $datos = []) {
    http_response_code($codigo);

    echo json_encode(array_merge([
        'success' => $exito,
        'message' => $mensaje
    ], $datos), JSON_UNESCAPED_UNICODE);

    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    responder(false, 'Método no permitido.', 405);
}

$correo = trim($_POST['correo'] ?? '');
$password = $_POST['password'] ?? '';

if ($correo === '' || $password === '') {
    responder(false, 'Ingresa tu correo y contraseña.', 400);
}

try {

    // Llamar al procedimiento almacenado de autenticación.
    $sql = "CALL sp_autenticar_usuario(?)";

    $stmt = $conexion->prepare($sql);
    $stmt->bind_param("s", $correo);
    $stmt->execute();

    // Obtener el usuario devuelto por el procedimiento.
    $resultado = $stmt->get_result();
    $usuario = $resultado->fetch_assoc();

    // Liberar el resultado principal.
    $resultado->free();

    // Consumir posibles resultados adicionales del CALL.
    while ($stmt->more_results()) {

        if (!$stmt->next_result()) {
            break;
        }

        $resultadoExtra = $stmt->get_result();

        if ($resultadoExtra) {
            $resultadoExtra->free();
        }
    }

    $stmt->close();

    // Verificar que el usuario exista y que su contraseña sea correcta.
    if (
        !$usuario ||
        !password_verify($password, $usuario['password_hash'])
    ) {
        responder(false, 'Correo o contraseña incorrectos.', 401);
    }

    // Verificar que la cuenta esté activa.
    if ($usuario['estado'] !== 'activo') {
        responder(false, 'Esta cuenta no se encuentra activa.', 403);
    }

    // Evitar reutilización del identificador de sesión.
    session_regenerate_id(true);

    $_SESSION['user_id'] = $usuario['id_usuario'];
    $_SESSION['nombre'] = $usuario['nombre'];
    $_SESSION['correo'] = $usuario['correo'];
    $_SESSION['tipo_usuario'] = $usuario['tipo_usuario'];

    responder(true, 'Inicio de sesión exitoso.', 200, [
        'redirect' => 'feed.html'
    ]);

} catch (mysqli_sql_exception $e) {

    error_log('Error al iniciar sesión: ' . $e->getMessage());

    responder(false, 'Ocurrió un error al iniciar sesión.', 500);
}

