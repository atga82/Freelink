<?php
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

$host = "localhost";
$usuario = "root";
$password = "cesar";
$base_datos = "freelink_db";

try {
    $conexion = new mysqli(
        $host,
        $usuario,
        $password,
        $base_datos
    );

    $conexion->set_charset("utf8mb4");
} catch (mysqli_sql_exception $e) {
    error_log("Error de conexión FreeLink: " . $e->getMessage());
    http_response_code(500);
    exit("No fue posible conectar con la base de datos.");
}
