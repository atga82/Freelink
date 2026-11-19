-- FreeLink: validación de comentarios y puntuaciones.
-- Estos triggers no borran ni alteran publicaciones existentes.
USE freelink_db;
DELIMITER $$
DROP TRIGGER IF EXISTS trg_validar_comentario_nuevo$$
CREATE TRIGGER trg_validar_comentario_nuevo
BEFORE INSERT ON COMENTARIOS
FOR EACH ROW
BEGIN
    IF NEW.contenido IS NULL OR CHAR_LENGTH(TRIM(NEW.contenido)) NOT BETWEEN 1 AND 300 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El comentario debe tener entre 1 y 300 caracteres.';
    END IF;
    IF NOT EXISTS (
       SELECT 1 FROM PUBLICACIONES AS p
        WHERE p.id_publicacion = NEW.id_publicacion AND p.estado = 'activo'
    ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Solo se pueden comentar publicaciones activas.';
    END IF;
    IF NOT EXISTS (
       SELECT 1 FROM USUARIOS AS u
        WHERE u.id_usuario = NEW.id_usuario AND u.estado = 'activo'
    ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Solo usuarios activos pueden comentar.';
    END IF;
    SET NEW.contenido = TRIM(NEW.contenido);
END$$

DROP TRIGGER IF EXISTS trg_validar_valoracion_nueva$$
CREATE TRIGGER trg_validar_valoracion_nueva
BEFORE INSERT ON VALORACIONES
FOR EACH ROW
BEGIN
    IF NEW.estrellas IS NULL OR NEW.estrellas NOT BETWEEN 1 AND 5 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La valoracion debe ser de 1 a 5 estrellas.';
    END IF;
    IF NOT EXISTS (
       SELECT 1 FROM PUBLICACIONES AS p
        WHERE p.id_publicacion = NEW.id_publicacion AND p.estado = 'activo'
    ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Solo se pueden valorar publicaciones activas.';
    END IF;
    IF NOT EXISTS (
       SELECT 1 FROM USUARIOS AS u
        WHERE u.id_usuario = NEW.id_usuario AND u.estado = 'activo'
    ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Solo usuarios activos pueden valorar.';
    END IF;
END$$
DELIMITER ;
