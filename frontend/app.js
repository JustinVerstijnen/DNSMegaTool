
let lookupInProgress = false;

document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("domainInput").focus();

    document.getElementById("domainInput").addEventListener("keydown", function(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            checkDomain();
        }
    });

    document.getElementById("checkBtn").addEventListener("click", function() {
        checkDomain();
    });
});

async function checkDomain() {
    if (lookupInProgress) {
        return;
    }
    lookupInProgress = true;

    const domain = document.getElementById("domainInput").value;
    const loader = document.getElementById("loader");
    const checkBtn = document.getElementById("checkBtn");
    const resultsSection = document.getElementById("resultsSection");
    const exportBtn = document.getElementById("exportBtn");
    const tbody = document.querySelector("#resultTable tbody");
    const extraInfo = document.getElementById("extraInfo");

    // Reset output
    tbody.innerHTML = "";
    extraInfo.innerHTML = "";
    resultsSection.style.display = "none";
    exportBtn.style.display = "none";

    // Disable button and show loader
    checkBtn.disabled = true;
    loader.style.display = "block";

    try {
        const response = await fetch(`/api/lookup?domain=${encodeURIComponent(domain)}`);
        const data = await response.json();

        if (data.error) {
            alert(data.error);
        } else {
            displayResults(data);
        }
    } catch (error) {
        alert("Er is een fout opgetreden bij het uitvoeren van de lookup.");
        console.error(error);
    } finally {
        loader.style.display = "none";
        lookupInProgress = false;
        checkBtn.disabled = false;
    }
}
