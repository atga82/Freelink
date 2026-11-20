<?php
header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . "/sesion.php";
require_once __DIR__ . "/conexion.php";

// Comprobamos que el usuario inicio sesion.
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);

    echo json_encode([
        "error" => "Debes iniciar sesión para consultar tus publicaciones."
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

try {

    // Consultamos unicamente las publicaciones del usuario actual.
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
              AND p.id_usuario = ?
            ORDER BY p.fecha_publicacion DESC";

    $stmt = $conexion->prepare($sql);

    $idUsuario = (int) $_SESSION['user_id'];

    $stmt->bind_param("i", $idUsuario);
    $stmt->execute();

    $resultado = $stmt->get_result();

    $publicaciones = [];

    // Preparamos consulta de las imagenes de cada publicacion.
    $sqlImagenes = "SELECT
                        id_multimedia,
                        nombre_archivo,
                        mime_type,
                        tamano_bytes,
                        orden
                    FROM PUBLICACION_MULTIMEDIA
                    WHERE id_publicacion = ?
                    ORDER BY orden ASC";

    $stmtImagenes = $conexion->prepare($sqlImagenes);

    while ($fila = $resultado->fetch_assoc()) {

        $idPublicacion = (int) $fila["id_publicacion"];

        $fila["id_publicacion"] = $idPublicacion;
        $fila["id_usuario"] = (int) $fila["id_usuario"];

        $fila["tiene_multimedia"] =
            (bool) $fila["tiene_multimedia"];

        // Compatibilidad con archivos antiguos y videos.
        $fila["url_multimedia"] = $fila["tiene_multimedia"]
            ? "../php/obtener_multimedia.php?id=" . $idPublicacion
            : null;

        // Consultar las imágenes nuevas de esta publicación.
        $stmtImagenes->bind_param("i", $idPublicacion);
        $stmtImagenes->execute();

        $resultadoImagenes = $stmtImagenes->get_result();

        $imagenes = [];

        while ($imagen = $resultadoImagenes->fetch_assoc()) {

            $idMultimedia = (int) $imagen["id_multimedia"];

            $imagenes[] = [
                "id_multimedia" => $idMultimedia,
                "nombre_archivo" => $imagen["nombre_archivo"],
                "mime_type" => $imagen["mime_type"],
                "tamano_bytes" => (int) $imagen["tamano_bytes"],
                "orden" => (int) $imagen["orden"],
                "url" => "../php/obtener_multimedia.php?media_id="
                    . $idMultimedia
            ];
        }

        $fila["multimedia_imagenes"] = $imagenes;

        $publicaciones[] = $fila;
    }

    $stmtImagenes->close();
    $stmt->close();

    echo json_encode(
        $publicaciones,
        JSON_UNESCAPED_UNICODE |
        JSON_INVALID_UTF8_SUBSTITUTE
    );

} catch (Throwable $e) {

    error_log(
        "Error al consultar publicaciones del perfil: "
        . $e->getMessage()
    );

    http_response_code(500);

    echo json_encode([
        "error" => "No se pudieron consultar las publicaciones."
    ], JSON_UNESCAPED_UNICODE);
}

