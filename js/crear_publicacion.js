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
    let urlVistaPrevia = null;

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

        zonaArchivo.hidden = tipo === "texto";

        inputArchivos.accept =
            tipo === "imagen"
                ? "image/jpeg,image/png,image/gif,image/webp"
                : "video/mp4,video/webm";

        if (
            inputArchivos.files.length > 0 &&
            tipo === "texto"
        ) {
            inputArchivos.value = "";
            actualizarVistaPreviaArchivo();
        }

        if (tipo === "imagen" || tipo === "video") {
            const archivo = inputArchivos.files[0];

            if (archivo) {
                const esImagen = archivo.type.startsWith("image/");
                const esVideo = archivo.type.startsWith("video/");

                if (
                    (tipo === "imagen" && !esImagen) ||
                    (tipo === "video" && !esVideo)
                ) {
                    inputArchivos.value = "";
                    actualizarVistaPreviaArchivo();
                }
            }
        }
    }

    function actualizarVistaPreviaArchivo() {
        if (urlVistaPrevia) {
            URL.revokeObjectURL(urlVistaPrevia);
            urlVistaPrevia = null;
        }

        listaArchivos.replaceChildren();
        multimediaVistaPrevia.replaceChildren();

        const archivo = inputArchivos.files[0];

        if (!archivo) return;

        const tarjeta = document.createElement("div");
        tarjeta.className = "archivo-seleccionado";

        const datos = document.createElement("div");
        datos.className = "datos-archivo";

        const nombre = document.createElement("strong");
        nombre.textContent = archivo.name;

        const tamano = document.createElement("span");
        tamano.textContent = formatearTamano(archivo.size);

        datos.append(nombre, tamano);
        tarjeta.appendChild(datos);
        listaArchivos.appendChild(tarjeta);

        urlVistaPrevia = URL.createObjectURL(archivo);

        if (archivo.type.startsWith("image/")) {
            const imagen = document.createElement("img");
            imagen.src = urlVistaPrevia;
            imagen.alt = `Vista previa de ${archivo.name}`;
            multimediaVistaPrevia.appendChild(imagen);
        } else if (archivo.type.startsWith("video/")) {
            const video = document.createElement("video");
            video.src = urlVistaPrevia;
            video.controls = true;
            video.preload = "metadata";
            video.setAttribute("aria-label", `Vista previa de ${archivo.name}`);
            multimediaVistaPrevia.appendChild(video);
        }
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

    inputArchivos.addEventListener("change", () => {
        const archivo = inputArchivos.files[0];
        const tipo = tipoSeleccionado();

        if (!archivo) {
            actualizarVistaPreviaArchivo();
            return;
        }

        if (!tiposPermitidos.includes(archivo.type)) {
            inputArchivos.value = "";
            actualizarVistaPreviaArchivo();
            mostrarMensaje(
                "Formato no permitido. Usa JPG, PNG, GIF, WEBP, MP4 o WEBM."
            );
            return;
        }

        if (
            (tipo === "imagen" && !archivo.type.startsWith("image/")) ||
            (tipo === "video" && !archivo.type.startsWith("video/"))
        ) {
            inputArchivos.value = "";
            actualizarVistaPreviaArchivo();
            mostrarMensaje(
                tipo === "imagen"
                    ? "Selecciona un archivo de imagen."
                    : "Selecciona un archivo de video."
            );
            return;
        }

        if (archivo.size === 0 || archivo.size > limiteBytes) {
            inputArchivos.value = "";
            actualizarVistaPreviaArchivo();
            mostrarMensaje("El archivo debe pesar más de 0 bytes y no superar 50 MB.");
            return;
        }

        actualizarVistaPreviaArchivo();
        mensajePublicacion.hidden = true;
    });

    formulario.addEventListener("submit", (evento) => {
        const tipo = tipoSeleccionado();
        const texto = campoTexto.value.trim();
        const archivo = inputArchivos.files[0];

        if (texto.length > 2000) {
            evento.preventDefault();
            mostrarMensaje("El texto no puede superar los 2000 caracteres.");
            return;
        }

        if (tipo === "texto") {
            if (!texto) {
                evento.preventDefault();
                mostrarMensaje("Escribe algo antes de publicar.");
                return;
            }
        } else {
            if (!archivo) {
                evento.preventDefault();
                mostrarMensaje("Selecciona una imagen o un video antes de publicar.");
                return;
            }

            if (tipo === "imagen" && !archivo.type.startsWith("image/")) {
                evento.preventDefault();
                mostrarMensaje("El tipo seleccionado requiere una imagen.");
                return;
            }

            if (tipo === "video" && !archivo.type.startsWith("video/")) {
                evento.preventDefault();
                mostrarMensaje("El tipo seleccionado requiere un video.");
                return;
            }
        }

        // El navegador envia el formulario a crear_publicacion.php
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
 
 
 