<?php
header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . "/sesion.php";
require_once __DIR__ . "/conexion.php";

// Comprobar que el usuario inicio sesion.
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode([
        "error" => "Debes iniciar sesion para consultar las publicaciones."
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $stmt = $conexion->prepare("CALL sp_listar_publicaciones_activas()");
    $stmt->execute();
    $resultado = $stmt->get_result();

    $publicaciones = [];

    while ($fila = $resultado->fetch_assoc()) {
        $fila["id_publicacion"] = (int) $fila["id_publicacion"];
        $fila["id_usuario"] = (int) $fila["id_usuario"];

        $fila["tiene_multimedia"] =
            (bool) $fila["tiene_multimedia"];

        $fila["url_multimedia"] = $fila["tiene_multimedia"]
            ? "../php/obtener_multimedia.php?id="
                . $fila["id_publicacion"]
            : null;

        $publicaciones[] = $fila;
    }
    $stmt->close();

    echo json_encode(
        $publicaciones,
        JSON_UNESCAPED_UNICODE |
        JSON_INVALID_UTF8_SUBSTITUTE
    );

} catch (Throwable $e) {
    error_log("Error al consultar publicaciones: " . $e->getMessage());

    http_response_code(500);

    echo json_encode([
        "error" => "No se pudieron consultar las publicaciones."
    ], JSON_UNESCAPED_UNICODE);
}

 