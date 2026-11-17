document.addEventListener('DOMContentLoaded', () => {
    // Formulario
    const formulario = document.getElementById('registerForm');

    const nombre = document.getElementById('nombre');
    const correo = document.getElementById('correo');
    const password = document.getElementById('passwordRegistro');
    const confirmarPassword = document.getElementById('confirmPassword');

    const paso1 = document.getElementById('registerStep1');
    const paso2 = document.getElementById('registerStep2');
    const paso3 = document.getElementById('registerStep3');

    const indicador1 = document.getElementById('stepIndicator1');
    const indicador2 = document.getElementById('stepIndicator2');
    const indicador3 = document.getElementById('stepIndicator3');

    const mensajeRegistro = document.getElementById('registerMessage');

    const botonCrear = document.getElementById('registerBtn');
    const textoBoton = document.getElementById('registerBtnText');
    const spinner = document.getElementById('registerSpinner');

    if (!formulario) return;

    // Mostrar y ocultar contraseña

    const togglePassword = document.getElementById('toggleRegisterPassword');

    if (togglePassword) {
        togglePassword.addEventListener('click', () => {

            const mostrar = password.type === 'password';

            password.type = mostrar ? 'text' : 'password';

            togglePassword.innerHTML = mostrar
                ? '<i class="bi bi-eye-slash"></i>'
                : '<i class="bi bi-eye"></i>';

            togglePassword.setAttribute(
                'aria-label',
                mostrar ? 'Ocultar contraseña' : 'Mostrar contraseña'
            );
        });
    }

    // Mensaje de validacion

    function mostrarError(input, mensaje) {
        input.classList.add('is-invalid');
        input.classList.remove('is-valid');

        const contenedor = input.closest('.mb-4');
        const feedback = contenedor?.querySelector('.invalid-feedback');

        if (feedback) {
            feedback.textContent = mensaje;
        }
    }

    function limpiarError(input) {
        input.classList.remove('is-invalid');
        input.classList.remove('is-valid');
    }

    function validarCampo(input, condicion, mensaje) {

        if (!condicion) {
            mostrarError(input, mensaje);
            return false;
        }

        limpiarError(input);
        input.classList.add('is-valid');

        return true;
    }

    // Validar primer paso

    function validarPaso1() {

        let valido = true;

        const nombreValido = validarCampo(
            nombre,
            nombre.value.trim().length >= 2,
            'Escribe tu nombre completo.'
        );

        const correoRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        const correoValido = validarCampo(
            correo,
            correoRegex.test(correo.value.trim()),
            'Ingresa un correo electrónico válido.'
        );

        const passwordValida = validarCampo(
            password,
            password.value.length >= 8,
            'La contraseña debe tener al menos 8 caracteres.'
        );

        const confirmacionValida = validarCampo(
            confirmarPassword,
            confirmarPassword.value !== '' &&
            confirmarPassword.value === password.value,
            'Las contraseñas deben coincidir.'
        );

        valido = nombreValido &&
                 correoValido &&
                 passwordValida &&
                 confirmacionValida;

        if (!valido) {
            formulario.querySelector('.is-invalid')?.focus();
        }

        return valido;
    }

    // Validar segundo paso

    function validarPaso2() {

        const tipoCuenta = formulario.querySelector(
            'input[name="tipo_usuario"]:checked'
        );

        if (!tipoCuenta) {
            mostrarMensaje(
                'Selecciona el tipo de cuenta que deseas crear.',
                'warning'
            );

            return false;
        }

        return true;
    }

    // Cambiar entre pasos

    function mostrarPaso(numero) {

        paso1.classList.toggle('active', numero === 1);
        paso2.classList.toggle('active', numero === 2);
        paso3.classList.toggle('active', numero === 3);

        indicador1.classList.toggle('active', numero === 1);
        indicador2.classList.toggle('active', numero === 2);
        indicador3.classList.toggle('active', numero === 3);

        if (numero !== 3) {
            mensajeRegistro.classList.add('d-none');
        }

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    // Actualizar resumen

    function actualizarResumen() {

        document.getElementById('summaryName').textContent =
            nombre.value.trim();

        document.getElementById('summaryEmail').textContent =
            correo.value.trim();

        const intereses = formulario.querySelectorAll(
            'input[name="intereses[]"]:checked'
        );

        const listaIntereses = Array.from(intereses).map(
            interes => {
                const etiqueta = interes.closest('.interest-option');
                return etiqueta?.querySelector('strong')?.textContent
                    || interes.value;
            }
        );

        document.getElementById('summaryInterests').textContent =
            listaIntereses.length > 0
                ? listaIntereses.join(', ')
                : 'Sin intereses seleccionados';
    }

    // Mostrar mensajes

    function mostrarMensaje(texto, tipo = 'danger') {

        mensajeRegistro.className = `alert alert-${tipo} mt-4`;
        mensajeRegistro.textContent = texto;
    }

    // Botones de navegacion

    document.getElementById('nextStep1').addEventListener('click', () => {

        if (validarPaso1()) {
            mostrarPaso(2);
        }

    });

    document.getElementById('backStep2').addEventListener('click', () => {
        mostrarPaso(1);
    });

    document.getElementById('nextStep2').addEventListener('click', () => {

        if (validarPaso2()) {
            actualizarResumen();
            mostrarPaso(3);
        }

    });

    // Validar mdoficar campos

    [nombre, correo, password, confirmarPassword].forEach(input => {

        input.addEventListener('input', () => {

            if (input.classList.contains('is-invalid')) {

                if (input === nombre) {
                    validarCampo(nombre, nombre.value.trim().length >= 2,
                        'Escribe tu nombre completo.');
                }

                if (input === correo) {
                    validarCampo(correo,
                        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.value.trim()),
                        'Ingresa un correo electrónico válido.');
                }

                if (input === password) {
                    validarCampo(password, password.value.length >= 8,
                        'La contraseña debe tener al menos 8 caracteres.');
                }

                if (input === confirmarPassword) {
                    validarCampo(confirmarPassword,
                        confirmarPassword.value !== '' &&
                        confirmarPassword.value === password.value,
                        'Las contraseñas deben coincidir.');
                }
            }

            if (input === password &&
                confirmarPassword.value !== '') {

                validarCampo(
                    confirmarPassword,
                    confirmarPassword.value === password.value,
                    'Las contraseñas deben coincidir.'
                );
            }

        });

    });

    // Enviar codigo a php

    formulario.addEventListener('submit', async (event) => {

        event.preventDefault();

        mensajeRegistro.classList.add('d-none');

        if (!validarPaso1()) {
            mostrarPaso(1);
            return;
        }

        if (!validarPaso2()) {
            mostrarPaso(2);
            return;
        }

        botonCrear.disabled = true;
        textoBoton.textContent = 'Creando cuenta...';
        spinner.classList.remove('d-none');

        try {

            const datos = new FormData(formulario);

            const respuesta = await fetch('../php/registro.php', {
                method: 'POST',
                body: datos
            });

            const resultado = await respuesta.json();

            if (!respuesta.ok || !resultado.success) {

                mostrarMensaje(
                    resultado.message || 'No fue posible crear tu cuenta.'
                );

                return;
            }

            mostrarMensaje(
                resultado.message || '¡Tu cuenta se creó correctamente!',
                'success'
            );

            textoBoton.textContent = 'Cuenta creada';

        } catch (error) {

            console.error('Error en el registro:', error);

            mostrarMensaje(
                'No fue posible comunicarse con el servidor. Inténtalo nuevamente.'
            );

        } finally {

            spinner.classList.add('d-none');

            if (!mensajeRegistro.classList.contains('alert-success')) {
                botonCrear.disabled = false;
                textoBoton.textContent = 'Crear mi cuenta';
            }

        }

    });

});
