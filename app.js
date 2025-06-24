
let currentDomain = "";

document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("domainInput").focus();

    document.getElementById("domainInput").addEventListener("keydown", function(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            checkDomain();
        }
    });

    document.getElementById("checkBtn").addEventListener("click", function(event) {
        event.preventDefault();
        checkDomain();
    });
});

async function checkDomain() {
    const domain = document.getElementById("domainInput").value;
    currentDomain = domain;

    const loader = document.getElementById("loader");
    const resultsSection = document.getElementById("resultsSection");
    const exportBtn = document.getElementById("exportBtn");
    const tbody = document.querySelector("#resultTable tbody");
    const extraInfo = document.getElementById("extraInfo");

    tbody.innerHTML = "";
    extraInfo.innerHTML = "";
    resultsSection.style.display = "none";
    exportBtn.style.display = "none";
    loader.style.display = "flex";

    if (!domain) {
        alert("Please enter a valid domain.");
        return;
    }

    try {
        const response = await fetch(`/api/lookup?domain=${domain}`);
        const data = await response.json();

        for (const [type, record] of Object.entries(data)) {
            const row = document.createElement("tr");
            row.innerHTML = `<td>${type}</td><td>${record.status}</td><td>${record.value}</td>`;
            tbody.appendChild(row);
        }

        loader.style.display = "none";
        resultsSection.style.display = "block";
        exportBtn.style.display = "inline-block";
    } catch (err) {
        loader.style.display = "none";
        alert("Error fetching data");
    }
}

async function exportHTML() {
    const tableHTML = document.getElementById("resultTable").outerHTML;
    const extraInfoHTML = document.getElementById("extraInfo").innerHTML;

    try {
        const response = await fetch("export-template.html");
        let template = await response.text();

        template = template.replace(/{{domain}}/g, currentDomain);
        template = template.replace(/{{report_content}}/g, tableHTML + extraInfoHTML);

        const blob = new Blob([template], { type: "text/html" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `dns-report-${currentDomain}.html`;
        a.click();

        URL.revokeObjectURL(url);
    } catch (err) {
        alert("Export mislukt: " + err.message);
    }
}
