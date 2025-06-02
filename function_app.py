import azure.functions as func
import json

app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)

def perform_dns_lookup(domain):
    return {
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

@app.route(route="function_app")
def dns_megatool(req: func.HttpRequest) -> func.HttpResponse:
    domain = req.params.get("domain")

    if not domain:
        return func.HttpResponse("Please pass a domain parameter.", status_code=400)

    data = perform_dns_lookup(domain)
    return func.HttpResponse(json.dumps(data), mimetype="application/json")
