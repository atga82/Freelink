document.addEventListener('DOMContentLoaded', async () => {

    const esPaginaPrincipal = !window.location.pathname.includes('/pages/');
    const rutaBase = esPaginaPrincipal ? '' : '../';

    //cargar navbar y footer
    async function cargarComponente(id, archivo) {

        const contenedor = document.getElementById(id);

        if (!contenedor) return;

        try {
            const respuesta = await fetch(archivo);

            if (!respuesta.ok) {
                throw new Error(`No se pudo cargar ${archivo}`);
            }

            contenedor.innerHTML = await respuesta.text();

        } catch (error) {
            console.error(error);
        }
    }

    await Promise.all([
        cargarComponente(
            'navbar-container',
            `${rutaBase}partials/navbar.html`
        ),

        cargarComponente(
            'footer-container',
            `${rutaBase}partials/footer.html`
        )
    ]);

    //actualizar el año del footer
    const footerYear = document.getElementById('footerYear');

    if (footerYear) {
        footerYear.textContent = new Date().getFullYear();
    }

    //marcar el enlace de la página actual
    const paginaActual = window.location.pathname
        .split('/')
        .pop();

    document.querySelectorAll('.freelink-nav a').forEach(enlace => {

        if (enlace.dataset.page === paginaActual) {
            enlace.classList.add('active');
        }

    });

    //consultar la sesion php
    try {

        const respuesta = await fetch(`${rutaBase}php/verificar_sesion.php`, {
            method: 'GET',
            credentials: 'same-origin'
        });

        if (!respuesta.ok) {
            throw new Error('No se pudo verificar la sesión.');
        }

        const datos = await respuesta.json();
        console.log('Respuesta de verificar_sesion.php:', datos);
        console.log('ID recibido:', datos.user?.id);
        console.log('ID de usuario alternativo:', datos.user?.id_usuario);

        const perfil = document.getElementById('navbarProfile');
        const avatar = document.getElementById('navbarAvatar');
        const nombre = document.getElementById('navbarUserName');
        const visitante = document.getElementById('navbarGuest');
        const avatarImg = document.getElementById('navbarAvatarImg'); 

        if (datos.authenticated && datos.user) {

            const nombreUsuario = datos.user.nombre || 'Usuario';

            //obtener iniciales
            const iniciales = nombreUsuario
                .trim()
                .split(/\s+/)
                .filter(Boolean)
                .slice(0, 2)
                .map(palabra => palabra.charAt(0).toUpperCase())
                .join('');

            if (avatarImg && avatar) {
                avatarImg.hidden = true;
                avatar.hidden = false;

                avatarImg.onload = () => {
                    avatarImg.hidden = false;
                    avatar.hidden = true;
                };

                avatarImg.onerror = () => {
                    avatarImg.hidden = true;
                    avatar.hidden = false;
                };
                console.log('ID recibido por componentes.js:', datos.user.id);
                console.log('URL solicitada para la foto:', avatarImg.src);
                avatarImg.src = `../php/obtener_foto_perfil.php?id=${encodeURIComponent(datos.user.id)}&v=${Date.now()}`;
            }

            if (nombre) {
                nombre.textContent = nombreUsuario;
            }

            if (avatar) {
                avatar.textContent = iniciales || 'U';
            }

            if (perfil) {
                perfil.hidden = false;
            }

            if (visitante) {
                visitante.hidden = true;
            }

        } else {

            if (perfil) {
                perfil.hidden = true;
            }

            if (visitante) {
                visitante.hidden = false;
            }

        }

    } catch (error) {

        console.error('Error al consultar la sesión:', error);

    }

});
