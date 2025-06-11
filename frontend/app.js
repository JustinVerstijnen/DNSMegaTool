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
            "MX": "Mail Exchange record <a href='https://en.wikipedia.org/wiki/Mail_exchange_record' target='_blank'>Learn more</a>",
            "SPF": "Sender Policy Framework <a href='https://en.wikipedia.org/wiki/Sender_Policy_Framework' target='_blank'>Learn more</a>",
            "DKIM": "DomainKeys Identified Mail <a href='https://en.wikipedia.org/wiki/DomainKeys_Identified_Mail' target='_blank'>Learn more</a>",
            "DMARC": "Domain-based Message Authentication, Reporting & Conformance <a href='https://en.wikipedia.org/wiki/DMARC' target='_blank'>Learn more</a>",
            "MTA-STS": "Mail Transfer Agent Strict Transport Security <a href='https://en.wikipedia.org/wiki/MTA-STS' target='_blank'>Learn more</a>",
            "DNSSEC": "Domain Name System Security Extensions <a href='https://en.wikipedia.org/wiki/DNSSEC' target='_blank'>Learn more</a>"
        };

        for (const [type, record] of Object.entries(data)) {
            if (type === 'NS' || type === 'WHOIS') continue;

            const row = document.createElement("tr");
            const typeCell = document.createElement("td");
            // We make the entire tooltip a clickable link
            typeCell.innerHTML = `<a href="${tooltips[type]}" class="tooltip" target="_blank">${type}</a>`;
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

        let allGreen = true;
        for (const [type, record] of Object.entries(data)) {
            if (type === 'NS' || type === 'WHOIS') continue;
            if (!record.status) {
                allGreen = false;
                break;
            }
        }
        if (allGreen) {
            confetti({
                particleCount: 300,
                spread: 200,
                origin: { y: 0.6 }
            });
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
        alert("Something went wrong while looking up your domain..");
    } finally {
        loader.style.display = "none";
        resultsSection.style.display = "block";
        exportBtn.style.display = "inline-block";
    }
}
