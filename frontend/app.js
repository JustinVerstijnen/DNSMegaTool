
async function checkDomain() {
    const domain = document.getElementById("domainInput").value;
    const response = await fetch(`/api/lookup?domain=${domain}`);
    const data = await response.json();

    const tbody = document.querySelector("#resultTable tbody");
    tbody.innerHTML = "";

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
}
