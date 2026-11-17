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
    $sql = "SELECT
                id_usuario,
                nombre,
                correo,
                password_hash,
                tipo_usuario,
                estado
            FROM USUARIOS
            WHERE correo = ?
            LIMIT 1";

    $stmt = $conexion->prepare($sql);
    $stmt->bind_param("s", $correo);
    $stmt->execute();

    $resultado = $stmt->get_result();
    $usuario = $resultado->fetch_assoc();

    $stmt->close();

    if (
        !$usuario ||
        !password_verify($password, $usuario['password_hash'])
    ) {
        responder(false, 'Correo o contraseña incorrectos.', 401);
    }

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
