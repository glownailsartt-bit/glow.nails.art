(function () {
  emailjs.init("Xfy8rt5BbNV_iG2CB");
})();

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("citaForm");
  const successMsg = document.getElementById("successMsg");
  const errorMsg = document.getElementById("errorMsg");
  const horaSelect = document.getElementById("hora");
  const fechaInput = document.getElementById("fecha");

  // 🟢 URL de tu Google Apps Script (ya funcional)
  const googleScriptUrl = "https://script.google.com/macros/s/AKfycbwbuGpcYr7LPurHdLgI03hqmScNh6pl_-tuLhwRYASn7bs7Xk1-oTpzouydPZ6GX6aWug/exec";

  // 🟢 Proxy Cloudflare estable y gratuito
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

  generarHoras();

  // 📅 Al cambiar la fecha, consultar disponibilidad
  fechaInput.addEventListener("change", async () => {
    const fecha = fechaInput.value;
    if (!fecha) return;

    try {
      const res = await fetch(`${proxyUrl}${googleScriptUrl}?fecha=${fecha}`);
      const data = await res.json();

      generarHoras();

      if (data.ocupadas && Array.isArray(data.ocupadas)) {
        data.ocupadas.forEach(horaOcupada => {
          const opt = [...horaSelect.options].find(o => o.value === horaOcupada);
          if (opt) {
            opt.disabled = true;
            opt.textContent += " (Ocupada)";
          }
        });
      }
    } catch (err) {
      console.error("❌ Error al obtener disponibilidad:", err);
      alert("Error al verificar disponibilidad. Intenta nuevamente más tarde.");
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

    if (horaSelect.selectedOptions[0].disabled) {
      alert("🚫 Esta hora ya está ocupada.");
      return;
    }

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
      } else {
        throw new Error(result.message || "Error al crear la cita.");
      }

    } catch (err) {
      console.error("❌ Error al enviar cita:", err);
      successMsg.style.display = "none";
      errorMsg.style.display = "block";
      alert("❌ No se pudo registrar la cita. Intenta nuevamente.");
    }
  });
});
