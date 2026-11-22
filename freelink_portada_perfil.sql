-- Migración aditiva para portada de perfil. No elimina datos existentes.
USE freelink_db;

ALTER TABLE USUARIOS
    ADD COLUMN foto_portada MEDIUMBLOB NULL COMMENT 'Imagen de portada del perfil en formato JPG, PNG o WebP (máximo 5 MB)';

DELIMITER $$
DROP PROCEDURE IF EXISTS sp_actualizar_portada_usuario$$
CREATE PROCEDURE sp_actualizar_portada_usuario(
    IN p_id_usuario INT,
    IN p_foto_portada MEDIUMBLOB
)
BEGIN
    UPDATE USUARIOS
       SET foto_portada = p_foto_portada
     WHERE id_usuario = p_id_usuario AND estado = 'activo';
    SELECT ROW_COUNT() AS filas_actualizadas;
END$$

DROP PROCEDURE IF EXISTS sp_obtener_portada_usuario$$
CREATE PROCEDURE sp_obtener_portada_usuario(IN p_id_usuario INT)
BEGIN
    SELECT foto_portada
      FROM USUARIOS
     WHERE id_usuario = p_id_usuario AND estado = 'activo'
     LIMIT 1;
END$$
DELIMITER ;
