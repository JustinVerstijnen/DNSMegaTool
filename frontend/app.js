
async function checkDomain() {
    const domain = document.getElementById("domainInput").value;
    const loader = document.getElementById("loader");
    const tbody = document.querySelector("#resultTable tbody");
    const extraInfo = document.getElementById("extraInfo");
    
    loader.style.display = "block";
    tbody.innerHTML = "";
    extraInfo.innerHTML = "";

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
        loader.style.display = "none"; document.getElementById("resultsSection").style.display = "block"; document.getElementById("exportBtn").style.display = "inline-block";
    }
}

// Enter key activeert check
document.getElementById("domainInput").addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
        document.getElementById("checkBtn").click();
    }
});


function exportHTML() {
    const htmlContent = document.documentElement.outerHTML;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "dns-megatool-report.html";
    a.click();
    URL.revokeObjectURL(url);
}
