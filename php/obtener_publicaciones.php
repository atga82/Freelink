<?php
require_once __DIR__ . "/conexion.php";

header("Content-Type: application/json; charset=utf-8");
//consultamos las publicaciones y el inner join relaicona usuario y publicacion
try {
    $sql = "SELECT
                p.id_publicacion,
                p.id_usuario,
                u.nombre,
                p.tipo_contenido,
                p.contenido,
                p.nombre_archivo,
                p.mime_type,
                p.fecha_publicacion,
                CASE
                    WHEN p.multimedia IS NOT NULL
                         AND OCTET_LENGTH(p.multimedia) > 0
                    THEN 1
                    ELSE 0
                END AS tiene_multimedia
            FROM PUBLICACIONES p
            INNER JOIN USUARIOS u
                ON u.id_usuario = p.id_usuario
            WHERE p.estado = 'activo'
            ORDER BY p.fecha_publicacion DESC";

    $resultado = $conexion->query($sql);
    //guarda las publicaciones en el arreglo 
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
    //convertimso todoe n tipo jason

    echo json_encode(
        $publicaciones,
        JSON_UNESCAPED_UNICODE |
        JSON_INVALID_UTF8_SUBSTITUTE
    );

} catch (Throwable $e) {
    error_log("Error al consultar publicaciones: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["error" => "No se pudieron consultar las publicaciones."]);
} 
 