document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const correo = document.getElementById('correo');
    const password = document.getElementById('password');
    const togglePassword = document.getElementById('togglePassword');
    const loginMessage = document.getElementById('loginMessage');
    const forgotPassword = document.getElementById('forgotPassword');

    if (!loginForm || !correo || !password) return;

    // Obtener los mensajes de error de cada campo.
    const correoError = correo
        .closest('.mb-4')
        .querySelector('.invalid-feedback');

    const passwordError = password
        .closest('.mb-3')
        .querySelector('.invalid-feedback');

    // Mostrar u ocultar un mensaje de error.
    function mostrarError(input, mensaje, texto) {
        input.classList.add('is-invalid');
        input.classList.remove('is-valid');

        mensaje.textContent = texto;
        mensaje.style.display = 'block';
    }

    // Limpiar el error de un campo.
    function limpiarError(input, mensaje) {
        input.classList.remove('is-invalid');
        input.classList.remove('is-valid');

        mensaje.style.display = 'none';
        mensaje.textContent = '';
    }

    // Validar el formato del correo.
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

    // Validar los requisitos de la contraseña.
    function validarPassword() {
        const valor = password.value;

        const tieneLongitud = valor.length >= 8;
        const tieneMayuscula = /[A-Z]/.test(valor);
        const tieneNumero = /\d/.test(valor);
        const tieneEspecial = /[^A-Za-z0-9\s]/.test(valor);

        if (!valor) {
            mostrarError(
                password,
                passwordError,
                'Ingresa tu contraseña.'
            );
            return false;
        }

        const requisitos = [];

        if (!tieneLongitud) {
            requisitos.push('al menos 8 caracteres');
        }

        if (!tieneMayuscula) {
            requisitos.push('una letra mayúscula');
        }

        if (!tieneNumero) {
            requisitos.push('un número');
        }

        if (!tieneEspecial) {
            requisitos.push('un carácter especial');
        }

        if (requisitos.length > 0) {
            mostrarError(
                password,
                passwordError,
                'La contraseña debe contener ' +
                requisitos.join(', ') +
                '.'
            );
            return false;
        }

        limpiarError(password, passwordError);
        password.classList.add('is-valid');

        return true;
    }

    // Validar al escribir o al salir del campo.
    correo.addEventListener('input', () => {
        if (correo.classList.contains('is-invalid')) {
            validarCorreo();
        }

        loginMessage.classList.add('d-none');
    });

    correo.addEventListener('blur', validarCorreo);

    password.addEventListener('input', () => {
        if (password.classList.contains('is-invalid')) {
            validarPassword();
        }

        loginMessage.classList.add('d-none');
    });

    password.addEventListener('blur', validarPassword);

    // Mostrar u ocultar la contraseña.
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

    // Validar el formulario antes de procesarlo.
    loginForm.addEventListener('submit', (event) => {
        event.preventDefault();

        loginMessage.className = 'alert d-none';
        loginMessage.textContent = '';

        const correoValido = validarCorreo();
        const passwordValida = validarPassword();

        if (!correoValido || !passwordValida) {
            loginMessage.className = 'alert alert-danger';
            loginMessage.textContent =
                'Por favor, corrige los errores antes de continuar.';

            const primerCampoInvalido = loginForm.querySelector('.is-invalid');

            if (primerCampoInvalido) {
                primerCampoInvalido.focus();
            }

            return;
        }

        // El login todavía no está conectado a un servidor.
        loginMessage.className = 'alert alert-info';
        loginMessage.textContent =
            'El formato de los datos es válido. ' +
            'Para iniciar sesión, falta conectar el formulario ' +
            'con el servidor y verificar tus credenciales.';
    });

    // Aviso para la opción de recuperar contraseña.
    if (forgotPassword) {
        forgotPassword.addEventListener('click', (event) => {
            event.preventDefault();

            loginMessage.className = 'alert alert-info';
            loginMessage.textContent =
                'La recuperación de contraseña todavía no está implementada.';
        });
    }
});
