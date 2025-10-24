// ✅ Inicializa EmailJS correctamente
(function () {
  emailjs.init("Xfy8rt5BbNV_iG2CB"); // Tu Public Key de EmailJS
})();

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("citaForm");
  const successMsg = document.getElementById("successMsg");
  const errorMsg = document.getElementById("errorMsg");
  const horaSelect = document.getElementById("hora");
  const fechaInput = document.getElementById("fecha");

  // 🟢 Tu Google Apps Script publicado
  const googleScriptUrl =
    "https://script.google.com/macros/s/AKfycbwbuGpcYr7LPurHdLgI03hqmScNh6pl_-tuLhwRYASn7bs7Xk1-oTpzouydPZ6GX6aWug/exec";

  // 🟢 Proxy para evitar CORS
  const proxyUrl = "https://proxyagenda.glow-nails-artt.workers.dev/?url=";

  // 🕓 Generar horarios de 8:00 a 17:00
  function generarHoras() {
    horaSelect.innerHTML = '<option value="">Selecciona una hora</option>';
    for (let h = 8; h <= 17; h++) {
      const hora = `${h.toString().padStart(2, "0")}:00`;
      const option = document.createElement("option");
      option.value = hora;
      option.textContent = hora;
      horaSelect.appendChild(option);
    }
  }

  // 🟣 Mostrar loader mientras se consulta disponibilidad
  function mostrarLoader(mostrar) {
    if (mostrar) {
      horaSelect.innerHTML = '<option>Cargando disponibilidad...</option>';
      horaSelect.disabled = true;
    } else {
      horaSelect.disabled = false;
    }
  }

  // 🟢 Marcar horas ocupadas en el select
  function mostrarHorasOcupadas(ocupadas = []) {
    generarHoras();
    ocupadas.forEach((horaOcupada) => {
      const opt = [...horaSelect.options].find((o) => o.value === horaOcupada);
      if (opt) {
        opt.disabled = true;
        opt.textContent += " (Ocupada)";
      }
    });
  }

  generarHoras();

  // 📅 Consultar disponibilidad al cambiar la fecha
  fechaInput.addEventListener("change", async () => {
    const fecha = fechaInput.value;
    if (!fecha) return;

    const cacheKey = `ocupadas_${fecha}`;
    const cached = localStorage.getItem(cacheKey);

    mostrarLoader(true);

    // 🧠 Si ya hay caché, usarla al instante
    if (cached) {
      const horas = JSON.parse(cached);
      mostrarHorasOcupadas(horas);
      mostrarLoader(false);
      console.log("📦 Usando caché de disponibilidad:", horas);
      return;
    }

    console.log("📡 Consultando disponibilidad para:", fecha);
    try {
      const res = await fetch(`${proxyUrl}${googleScriptUrl}?fecha=${fecha}`);
      const data = await res.json();

      if (data.ocupadas && Array.isArray(data.ocupadas)) {
        localStorage.setItem(cacheKey, JSON.stringify(data.ocupadas));
        mostrarHorasOcupadas(data.ocupadas);
      } else {
        mostrarHorasOcupadas([]);
      }
    } catch (err) {
      console.error("❌ Error al obtener disponibilidad:", err);
      alert("Error al verificar disponibilidad. Intenta nuevamente más tarde.");
      generarHoras();
    } finally {
      mostrarLoader(false);
    }
  });

  // 📤 Enviar cita
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombre = document.getElementById("nombre").value.trim();
    const email = document.getElementById("email").value.trim();
    const telefono = document.getElementById("telefono").value.trim();
    const servicio = document.getElementById("servicio").value;
    const fecha = fechaInput.value;
    const hora = horaSelect.value;

    if (!nombre || !email || !telefono || !servicio || !fecha || !hora) {
      alert("⚠️ Por favor completa todos los campos antes de enviar.");
      return;
    }

    if (horaSelect.selectedOptions[0].disabled) {
      alert("🚫 Esta hora ya está ocupada.");
      return;
    }

    form.querySelector("button[type='submit']").disabled = true;

    try {
      // ✉️ Enviar correo de confirmación
      await emailjs.send("service_tp0xzhi", "template_6csycq9", {
        to_name: nombre,
        to_email: email,
        servicio,
        fecha,
        hora,
      });

      // 🗓️ Guardar cita en el calendario mediante Apps Script
      const postData = { nombre, email, telefono, servicio, fecha, hora };
      const response = await fetch(`${proxyUrl}${googleScriptUrl}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postData),
      });

      const result = await response.json();

      if (result.success) {
        successMsg.style.display = "block";
        errorMsg.style.display = "none";
        form.reset();
        generarHoras();

        // 🧹 Limpiar caché del día afectado para evitar duplicados
        localStorage.removeItem(`ocupadas_${fecha}`);

        alert("✅ Cita registrada correctamente.");

        // ✅ Enviar mensaje de WhatsApp al cliente y a ti
        const mensaje = `💅 *Confirmación de cita - Glow Nails Art* 💅%0A
👩‍💼 Nombre: ${nombre}%0A
📅 Fecha: ${fecha}%0A
🕒 Hora: ${hora}%0A
💖 Servicio: ${servicio}%0A%0A
¡Gracias por agendar con nosotras! 🌸`;

        // 🟣 Enviar mensaje a tu WhatsApp
        window.open(`https://wa.me/573124563132?text=${mensaje}`, "_blank");

        // 🟢 Enviar mensaje al cliente
        if (telefono) {
          window.open(`https://wa.me/57${telefono}?text=${mensaje}`, "_blank");
        }
      } else {
        throw new Error(result.message || "Error al crear la cita.");
      }
    } catch (err) {
      console.error("❌ Error al enviar cita:", err);
      successMsg.style.display = "none";
      errorMsg.style.display = "block";
      alert("❌ No se pudo registrar la cita. Intenta nuevamente.");
    } finally {
      form.querySelector("button[type='submit']").disabled = false;
    }
  });
});
