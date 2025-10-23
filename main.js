// ✅ Inicializa EmailJS correctamente
(function() {
  emailjs.init("Xfy8rt5BbNV_iG2CB"); // Tu Public Key (User ID)
})();

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("citaForm");
  const successMsg = document.getElementById("successMsg");
  const errorMsg = document.getElementById("errorMsg");
  const horaSelect = document.getElementById("hora");
  const fechaInput = document.getElementById("fecha");

  // 🕓 Generar horarios de 8 AM a 5 PM
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

  // 📤 Enviar formulario
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

    try {
      console.log("📧 Enviando correo con EmailJS...");

      // Enviar correo con EmailJS
      const emailResponse = await emailjs.send(
        "service_tp0xzhi",   // Service ID de EmailJS
        "template_6csycq9",  // Template ID de EmailJS
        {
          to_name: nombre,
          to_email: email,
          servicio,
          fecha,
          hora,
        }
      );
      console.log("✅ Correo enviado:", emailResponse.status, emailResponse.text);

      // 📅 Enviar datos al script de Google Apps Script
      console.log("📆 Enviando datos al calendario...");
      const response = await fetch("https://script.google.com/macros/s/AKfycbw_N6H9IPPmvRi-Utbcuw-kHK6EqZOX0LV5XUM1g8SGLkYCnUYF5j3rLm0vyCdNIVEOUw/exec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, email, servicio, fecha, hora }),
      });

      const result = await response.json();

      if (!result.success) throw new Error(result.error || "Error al crear evento");

      console.log("✅ Cita agendada correctamente en Google Calendar.");
      successMsg.style.display = "block";
      errorMsg.style.display = "none";
      form.reset();

    } catch (err) {
      console.error("❌ Error detallado:", err);
      successMsg.style.display = "none";
      errorMsg.style.display = "block";
      alert("Ocurrió un error al enviar la cita. Intenta de nuevo.");
    }
  });
});
