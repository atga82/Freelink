<?php
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/sesion.php';

if (isset($_SESSION['user_id'])) {
    echo json_encode([
        'authenticated' => true,
        'user' => [
            'id' => $_SESSION['user_id'],
            'nombre' => $_SESSION['nombre'],
            'correo' => $_SESSION['correo'],
            'tipo_usuario' => $_SESSION['tipo_usuario']
        ]
    ], JSON_UNESCAPED_UNICODE);
} else {
    echo json_encode([
        'authenticated' => false
    ]);
}
