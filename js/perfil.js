function iniciarPerfil() {

    console.log('PERFIL.JS SE ESTÁ EJECUTANDO');

    // Elementos del perfil.
    const nombrePerfil = document.getElementById('profileDisplayName');
    const tipoPerfil = document.getElementById('profileUserType');
    const correoPerfil = document.getElementById('profileEmail');
    const biografiaPerfil = document.getElementById('profileBiography');
    const fotoPerfil = document.getElementById('profilePhoto');
    const botonEditarFoto = document.getElementById('editPhoto');
    const inputFoto = document.getElementById('profilePhotoInput');
    const campoNombre = document.getElementById('profileName');
    const campoBiografia = document.getElementById('profileBio');

    const contenedorIntereses =
        document.getElementById('profileInterests');

    const contenedorPublicaciones =
        document.getElementById('publicacionesPerfil');

    const contadorPublicaciones =
        document.getElementById('projectCount');

    const tiposUsuario = {
        vendedor_cliente: 'Vendedor / Cliente',
        cliente: 'Cliente'
    };

    const nombresIntereses = {
        diseno: 'Diseño',
        programacion: 'Programación',
        fotografia: 'Fotografía',
        video: 'Video',
        artesanias: 'Artesanías',
        musica: 'Música',
        educacion: 'Educación',
        creadores: 'Creadores'
    };

    const mensajeBiografiaVacia =
        'Este usuario todavía no ha agregado una descripción.';

    // Obtener iniciales del nombre.
    function obtenerIniciales(nombre) {

        return (nombre || 'Usuario')
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map(palabra => palabra.charAt(0).toUpperCase())
            .join('') || 'U';
    }

    // Mostrar mensajes dentro del contenedor de publicaciones.
    function mostrarMensajePublicaciones(mensaje) {

        if (!contenedorPublicaciones) {
            return;
        }

        const elemento = document.createElement('div');

        elemento.className = 'publicaciones-mensaje';
        elemento.textContent = mensaje;

        contenedorPublicaciones.replaceChildren(elemento);
    }

    // Crear una publicación en el perfil.
    function crearTarjetaPublicacion(publicacion) {

        const tarjeta = document.createElement('article');
        tarjeta.className = 'publicacion-perfil';

        const contenido = document.createElement('div');
        contenido.className = 'publicacion-perfil-contenido';

        // Texto de la publicación.
        if (publicacion.contenido) {

            const texto = document.createElement('p');

            texto.className = 'publicacion-perfil-texto';
            texto.textContent = publicacion.contenido;

            contenido.appendChild(texto);
        }

        // Imagen o video almacenado en MySQL.
        if (
            publicacion.tiene_multimedia &&
            publicacion.url_multimedia
        ) {

            const mimeType = (
                publicacion.mime_type || ''
            ).toLowerCase();

            if (mimeType.startsWith('image/')) {

                const imagen = document.createElement('img');

                imagen.className = 'publicacion-perfil-media';
                imagen.src = publicacion.url_multimedia;
                imagen.alt = 'Imagen de la publicación';
                imagen.loading = 'lazy';

                imagen.onerror = () => {
                    imagen.replaceWith(
                        document.createTextNode(
                            'No se pudo cargar la imagen.'
                        )
                    );
                };

                contenido.appendChild(imagen);

            } else if (mimeType.startsWith('video/')) {

                const video = document.createElement('video');

                video.className = 'publicacion-perfil-video';
                video.controls = true;
                video.preload = 'metadata';

                const fuente = document.createElement('source');

                fuente.src = publicacion.url_multimedia;
                fuente.type = mimeType;

                video.appendChild(fuente);

                video.appendChild(
                    document.createTextNode(
                        'Tu navegador no puede reproducir este video.'
                    )
                );

                contenido.appendChild(video);

            } else {

                const aviso = document.createElement('p');

                aviso.textContent =
                    'Esta publicación contiene un archivo multimedia no compatible.';

                contenido.appendChild(aviso);
            }
        }

        // Fecha de publicación.
        const fecha = document.createElement('small');

        fecha.className = 'publicacion-perfil-fecha';

        if (publicacion.fecha_publicacion) {

            const fechaPublicacion =
                new Date(
                    publicacion.fecha_publicacion.replace(' ', 'T')
                );

            fecha.textContent = !isNaN(fechaPublicacion.getTime())
                ? fechaPublicacion.toLocaleString('es-MX', {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                })
                : publicacion.fecha_publicacion;

        } else {

            fecha.textContent = 'Fecha no disponible';
        }

        contenido.appendChild(fecha);
        tarjeta.appendChild(contenido);

        return tarjeta;
    }

    // Consultar las publicaciones del usuario autenticado.
    async function cargarPublicacionesUsuario() {

        if (!contenedorPublicaciones) {
            console.warn(
                'No se encontró el contenedor publicacionesPerfil.'
            );
            return;
        }

        mostrarMensajePublicaciones(
            'Cargando tus publicaciones...'
        );

        try {

            const respuesta = await fetch(
                '../php/obtener_publicaciones_usuario.php',
                {
                    method: 'GET',
                    credentials: 'same-origin',
                    cache: 'no-store'
                }
            );

            if (respuesta.status === 401) {
                window.location.replace('login.html');
                return;
            }

            const publicaciones = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(
                    publicaciones.error ||
                    'No se pudieron consultar tus publicaciones.'
                );
            }

            if (!Array.isArray(publicaciones)) {
                throw new Error(
                    'El servidor devolvió un formato de publicaciones inválido.'
                );
            }

            // Actualizar contador.
            if (contadorPublicaciones) {
                contadorPublicaciones.textContent =
                    publicaciones.length;
            }

            contenedorPublicaciones.replaceChildren();

            // El usuario todavía no tiene publicaciones.
            if (publicaciones.length === 0) {

                mostrarMensajePublicaciones(
                    'Todavía no has publicado nada. ¡Comparte tu primera publicación!'
                );

                return;
            }

            // Mostrar publicaciones más recientes primero.
            publicaciones.forEach(publicacion => {

                const tarjeta =
                    crearTarjetaPublicacion(publicacion);

                contenedorPublicaciones.appendChild(tarjeta);

            });

            console.log(
                'Publicaciones del perfil cargadas:',
                publicaciones.length
            );

        } catch (error) {

            console.error(
                'Error al cargar publicaciones del perfil:',
                error
            );

            mostrarMensajePublicaciones(
                error.message ||
                'No fue posible cargar tus publicaciones.'
            );
        }
    }

    // Cambiar fotografía de perfil.
    if (botonEditarFoto && inputFoto) {

        botonEditarFoto.addEventListener('click', () => {
            inputFoto.click();
        });

        inputFoto.addEventListener('change', async () => {

            const archivo = inputFoto.files[0];

            if (!archivo) {
                return;
            }

            const tiposPermitidos = [
                'image/jpeg',
                'image/png',
                'image/webp'
            ];

            if (!tiposPermitidos.includes(archivo.type)) {
                alert('Selecciona una imagen JPG, PNG o WebP.');
                inputFoto.value = '';
                return;
            }

            if (archivo.size > 5 * 1024 * 1024) {
                alert('La imagen no puede superar los 5 MB.');
                inputFoto.value = '';
                return;
            }

            const botonOriginal = botonEditarFoto.innerHTML;

            botonEditarFoto.disabled = true;

            botonEditarFoto.innerHTML =
                '<i class="bi bi-hourglass-split"></i>';

            try {

                const datosFormulario = new FormData();

                datosFormulario.append(
                    'nombre',
                    nombrePerfil.textContent.trim()
                );

                const biografiaActual =
                    biografiaPerfil.textContent.trim();

                datosFormulario.append(
                    'biografia',
                    biografiaActual === mensajeBiografiaVacia
                        ? ''
                        : biografiaActual
                );

                datosFormulario.append('foto_perfil', archivo);

                const respuesta = await fetch(
                    '../php/actualizar_perfil.php',
                    {
                        method: 'POST',
                        body: datosFormulario,
                        credentials: 'same-origin'
                    }
                );

                const datos = await respuesta.json();

                if (respuesta.status === 401) {
                    window.location.replace('login.html');
                    return;
                }

                if (!respuesta.ok || !datos.success) {
                    throw new Error(
                        datos.message ||
                        'No se pudo guardar la fotografía.'
                    );
                }

                const imagen = document.createElement('img');

                imagen.src = URL.createObjectURL(archivo);
                imagen.alt =
                    'Foto de perfil de ' +
                    nombrePerfil.textContent.trim();

                imagen.style.width = '100%';
                imagen.style.height = '100%';
                imagen.style.objectFit = 'cover';
                imagen.style.borderRadius = '50%';

                fotoPerfil.replaceChildren(imagen);

                alert(
                    'Tu fotografía de perfil se actualizó correctamente.'
                );

            } catch (error) {

                console.error(
                    'Error al actualizar fotografía:',
                    error
                );

                alert(
                    error.message ||
                    'No fue posible actualizar la fotografía.'
                );

            } finally {

                botonEditarFoto.disabled = false;
                botonEditarFoto.innerHTML = botonOriginal;

                inputFoto.value = '';
            }
        });
    }

    // Cargar datos del usuario de la sesión.
    async function cargarPerfilUsuario() {

        try {

            const respuesta = await fetch(
                '../php/obtener_perfil.php',
                {
                    method: 'GET',
                    credentials: 'same-origin',
                    cache: 'no-store'
                }
            );

            if (respuesta.status === 401) {
                window.location.replace('login.html');
                return;
            }

            const datos = await respuesta.json();

            if (!respuesta.ok || !datos.success || !datos.usuario) {
                throw new Error(
                    datos.message || 'No se pudo cargar el perfil.'
                );
            }

            const usuario = datos.usuario;

            // Mostrar nombre.
            if (nombrePerfil) {
                nombrePerfil.textContent =
                    usuario.nombre || 'Usuario de FreeLink';
            }

            // Mostrar tipo de usuario.
            if (tipoPerfil) {
                tipoPerfil.textContent =
                    tiposUsuario[usuario.tipo_usuario] ||
                    'Tipo de usuario no disponible';
            }

            // Mostrar correo.
            if (correoPerfil) {
                correoPerfil.textContent =
                    usuario.correo || 'Correo no disponible';
            }

            // Mostrar biografía.
            if (biografiaPerfil) {
                biografiaPerfil.textContent =
                    usuario.biografia || mensajeBiografiaVacia;
            }

            // Mostrar foto o iniciales.
            if (fotoPerfil) {

                if (usuario.foto_perfil) {

                    const imagen = document.createElement('img');

                    imagen.src = usuario.foto_perfil;
                    imagen.alt =
                        'Foto de perfil de ' + usuario.nombre;

                    imagen.style.width = '100%';
                    imagen.style.height = '100%';
                    imagen.style.objectFit = 'cover';
                    imagen.style.borderRadius = '50%';

                    fotoPerfil.replaceChildren(imagen);

                } else {

                    fotoPerfil.textContent =
                        obtenerIniciales(usuario.nombre);
                }
            }

            // Cargar datos actuales en el formulario.
            if (campoNombre) {
                campoNombre.value = usuario.nombre || '';
            }

            if (campoBiografia) {
                campoBiografia.value = usuario.biografia || '';
            }

            // Mostrar áreas de interés.
            if (contenedorIntereses) {

                contenedorIntereses.replaceChildren();

                const intereses = Array.isArray(usuario.intereses)
                    ? usuario.intereses
                    : [];

                if (intereses.length === 0) {

                    contenedorIntereses.textContent =
                        'Este usuario todavía no ha seleccionado áreas de interés.';

                } else {

                    intereses.forEach(interes => {

                        const etiqueta =
                            document.createElement('span');

                        etiqueta.textContent =
                            nombresIntereses[interes] || interes;

                        contenedorIntereses.appendChild(etiqueta);
                    });
                }
            }

        } catch (error) {

            console.error('Error al cargar el perfil:', error);

            if (nombrePerfil) {
                nombrePerfil.textContent =
                    'No se pudo cargar el perfil';
            }

            if (tipoPerfil) {
                tipoPerfil.textContent =
                    'Información no disponible';
            }

            if (correoPerfil) {
                correoPerfil.textContent =
                    'No se pudo consultar el correo';
            }

            if (biografiaPerfil) {
                biografiaPerfil.textContent =
                    'No fue posible obtener la información del usuario.';
            }

            if (contenedorIntereses) {
                contenedorIntereses.textContent =
                    'No se pudieron cargar las áreas de interés.';
            }
        }
    }

    // Navegación entre pestañas.
    const pestañas = document.querySelectorAll('.profile-tab');
    const secciones = document.querySelectorAll('.profile-section');

    pestañas.forEach(pestaña => {

        pestaña.addEventListener('click', () => {

            const idSeccion = pestaña.dataset.section;

            const seccionSeleccionada =
                document.getElementById(idSeccion);

            if (!seccionSeleccionada) {
                console.error(
                    `No existe la sección: ${idSeccion}`
                );
                return;
            }

            pestañas.forEach(item => {
                item.classList.remove('active');
                item.setAttribute('aria-selected', 'false');
            });

            secciones.forEach(seccion => {
                seccion.classList.remove('active-section');
            });

            pestaña.classList.add('active');
            pestaña.setAttribute('aria-selected', 'true');

            seccionSeleccionada.classList.add('active-section');
        });
    });

    // Modal para editar perfil.
    const modalElemento =
        document.getElementById('editProfileModal');

    const formulario =
        document.getElementById('editProfileForm');

    const botonesEditar =
        document.querySelectorAll('.edit-section-btn');

    let modalEditar = null;

    if (modalElemento && formulario && window.bootstrap) {

        modalEditar =
            bootstrap.Modal.getOrCreateInstance(modalElemento);

        botonesEditar.forEach(boton => {

            boton.addEventListener('click', () => {

                if (nombrePerfil && campoNombre) {
                    campoNombre.value =
                        nombrePerfil.textContent.trim();
                }

                if (biografiaPerfil && campoBiografia) {

                    campoBiografia.value =
                        biografiaPerfil.textContent ===
                        mensajeBiografiaVacia
                            ? ''
                            : biografiaPerfil.textContent.trim();
                }

                modalEditar.show();
            });
        });

        // Guardar cambios en MySQL.
        formulario.addEventListener('submit', async evento => {

            evento.preventDefault();

            const nombre =
                campoNombre?.value.trim() || '';

            const biografia =
                campoBiografia?.value.trim() || '';

            if (!nombre) {
                alert('El nombre es obligatorio.');
                return;
            }

            if (nombre.length > 100 || biografia.length > 2000) {
                alert(
                    'Revisa la longitud del nombre o la biografía.'
                );
                return;
            }

            const botonGuardar =
                formulario.querySelector('[type="submit"]');

            if (botonGuardar) {
                botonGuardar.disabled = true;
            }

            try {

                const datosFormulario = new FormData();

                datosFormulario.append('nombre', nombre);
                datosFormulario.append('biografia', biografia);

                const respuesta = await fetch(
                    '../php/actualizar_perfil.php',
                    {
                        method: 'POST',
                        body: datosFormulario,
                        credentials: 'same-origin'
                    }
                );

                const datos = await respuesta.json();

                if (respuesta.status === 401) {
                    window.location.replace('login.html');
                    return;
                }

                if (!respuesta.ok || !datos.success) {
                    throw new Error(
                        datos.message ||
                        'No se pudieron guardar los cambios.'
                    );
                }

                // Actualizar la interfaz después de guardar.
                if (nombrePerfil) {
                    nombrePerfil.textContent =
                        datos.usuario.nombre;
                }

                if (biografiaPerfil) {
                    biografiaPerfil.textContent =
                        datos.usuario.biografia ||
                        mensajeBiografiaVacia;
                }

                if (fotoPerfil && !fotoPerfil.querySelector('img')) {
                    fotoPerfil.textContent =
                        obtenerIniciales(nombre);
                }

                modalEditar.hide();

                alert('Tu perfil se actualizó correctamente.');

            } catch (error) {

                console.error(
                    'Error al actualizar el perfil:',
                    error
                );

                alert(
                    error.message ||
                    'Ocurrió un error al guardar el perfil.'
                );

            } finally {

                if (botonGuardar) {
                    botonGuardar.disabled = false;
                }
            }
        });

    } else {

        console.warn(
            'No se encontró el modal, el formulario o Bootstrap.'
        );
    }

    // Iniciar cargas independientes.
    cargarPerfilUsuario();
    cargarPublicacionesUsuario();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciarPerfil);
} else {
    iniciarPerfil();
}




