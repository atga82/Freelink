USE freelink_db;

DELIMITER //
-- =====================================================
-- 1. AUTENTICAR USUARIO
-- =====================================================

DROP PROCEDURE IF EXISTS sp_autenticar_usuario//

CREATE PROCEDURE sp_autenticar_usuario(
    IN p_correo VARCHAR(150)
)
BEGIN
    SELECT
        id_usuario,
        nombre,
        correo,
        password_hash,
        tipo_usuario,
        estado
    FROM USUARIOS
    WHERE correo = p_correo
    LIMIT 1;
END//


-- =====================================================
-- 2. REGISTRAR USUARIO
-- =====================================================

DROP PROCEDURE IF EXISTS sp_registrar_usuario//

CREATE PROCEDURE sp_registrar_usuario(
    IN p_nombre VARCHAR(100),
    IN p_correo VARCHAR(150),
    IN p_password_hash VARCHAR(255),
    IN p_tipo_usuario VARCHAR(30),
    IN p_biografia TEXT
)
BEGIN
    -- Validar tipo de usuario.
    IF p_tipo_usuario NOT IN ('vendedor_cliente', 'cliente') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'TIPO_USUARIO_INVALIDO';
    END IF;

    -- Comprobar correo duplicado.
    IF EXISTS (
        SELECT 1
        FROM USUARIOS
        WHERE correo = p_correo
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'CORREO_YA_REGISTRADO';
    END IF;

    -- Registrar usuario.
    INSERT INTO USUARIOS (
        nombre,
        correo,
        password_hash,
        tipo_usuario,
        biografia,
        fecha_registro,
        estado
    )
    VALUES (
        p_nombre,
        p_correo,
        p_password_hash,
        p_tipo_usuario,
        p_biografia,
        NOW(),
        'activo'
    );

    -- Devolver el ID del usuario registrado.
    SELECT LAST_INSERT_ID() AS id_usuario;
END//


-- =====================================================
-- 3. GUARDAR INTERÉS DE USUARIO
-- =====================================================

DROP PROCEDURE IF EXISTS sp_guardar_interes_usuario//

CREATE PROCEDURE sp_guardar_interes_usuario(
    IN p_id_usuario INT,
    IN p_interes VARCHAR(30)
)
BEGIN
    INSERT INTO USUARIO_INTERESES (
        id_usuario,
        interes
    )
    VALUES (
        p_id_usuario,
        p_interes
    );
END//


-- =====================================================
-- 4. OBTENER INTERESES DE USUARIO
-- =====================================================

DROP PROCEDURE IF EXISTS sp_obtener_intereses_usuario//

CREATE PROCEDURE sp_obtener_intereses_usuario(
    IN p_id_usuario INT
)
BEGIN
    SELECT
        interes
    FROM USUARIO_INTERESES
    WHERE id_usuario = p_id_usuario
    ORDER BY interes ASC;
END//


-- =====================================================
-- 5. ACTUALIZAR PERFIL SIN CAMBIAR FOTOGRAFÍA
-- =====================================================

DROP PROCEDURE IF EXISTS sp_actualizar_perfil//

CREATE PROCEDURE sp_actualizar_perfil(
    IN p_id_usuario INT,
    IN p_nombre VARCHAR(100),
    IN p_biografia TEXT
)
BEGIN
    -- Comprobar que el usuario exista y esté activo.
    IF NOT EXISTS (
        SELECT 1
        FROM USUARIOS
        WHERE id_usuario = p_id_usuario
          AND estado = 'activo'
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'USUARIO_NO_ENCONTRADO';
    END IF;

    UPDATE USUARIOS
    SET
        nombre = p_nombre,
        biografia = p_biografia
    WHERE id_usuario = p_id_usuario
      AND estado = 'activo';
END//


-- =====================================================
-- 6. ACTUALIZAR PERFIL CON FOTOGRAFÍA
-- =====================================================

DROP PROCEDURE IF EXISTS sp_actualizar_perfil_con_foto//

CREATE PROCEDURE sp_actualizar_perfil_con_foto(
    IN p_id_usuario INT,
    IN p_nombre VARCHAR(100),
    IN p_biografia TEXT,
    IN p_foto MEDIUMBLOB
)
BEGIN
    -- Comprobar que el usuario exista y esté activo.
    IF NOT EXISTS (
        SELECT 1
        FROM USUARIOS
        WHERE id_usuario = p_id_usuario
          AND estado = 'activo'
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'USUARIO_NO_ENCONTRADO';
    END IF;

    UPDATE USUARIOS
    SET
        nombre = p_nombre,
        biografia = p_biografia,
        foto_perfil = p_foto
    WHERE id_usuario = p_id_usuario
      AND estado = 'activo';
END//


-- =====================================================
-- 7. CONSULTAR PERFIL COMPLETO
-- =====================================================

DROP PROCEDURE IF EXISTS sp_obtener_perfil_completo//

CREATE PROCEDURE sp_obtener_perfil_completo(
    IN p_id_usuario INT
)
BEGIN
    SELECT
        id_usuario,
        nombre,
        correo,
        tipo_usuario,
        biografia,
        foto_perfil,
        fecha_registro
    FROM USUARIOS
    WHERE id_usuario = p_id_usuario
      AND estado = 'activo'
    LIMIT 1;
END//


-- =====================================================
-- 8. OBTENER FOTOGRAFÍA DE PERFIL
-- =====================================================

DROP PROCEDURE IF EXISTS sp_obtener_foto_perfil//

CREATE PROCEDURE sp_obtener_foto_perfil(
    IN p_id_usuario INT
)
BEGIN
    SELECT
        foto_perfil
    FROM USUARIOS
    WHERE id_usuario = p_id_usuario
      AND estado = 'activo'
    LIMIT 1;
END//

DELIMITER ;




