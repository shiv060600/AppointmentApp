const appointmentForm = document.getElementById('appointmentForm')
const availableSlotList = document.getElementById('availableSlotList')

appointmentForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(appointmentForm);
    const appointmentData = {};
    formData.forEach((value, key) => {
        appointmentData[key] = value;
    });

    try {
        const response = await fetch('http://localhost:3000/appointments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(appointmentData)
        });

        const result = await response.json();
        alert("Appointment Created. Appointment ID: " + result.appointmentId);
        appointmentForm.reset();
    } catch (error) {
        console.error('Error:', error);
        alert("An error has occurred. Please view the console.");
    }
});

async function displayAvailableSlots(companyId, serviceId, date) {
    if (!companyId || !serviceId || !date) return;

    try {
        const response = await fetch(`http://localhost:3000/availability?companyId=${companyId}&serviceId=${serviceId}&date=${date}`);
        const result = await response.json();

        availableSlotsList.innerHTML = '';
        result.availableSlots.forEach(slot => {
            const li = document.createElement('li');
            li.textContent = slot;
            availableSlotsList.appendChild(li);
        });
    } catch (error) {
        console.error('Error:', error);
        alert("Error fetching available slots. Please view the console.");
    }
}

document.getElementById('companyId').addEventListener('change', updateAvailability);
document.getElementById('serviceId').addEventListener('change', updateAvailability);
document.getElementById('date').addEventListener('change', updateAvailability);

function updateAvailability() {
    const companyId = document.getElementById('companyId').value;
    const serviceId = document.getElementById('serviceId').value;
    const date = document.getElementById('date').value;
    displayAvailableSlots(companyId, serviceId, date);
}