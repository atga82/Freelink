-- FreeLink / Parte B: todas las operaciones de publicaciones por procedimientos almacenados.
-- Compatible con MySQL 8; ejecutar DESPUES de freelink_db.sql o su migracion.
-- No borra tablas ni registros. NO ejecutar freelink_db.sql en una base con datos.
USE freelink_db;

DELIMITER $$
DROP PROCEDURE IF EXISTS sp_crear_publicacion$$
CREATE PROCEDURE sp_crear_publicacion(
    IN p_id_usuario INT,
    IN p_id_categoria INT,
    IN p_tipo_contenido VARCHAR(10),
    IN p_contenido TEXT,
    IN p_multimedia LONGBLOB,
    IN p_nombre_archivo VARCHAR(255),
    IN p_mime_type VARCHAR(100),
    IN p_tamano_bytes BIGINT UNSIGNED
)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM USUARIOS u
        WHERE u.id_usuario = p_id_usuario AND u.estado = 'activo'
    ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Usuario inexistente o inactivo.';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM CATEGORIAS c WHERE c.id_categoria = p_id_categoria
    ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La categoria seleccionada no existe.';
    END IF;

    IF p_tipo_contenido IS NULL OR p_tipo_contenido NOT IN ('texto','imagen','video') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Tipo de publicacion no permitido.';
    END IF;

    IF CHAR_LENGTH(COALESCE(p_contenido, '')) > 2000 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El texto supera los 2000 caracteres.';
    END IF;

    IF p_tipo_contenido = 'texto' AND TRIM(COALESCE(p_contenido, '')) = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La publicacion de texto no puede estar vacia.';
    END IF;

    IF p_tipo_contenido IN ('imagen','video') AND
       (p_multimedia IS NULL OR OCTET_LENGTH(p_multimedia) = 0) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Debes adjuntar un archivo multimedia.';
    END IF;

    IF p_tipo_contenido = 'texto' AND p_multimedia IS NOT NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Una publicacion de texto no debe incluir archivo.';
    END IF;

    IF p_multimedia IS NOT NULL AND
       (OCTET_LENGTH(p_multimedia) > 52428800 OR
        p_tamano_bytes IS NULL OR
        p_tamano_bytes <> OCTET_LENGTH(p_multimedia)) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Tamano de archivo no permitido.';
    END IF;

    INSERT INTO PUBLICACIONES (
        id_usuario, id_categoria, tipo_contenido, contenido,
        multimedia, nombre_archivo, mime_type, tamano_bytes
    ) VALUES (
        p_id_usuario, p_id_categoria, p_tipo_contenido, p_contenido,
        p_multimedia, p_nombre_archivo, p_mime_type, p_tamano_bytes
    );
END$$

DROP PROCEDURE IF EXISTS sp_obtener_multimedia_publicacion$$
CREATE PROCEDURE sp_obtener_multimedia_publicacion(IN p_id_publicacion INT)
BEGIN
    SELECT multimedia, mime_type
    FROM PUBLICACIONES
    WHERE id_publicacion = p_id_publicacion AND estado = 'activo'
    LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_listar_publicaciones_activas$$
CREATE PROCEDURE sp_listar_publicaciones_activas()
BEGIN
    SELECT p.id_publicacion, p.id_usuario, u.nombre,
           p.tipo_contenido, p.contenido, p.nombre_archivo,
           p.mime_type, p.fecha_publicacion,
           CASE WHEN p.multimedia IS NOT NULL AND OCTET_LENGTH(p.multimedia) > 0
                THEN 1 ELSE 0 END AS tiene_multimedia
    FROM PUBLICACIONES p
    INNER JOIN USUARIOS u ON u.id_usuario = p.id_usuario
    WHERE p.estado = 'activo'
    ORDER BY p.fecha_publicacion DESC, p.id_publicacion DESC;
END$$

DROP PROCEDURE IF EXISTS sp_listar_publicaciones_usuario$$
CREATE PROCEDURE sp_listar_publicaciones_usuario(IN p_id_usuario INT)
BEGIN
    SELECT p.id_publicacion, p.id_usuario, u.nombre,
           p.tipo_contenido, p.contenido, p.nombre_archivo,
           p.mime_type, p.fecha_publicacion,
           CASE WHEN p.multimedia IS NOT NULL AND OCTET_LENGTH(p.multimedia) > 0
                THEN 1 ELSE 0 END AS tiene_multimedia
    FROM PUBLICACIONES p
    INNER JOIN USUARIOS u ON u.id_usuario = p.id_usuario
    WHERE p.estado = 'activo' AND p.id_usuario = p_id_usuario
    ORDER BY p.fecha_publicacion DESC, p.id_publicacion DESC;
END$$
DELIMITER ;
