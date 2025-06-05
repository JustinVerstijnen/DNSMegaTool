
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

        for (const [type, record] of Object.entries(data)) {
            if (type === 'NS' || type === 'WHOIS') continue;

            const row = document.createElement("tr");
            const typeCell = document.createElement("td");
            typeCell.textContent = type;
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

        // NS records
        if (data.NS) {
            const nsBox = document.createElement("div");
            nsBox.className = "infobox";
            nsBox.innerHTML = "<h3>Nameservers:</h3><ul>" +
                data.NS.map(ns => `<li>${ns}</li>`).join("") + "</ul>";
            extraInfo.appendChild(nsBox);
        }

        // WHOIS records
        if (data.WHOIS) {
            const whoisBox = document.createElement("div");
            whoisBox.className = "infobox";
            if (data.WHOIS.error) {
                whoisBox.innerHTML = `<h3>Whois:</h3><p>${data.WHOIS.error}</p>`;
            } else {
                whoisBox.innerHTML = `<h3>Whois:</h3>
                <ul>
                    <li>Registrar: ${data.WHOIS.registrar}</li>
                    <li>Reseller: ${data.WHOIS.reseller || '-'}</li>
                    <li>Abuse contact: ${data.WHOIS.abuse_contact || '-'}</li>
                    <li>Date of Registration: ${data.WHOIS.creation_date}</li>
                    <li>Date of last change: ${data.WHOIS.updated_date}</li>
                </ul>`;
            }
            extraInfo.appendChild(whoisBox);
        }

    } catch (e) {
        console.error(e);
        alert("Er is iets misgegaan tijdens de lookup.");
    } finally {
        loader.style.display = "none";
    }
}
