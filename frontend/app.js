
async function checkDomain() {
    const domain = document.getElementById("domainInput").value;
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

    try {
        const response = await fetch(`/api/lookup?domain=${domain}`);
        const data = await response.json();

        const tooltips = {
            "MX": "Mail Exchange record",
            "SPF": "Sender Policy Framework",
            "DKIM": "DomainKeys Identified Mail",
            "DMARC": "Domain-based Message Authentication",
            "MTA-STS": "Mail Transfer Agent Strict Transport Security",
            "DNSSEC": "Domain Name System Security Extensions"
        };

        for (const [type, record] of Object.entries(data)) {
            if (type === 'NS' || type === 'WHOIS') continue;

            const row = document.createElement("tr");
            const typeCell = document.createElement("td");
            typeCell.innerHTML = `<b title="${tooltips[type] || ''}">${type}</b>`;
            const statusCell = document.createElement("td");
            statusCell.textContent = record.status ? "✅" : "❌";

            const valueCell = document.createElement("td");
            if (Array.isArray(record.value)) {
                const list = document.createElement("ul");
                record.value.forEach(val => {
                    const li = document.createElement("li");
                    li.textContent = val;
                    list.appendChild(li);
                });
                valueCell.appendChild(list);
            } else {
                valueCell.textContent = record.value;
            }

            row.appendChild(typeCell);
            row.appendChild(statusCell);
            row.appendChild(valueCell);
            tbody.appendChild(row);
        }

        if (data.NS) {
            const nsBox = document.createElement("div");
            nsBox.className = "infobox";
            nsBox.innerHTML = `<h3>Nameservers for ${domain}:</h3><ul>` +
                data.NS.map(ns => `<li>${ns}</li>`).join("") + "</ul>";
            extraInfo.appendChild(nsBox);
        }

        if (data.WHOIS) {
            const whoisBox = document.createElement("div");
            whoisBox.className = "infobox";
            if (data.WHOIS.error) {
                whoisBox.innerHTML = `<h3>WHOIS Information for ${domain}:</h3><p>${data.WHOIS.error}</p>`;
            } else {
                const registrar = data.WHOIS.registrar || 'Not found';
                const creation = data.WHOIS.creation_date || 'Not found';
                whoisBox.innerHTML = `<h3>WHOIS Information for ${domain}:</h3>
                <ul>
                    <li>Registrar: ${registrar}</li>
                    <li>Date of Registration: ${creation}</li>
                </ul>`;
            }
            extraInfo.appendChild(whoisBox);
        }

    } catch (e) {
        console.error(e);
        alert("Er is iets misgegaan tijdens de lookup.");
    } finally {
        loader.style.display = "none";
        resultsSection.style.display = "block";
        exportBtn.style.display = "inline-block";
    }
}

function exportHTML() {
    const reportSection = document.getElementById("resultsSection").innerHTML;
    const exportCSS = `
body { font-family: 'Segoe UI', sans-serif; background:#f2f2f2; margin:0;padding:20px; }
.container { background:#fff; padding:20px; border-radius:8px; max-width:900px; margin:auto; box-shadow: 0 0 15px rgba(0,0,0,0.1); }
h1 { text-align:center; margin-top:10px; }
h3 { margin-top:20px; }
table { width:100%; border-collapse: separate; border-spacing: 0; border-radius:10px; overflow:hidden; margin-top:20px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
thead { background-color:#f9f9f9; }
th, td { padding:15px; text-align:left; vertical-align:top; word-break:break-word; max-width:600px; border: 1px solid #ddd; }
tbody tr:nth-child(even) { background-color: #f6f6f6; }
.infobox { background:#e0f0ff; padding:10px; border-radius:5px; margin-top:10px; border: 1px solid #aad; }`;

    const htmlContent = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>DNS MEGAtool Export</title><style>${exportCSS}</style></head><body><div class="container">
<h1>DNS MEGAtool Export</h1>${reportSection}</div></body></html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "dns-megatool-report.html";
    a.click();
    URL.revokeObjectURL(url);
}

document.getElementById("domainInput").addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
        document.getElementById("checkBtn").click();
    }
});
