// ✅ Inicializa EmailJS correctamente
(function () {
  emailjs.init("Xfy8rt5BbNV_iG2CB"); // Tu Public Key
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

  // 🕓 Generar horarios disponibles (de 8:00 a 17:00)
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

  // 🔒 Bloquear selección de fechas pasadas en el calendario
  const hoy = new Date();
  const hoyStr = hoy.toISOString().split("T")[0];
  fechaInput.min = hoyStr; // ⛔ No se puede elegir antes de hoy

  // 🟣 Mostrar loader mientras se consulta disponibilidad
  function mostrarLoader(mostrar) {
    if (mostrar) {
      horaSelect.innerHTML = '<option>Cargando disponibilidad...</option>';
      horaSelect.disabled = true;
    } else {
      horaSelect.disabled = false;
    }
  }

  // 🟢 Marcar horas ocupadas o pasadas
  function mostrarHorasOcupadas(ocupadas = [], fechaSeleccionada) {
    generarHoras();

    const ahora = new Date();
    const fechaHoy = ahora.toISOString().split("T")[0];

    // ⏰ Si es hoy, bloquear horas pasadas
    if (fechaSeleccionada === fechaHoy) {
      const horaActual = ahora.getHours();
      [...horaSelect.options].forEach(opt => {
        const horaOpt = parseInt(opt.value.split(":")[0]);
        if (horaOpt <= horaActual) {
          opt.disabled = true;
          opt.textContent += " (No disponible)";
        }
      });
    }

    // 🔴 Marcar horas ocupadas
    ocupadas.forEach(horaOcupada => {
      const opt = [...horaSelect.options].find(o => o.value === horaOcupada);
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

    // 🚫 Evitar fechas pasadas manualmente
    const hoy = new Date();
    const fechaSeleccionada = new Date(fecha + "T00:00:00");
    if (fechaSeleccionada < new Date(hoyStr + "T00:00:00")) {
      alert("🚫 No puedes agendar en una fecha anterior a hoy.");
      fechaInput.value = hoyStr;
      return;
    }

    const cacheKey = `ocupadas_${fecha}`;
    const cached = localStorage.getItem(cacheKey);

    mostrarLoader(true);

    // 🧠 Si ya hay caché, usarla
    if (cached) {
      const horas = JSON.parse(cached);
      mostrarHorasOcupadas(horas, fecha);
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
        mostrarHorasOcupadas(data.ocupadas, fecha);
      } else {
        mostrarHorasOcupadas([], fecha);
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
    const servicio = document.getElementById("servicio").value;
    const fecha = fechaInput.value;
    const hora = horaSelect.value;

    if (!nombre || !email || !servicio || !fecha || !hora) {
      alert("⚠️ Por favor completa todos los campos antes de enviar.");
      return;
    }

    // 🚫 Bloquear envío en fechas pasadas
    const hoy = new Date();
    const fechaSeleccionada = new Date(fecha + "T00:00:00");
    if (fechaSeleccionada < new Date(hoyStr + "T00:00:00")) {
      alert("🚫 No puedes agendar en una fecha pasada.");
      return;
    }

    // 🚫 Si es hoy, no permitir horas pasadas
    if (fechaSeleccionada.toISOString().split("T")[0] === hoyStr) {
      const horaActual = hoy.getHours();
      const horaSeleccionada = parseInt(hora.split(":")[0]);
      if (horaSeleccionada <= horaActual) {
        alert("🚫 No puedes agendar en una hora que ya pasó.");
        return;
      }
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
      const postData = { nombre, email, servicio, fecha, hora };
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
        localStorage.removeItem(`ocupadas_${fecha}`);
        alert("✅ Cita registrada correctamente.");
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
