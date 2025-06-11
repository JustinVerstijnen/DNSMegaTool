
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

        // Tooltips for MX, SPF, DKIM, and DMARC
        const tooltips = {
            "MX": "Mail Exchange record used to route emails. More info: https://en.wikipedia.org/wiki/Mail_exchange_record",
            "SPF": "Sender Policy Framework: prevents spoofing. More info: https://en.wikipedia.org/wiki/Sender_Policy_Framework",
            "DKIM": "DomainKeys Identified Mail: verifies message integrity. More info: https://en.wikipedia.org/wiki/DomainKeys_Identified_Mail",
            "DMARC": "Domain-based Message Authentication, Reporting, and Conformance: improves email security. More info: https://en.wikipedia.org/wiki/DMARC"
        };

        // Example of adding results dynamically (based on the actual data structure)
        Object.keys(data).forEach(record => {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            const text = document.createTextNode(record);
            cell.appendChild(text);

            // Add tooltip if the record matches a key in the tooltips object
            if (tooltips[record]) {
                cell.innerHTML = `<span title="${tooltips[record]}">${record}</span>`;
            }

            row.appendChild(cell);
            tbody.appendChild(row);
        });

        // After the table is populated, we call the function to add tooltips to the results
        addTooltipsToResults();
    } catch (error) {
        console.error("Error:", error);
    }
}

// Dynamically add the tooltips when the results are populated in the table
function addTooltipsToResults() {
    const rows = document.querySelectorAll("#resultTable tbody tr");
    rows.forEach(row => {
        row.querySelectorAll("td").forEach(cell => {
            const cellText = cell.innerText.trim();
            const tooltips = {
                "MX": "Mail Exchange record used to route emails. More info: https://en.wikipedia.org/wiki/Mail_exchange_record",
                "SPF": "Sender Policy Framework: prevents spoofing. More info: https://en.wikipedia.org/wiki/Sender_Policy_Framework",
                "DKIM": "DomainKeys Identified Mail: verifies message integrity. More info: https://en.wikipedia.org/wiki/DomainKeys_Identified_Mail",
                "DMARC": "Domain-based Message Authentication, Reporting, and Conformance: improves email security. More info: https://en.wikipedia.org/wiki/DMARC"
            };
            if (tooltips[cellText]) {
                cell.innerHTML = `<span title="${tooltips[cellText]}">${cellText}</span>`;
            }
        });
    });
}
