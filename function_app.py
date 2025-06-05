
import azure.functions as func
import json
import dns.resolver
import dns.exception
import requests

app = func.FunctionApp()

@app.route(route="lookup")
def dns_lookup(req: func.HttpRequest) -> func.HttpResponse:
    domain = req.params.get('domain')
    if not domain:
        return func.HttpResponse("Please pass a domain on the query string", status_code=400)

    results = {}

    try:
        mx_records = dns.resolver.resolve(domain, 'MX')
        mx_valid = len(mx_records) > 0
        results['MX'] = {
            "status": mx_valid,
            "value": [str(r.exchange) for r in mx_records]
        }
    except Exception as e:
        results['MX'] = {"status": False, "value": str(e)}

    try:
        txt_records = dns.resolver.resolve(domain, 'TXT')
        spf_records = []
        for r in txt_records:
            for b in r.strings:
                record = b.decode('utf-8')
                if record.startswith('v=spf1'):
                    spf_records.append(record)

        valid_spf = any('-all' in r for r in spf_records)
        results['SPF'] = {"status": valid_spf, "value": spf_records}
    except Exception as e:
        results['SPF'] = {"status": False, "value": str(e)}

    try:
        dmarc_domain = "_dmarc." + domain
        dmarc_records = dns.resolver.resolve(dmarc_domain, 'TXT')
        dmarc_txt = [b.decode('utf-8') for r in dmarc_records for b in r.strings]
        valid_dmarc = any("p=reject" in r for r in dmarc_txt)
        results['DMARC'] = {"status": valid_dmarc, "value": dmarc_txt}
    except Exception as e:
        results['DMARC'] = {"status": False, "value": str(e)}

    try:
        mta_sts_domain = "_mta-sts." + domain
        mta_sts_records = dns.resolver.resolve(mta_sts_domain, 'TXT')
        mta_sts_dns_ok = len(mta_sts_records) > 0

        well_known_url = f"https://{domain}/.well-known/mta-sts.txt"
        r = requests.get(well_known_url, timeout=5)
        mta_sts_http_ok = r.status_code == 200

        valid_mta_sts = mta_sts_dns_ok and mta_sts_http_ok
        results['MTA-STS'] = {
            "status": valid_mta_sts,
            "value": f"DNS: {mta_sts_dns_ok}, HTTP: {mta_sts_http_ok}"
        }
    except Exception as e:
        results['MTA-STS'] = {"status": False, "value": str(e)}

    try:
        ds_records = dns.resolver.resolve(domain, 'DS')
        dnssec_valid = len(ds_records) > 0
        results['DNSSEC'] = {"status": dnssec_valid, "value": [str(r) for r in ds_records]}
    except Exception as e:
        results['DNSSEC'] = {"status": False, "value": str(e)}

    return func.HttpResponse(
        json.dumps(results),
        mimetype="application/json"
    )
