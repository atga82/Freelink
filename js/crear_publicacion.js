document.addEventListener("DOMContentLoaded", () => {
    const formulario = document.getElementById("formPublicacion");
    const campoTexto = document.getElementById("textoPublicacion");
    const contadorTexto = document.getElementById("contadorTexto");
    const inputArchivos = document.getElementById("archivosPublicacion");
    const listaArchivos = document.getElementById("listaArchivos");
    const textoVistaPrevia = document.getElementById("textoVistaPrevia");
    const multimediaVistaPrevia = document.getElementById("multimediaVistaPrevia");
    const mensajePublicacion = document.getElementById("mensajePublicacion");
    const zonaArchivo = document.getElementById("zonaSeleccionArchivo");
    const radiosTipo = document.querySelectorAll(
        'input[name="tipo_contenido"]'
    );

    const tiposPermitidos = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "video/mp4",
        "video/webm"
    ];

    const limiteBytes = 50 * 1024 * 1024;
    let urlsVistaPrevia = []; 

    function tipoSeleccionado() {
        return document.querySelector(
            'input[name="tipo_contenido"]:checked'
        )?.value || "imagen";
    }

    function formatearTamano(bytes) {
        if (bytes < 1024 * 1024) {
            return `${(bytes / 1024).toFixed(1)} KB`;
        }

        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    function mostrarMensaje(mensaje) {
        mensajePublicacion.textContent = mensaje;
        mensajePublicacion.hidden = false;
    }

    function actualizarTexto() {
        contadorTexto.textContent = campoTexto.value.length;
        textoVistaPrevia.textContent =
            campoTexto.value.trim() ||
            "Tu publicación aparecerá aquí.";
    }

    function actualizarTipoPublicacion() {

        const tipo = tipoSeleccionado();
        inputArchivos.value = '';

        if (tipo === 'texto') {

            zonaSeleccionArchivo.hidden = true;
            inputArchivos.value = '';

        } else {

            zonaSeleccionArchivo.hidden = false;

            if (tipo === 'imagen') {

                inputArchivos.accept =
                    'image/jpeg,image/png,image/gif,image/webp';

                inputArchivos.multiple = true;

            } else if (tipo === 'video') {

                inputArchivos.accept =
                    'video/mp4,video/webm';

                inputArchivos.multiple = false;
            }
        }

        actualizarVistaPreviaArchivo();
    }

    function actualizarVistaPreviaArchivo() {

        // Liberar las URL anteriores.
        urlsVistaPrevia.forEach(url => {
            URL.revokeObjectURL(url);
        });

        urlsVistaPrevia = [];

        listaArchivos.innerHTML = '';
        multimediaVistaPrevia.innerHTML = '';

        const archivos = Array.from(inputArchivos.files);

        if (archivos.length === 0) {
            return;
        }

        archivos.forEach((archivo, indice) => {

            const elemento = document.createElement('div');

            elemento.textContent =
                `${indice + 1}. ${archivo.name} (${formatearTamano(archivo.size)})`;

            listaArchivos.appendChild(elemento);

            const url = URL.createObjectURL(archivo);

            urlsVistaPrevia.push(url);

            if (archivo.type.startsWith('image/')) {

                const imagen = document.createElement('img');

                imagen.src = url;
                imagen.alt = `Vista previa de ${archivo.name}`;
                imagen.style.maxWidth = '100%';
                imagen.style.maxHeight = '250px';
                imagen.style.objectFit = 'contain';

                multimediaVistaPrevia.appendChild(imagen);

            } else if (archivo.type.startsWith('video/')) {

                const video = document.createElement('video');

                video.src = url;
                video.controls = true;
                video.preload = 'metadata';
                video.style.maxWidth = '100%';
                video.style.maxHeight = '250px';

                multimediaVistaPrevia.appendChild(video);
            }
        });
    }

    radiosTipo.forEach(radio => {
        radio.addEventListener("change", () => {
            actualizarTipoPublicacion();
            mensajePublicacion.hidden = true;
        });
    });

    campoTexto.addEventListener("input", () => {
        actualizarTexto();
        mensajePublicacion.hidden = true;
    });

    inputArchivos.addEventListener('change', () => {

        const archivos = Array.from(inputArchivos.files);
        const tipo = tipoSeleccionado();

        if (archivos.length === 0) {
            actualizarVistaPreviaArchivo();
            return;
        }

        // Validar cantidad de archivos.
        if (tipo === 'imagen' && archivos.length > 3) {

            mostrarMensaje(
                'Solo puedes seleccionar hasta 3 imágenes.',
                'error'
            );

            inputArchivos.value = '';
            actualizarVistaPreviaArchivo();
            return;
        }

        if (tipo === 'video' && archivos.length > 1) {

            mostrarMensaje(
                'Solo puedes seleccionar un video.',
                'error'
            );

            inputArchivos.value = '';
            actualizarVistaPreviaArchivo();
            return;
        }

        // Validar cada archivo.
        for (const archivo of archivos) {

            if (!tiposPermitidos.includes(archivo.type)) {

                mostrarMensaje(
                    'Uno de los archivos tiene un formato no permitido.',
                    'error'
                );

                inputArchivos.value = '';
                actualizarVistaPreviaArchivo();
                return;
            }

            if (archivo.size > limiteBytes) {

                mostrarMensaje(
                    `El archivo ${archivo.name} supera los 50 MB.`,
                    'error'
                );

                inputArchivos.value = '';
                actualizarVistaPreviaArchivo();
                return;
            }

            if (
                tipo === 'imagen' &&
                !archivo.type.startsWith('image/')
            ) {

                mostrarMensaje(
                    'Para publicaciones de imagen, selecciona únicamente imágenes.',
                    'error'
                );

                inputArchivos.value = '';
                actualizarVistaPreviaArchivo();
                return;
            }

            if (
                tipo === 'video' &&
                !archivo.type.startsWith('video/')
            ) {

                mostrarMensaje(
                    'Para publicaciones de video, selecciona únicamente videos.',
                    'error'
                );

                inputArchivos.value = '';
                actualizarVistaPreviaArchivo();
                return;
            }
        }

        actualizarVistaPreviaArchivo();

        mostrarMensaje(
            `${archivos.length} archivo(s) seleccionado(s).`,
            'success'
        );
    });

    
    formulario.addEventListener("submit", (evento) => {

        const tipo = tipoSeleccionado();
        const texto = campoTexto.value.trim();
        const archivos = Array.from(inputArchivos.files);

        // Validar longitud del texto.
        if (texto.length > 2000) {
            evento.preventDefault();
            mostrarMensaje("El texto no puede superar los 2000 caracteres.");
            return;
        }

        // Validar publicación de texto.
        if (tipo === "texto") {

            if (!texto) {
                evento.preventDefault();
                mostrarMensaje("Escribe algo antes de publicar.");
                return;
            }

            if (archivos.length > 0) {
                evento.preventDefault();
                mostrarMensaje("Las publicaciones de texto no deben contener archivos.");
                return;
            }
        }

        // Validar publicaciones de imágenes.
        if (tipo === "imagen") {

            if (archivos.length === 0) {
                evento.preventDefault();
                mostrarMensaje("Selecciona al menos una imagen.");
                return;
            }

            if (archivos.length > 3) {
                evento.preventDefault();
                mostrarMensaje("Solo puedes publicar hasta 3 imágenes.");
                return;
            }

            for (const archivo of archivos) {

                if (!archivo.type.startsWith("image/")) {
                    evento.preventDefault();
                    mostrarMensaje("Todos los archivos deben ser imágenes.");
                    return;
                }

                if (!tiposPermitidos.includes(archivo.type)) {
                    evento.preventDefault();
                    mostrarMensaje("Uno de los formatos de imagen no está permitido.");
                    return;
                }

                if (archivo.size > limiteBytes) {
                    evento.preventDefault();
                    mostrarMensaje(`La imagen ${archivo.name} supera los 50 MB.`);
                    return;
                }
            }
        }

        // Validamos publicacion de video.
        if (tipo === "video") {

            if (archivos.length !== 1) {
                evento.preventDefault();
                mostrarMensaje("Selecciona exactamente un video.");
                return;
            }

            const archivo = archivos[0];

            if (!archivo.type.startsWith("video/") ||
                !tiposPermitidos.includes(archivo.type)) {

                evento.preventDefault();
                mostrarMensaje("Selecciona un video MP4 o WebM.");
                return;
            }

            if (archivo.size > limiteBytes) {
                evento.preventDefault();
                mostrarMensaje("El video no puede superar los 50 MB.");
                return;
            }
        }

        // Enviamos formulario.
        const botonPublicar = formulario.querySelector(
            'button[type="submit"]'
        );

        if (botonPublicar) {
            botonPublicar.disabled = true;
            botonPublicar.textContent = "Publicando...";
        }
    });


    actualizarTexto();
    actualizarTipoPublicacion();
    actualizarVistaPreviaArchivo();
});
 
 
 