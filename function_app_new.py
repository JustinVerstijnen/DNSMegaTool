
import azure.functions as func
import json
import os

# Inladen van het template-bestand
def load_template():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    template_path = os.path.join(current_dir, "templates", "index.html")
    with open(template_path, "r", encoding="utf-8") as f:
        return f.read()

def main(req: func.HttpRequest) -> func.HttpResponse:
    domain = req.params.get('domain')

    if not domain:
        # Geen domein opgegeven: return homepage
        html_content = load_template()
        return func.HttpResponse(html_content, mimetype="text/html")

    # Anders logica uitvoeren (lookup DNS records)
    # Hier kun je jouw bestaande logica behouden zoals je nu had.
    # Voor demo-doeleinden returnen we nu een dummy JSON response.
    dummy_data = {
        "domain": domain,
        "MX": ["mx.example.com"],
        "SPF": ["v=spf1 include:_spf.example.com -all"],
        "DKIM": {"record": ["v=DKIM1; k=rsa; p=abc123"], "valid_selector": "selector1"},
        "DMARC": ["v=DMARC1; p=reject"],
        "MTA_STS": ["v=STSv1; id=2021062500"],
        "DNSSEC": True,
        "DS": ["12345 8 2 abcdef..."],
        "NS": ["ns1.example.com", "ns2.example.com"]
    }
    return func.HttpResponse(json.dumps(dummy_data), mimetype="application/json")
