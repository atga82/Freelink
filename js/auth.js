document.addEventListener('DOMContentLoaded', () => {

    // Elementos del formulario
    const loginForm = document.getElementById('loginForm');
    const correo = document.getElementById('correo');
    const password = document.getElementById('password');
    const togglePassword = document.getElementById('togglePassword');
    const loginMessage = document.getElementById('loginMessage');
    const forgotPassword = document.getElementById('forgotPassword');

    const loginBtn = document.getElementById('loginBtn');
    const loginBtnText = document.getElementById('loginBtnText');
    const loginSpinner = document.getElementById('loginSpinner');

    // Comprobamos que estamos en la página de inicio de sesión.
    if (!loginForm || !correo || !password) return;

    // Mensajes de error de los campos.
    const correoError = correo
        .closest('.mb-4')
        .querySelector('.invalid-feedback');

    const passwordError = password
        .closest('.mb-3')
        .querySelector('.invalid-feedback');

    // Mostramos error en un campo.
    function mostrarError(input, mensaje, texto) {

        input.classList.add('is-invalid');
        input.classList.remove('is-valid');

        mensaje.textContent = texto;
        mensaje.style.display = 'block';
    }

    // Limpiar error de un campo.
    function limpiarError(input, mensaje) {

        input.classList.remove('is-invalid');
        input.classList.remove('is-valid');

        mensaje.style.display = 'none';
        mensaje.textContent = '';
    }

    // Mostramos el mensaje general.
    function mostrarMensaje(texto, tipo = 'danger') {

        loginMessage.className = `alert alert-${tipo}`;
        loginMessage.textContent = texto;
    }

    // Validamos correo electrónico.
    function validarCorreo() {

        const valor = correo.value.trim();

        const correoRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; 

        if (!valor || !correoRegex.test(valor)) {

            mostrarError(
                correo,
                correoError,
                'Ingresa un correo electrónico válido.'
            );

            return false;
        }

        limpiarError(correo, correoError);
        correo.classList.add('is-valid');

        return true;
    }

    // En el login solamente verificamos que no esté vacío.
    // La contraseña real se comprueba en PHP con password_verify().
    function validarPassword() {

        const valor = password.value;

        if (!valor) {

            mostrarError(
                password,
                passwordError,
                'Ingresa tu contraseña.'
            );

            return false;
        }

        limpiarError(password, passwordError);
        password.classList.add('is-valid');

        return true;
    }

    // Validamos el correo al escribir.
    correo.addEventListener('input', () => {

        if (correo.classList.contains('is-invalid')) {
            validarCorreo();
        }

        loginMessage.classList.add('d-none');
    });

    correo.addEventListener('blur', validarCorreo);

    // Validamos contraseña al escribir.
    password.addEventListener('input', () => {

        if (password.classList.contains('is-invalid')) {
            validarPassword();
        }

        loginMessage.classList.add('d-none');
    });

    password.addEventListener('blur', validarPassword);

    // Mostrar u ocultar contraseña.
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

    // Estado visual del botón.
    function cambiarEstadoBoton(cargando) {

        if (!loginBtn) return;

        loginBtn.disabled = cargando;

        if (loginBtnText) {
            loginBtnText.textContent = cargando
                ? 'Iniciando sesión...'
                : 'Iniciar sesión';
        }

        if (loginSpinner) {
            loginSpinner.classList.toggle('d-none', !cargando);
        }
    }

    // Enviar credenciales al servidor.
    loginForm.addEventListener('submit', async (event) => {

        event.preventDefault();

        loginMessage.className = 'alert d-none';
        loginMessage.textContent = '';

        const correoValido = validarCorreo();
        const passwordValida = validarPassword();

        if (!correoValido || !passwordValida) {

            mostrarMensaje(
                'Por favor, corrige los errores antes de continuar.'
            );

            const primerCampoInvalido =
                loginForm.querySelector('.is-invalid');

            if (primerCampoInvalido) {
                primerCampoInvalido.focus();
            }

            return;
        }

        cambiarEstadoBoton(true);

        try {

            const datos = new FormData(loginForm);

            const respuesta = await fetch('../php/login.php', {
                method: 'POST',
                body: datos
            });

            const resultado = await respuesta.json();

            if (!respuesta.ok || !resultado.success) {

                mostrarMensaje(
                    resultado.message ||
                    'No fue posible iniciar sesión.'
                );

                return;
            }

            mostrarMensaje(
                resultado.message,
                'success'
            );

            // Redirigimos al feed despues de autenticar.
            window.location.href =
                resultado.redirect || 'feed.html';

        } catch (error) {

            console.error('Error al iniciar sesión:', error);

            mostrarMensaje(
                'No fue posible comunicarse con el servidor.'
            );

        } finally {

            cambiarEstadoBoton(false);

        }

    });

    // Recuperacion de contraseña.
    if (forgotPassword) {

        forgotPassword.addEventListener('click', (event) => {

            event.preventDefault();

            mostrarMensaje(
                'La recuperación de contraseña todavía no está implementada.',
                'info'
            );

        });

    }

});
 