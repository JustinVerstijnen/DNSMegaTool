
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
            "MX": "Mail Exchange record used to route emails. More info: https://en.wikipedia.org/wiki/Mail_exchange_record",
            "SPF": "Sender Policy Framework: prevents spoofing. More info: https://en.wikipedia.org/wiki/Sender_Policy_Framework",
            "DKIM": "DomainKeys Identified Mail: verifies message integrity. More info: https://en.wikipedia.org/wiki/DomainKeys_Identified_Mail",
            "DMARC": "Domain-based Message Authentication, Reporting, and Conformance: improves email security. More info: https://en.wikipedia.org/wiki/DMARC"
        };
        // The rest of the function remains unchanged
    } catch (error) {
        console.error("Error:", error);
    }
}
