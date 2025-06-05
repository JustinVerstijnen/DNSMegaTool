
async function checkDomain() {
    const domain = document.getElementById("domainInput").value;
    const loader = document.getElementById("loader");
    const tbody = document.querySelector("#resultTable tbody");
    
    loader.style.display = "block";
    tbody.innerHTML = "";

    try {
        const response = await fetch(`/api/lookup?domain=${domain}`);
        const data = await response.json();

        for (const [type, record] of Object.entries(data)) {
            const row = document.createElement("tr");

            const typeCell = document.createElement("td");
            typeCell.textContent = type;

            const statusCell = document.createElement("td");
            statusCell.textContent = record.status ? "✅" : "❌";

            const valueCell = document.createElement("td");
            valueCell.textContent = Array.isArray(record.value) ? record.value.join(', ') : record.value;

            row.appendChild(typeCell);
            row.appendChild(statusCell);
            row.appendChild(valueCell);

            tbody.appendChild(row);
        }
    } catch (e) {
        console.error(e);
        alert("Er is iets misgegaan tijdens de lookup.");
    } finally {
        loader.style.display = "none";
    }
}
