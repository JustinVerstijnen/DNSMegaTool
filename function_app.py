
import azure.functions as func
import json
import dns.resolver
import dns.exception
import requests
import whois

app = func.FunctionApp()

def record_not_found(record_type, domain):
    return f"{record_type} record not found: {domain}"

@app.route(route="lookup")
def dns_lookup(req: func.HttpRequest) -> func.HttpResponse:
    domain = req.params.get('domain')
    if not domain:
        return func.HttpResponse("Please pass a domain on the query string", status_code=400)

    results = {}

    # MX lookup
    try:
        mx_records = dns.resolver.resolve(domain, 'MX')
        mx_valid = len(mx_records) > 0
        results['MX'] = {
            "status": mx_valid,
            "value": [str(r.exchange) for r in mx_records]
        }
    except (dns.resolver.NoAnswer, dns.resolver.NXDOMAIN):
        results['MX'] = {"status": False, "value": record_not_found("MX", domain)}
    except Exception as e:
        results['MX'] = {"status": False, "value": str(e)}

    # SPF lookup (TXT record)
    try:
        txt_records = dns.resolver.resolve(domain, 'TXT')
        spf_records = []
        for r in txt_records:
            full_record = ''.join([b.decode('utf-8') for b in r.strings])
            if full_record.startswith('v=spf1'):
                spf_records.append(full_record)

        if spf_records:
            valid_spf = any('-all' in r for r in spf_records)
            results['SPF'] = {"status": valid_spf, "value": spf_records}
        else:
            results['SPF'] = {"status": False, "value": record_not_found("SPF", domain)}
    except (dns.resolver.NoAnswer, dns.resolver.NXDOMAIN):
        results['SPF'] = {"status": False, "value": record_not_found("SPF", domain)}
    except Exception as e:
        results['SPF'] = {"status": False, "value": str(e)}

    # DKIM lookup
    try:
        selectors = ['selector1', 'selector2']
        dkim_results = []
        dkim_valid = True

        for selector in selectors:
            dkim_domain = f"{selector}._domainkey.{domain}"
            try:
                dkim_records = dns.resolver.resolve(dkim_domain, 'TXT')
                dkim_txt = [b.decode('utf-8') for r in dkim_records for b in r.strings]
                dkim_results.append(f"{selector}: {dkim_txt[0]}")
            except (dns.resolver.NoAnswer, dns.resolver.NXDOMAIN):
                dkim_results.append(f"{selector}: DKIM record not found: {dkim_domain}")
                dkim_valid = False
            except Exception as e:
                dkim_results.append(f"{selector}: {str(e)}")
                dkim_valid = False

        results['DKIM'] = {"status": dkim_valid, "value": dkim_results}
    except Exception as e:
        results['DKIM'] = {"status": False, "value": str(e)}

    # DMARC lookup
    try:
        dmarc_domain = "_dmarc." + domain
        dmarc_records = dns.resolver.resolve(dmarc_domain, 'TXT')
        dmarc_txt = ["".join([b.decode("utf-8") for b in rr.strings]) for rr in dmarc_records]

        valid_dmarc = any("p=reject" in record for record in dmarc_txt)
        results['DMARC'] = {"status": valid_dmarc, "value": dmarc_txt}
    except (dns.resolver.NoAnswer, dns.resolver.NXDOMAIN):
        results['DMARC'] = {"status": False, "value": record_not_found("DMARC", dmarc_domain)}
    except Exception as e:
        results['DMARC'] = {"status": False, "value": str(e)}

    # MTA-STS lookup met strictere validatie
    try:
        mta_sts_domain = "_mta-sts." + domain
        try:
            mta_sts_records = dns.resolver.resolve(mta_sts_domain, 'TXT')
            mta_sts_dns_ok = True
        except (dns.resolver.NoAnswer, dns.resolver.NXDOMAIN):
            mta_sts_dns_ok = False
            results['MTA-STS'] = {"status": False, "value": record_not_found("MTA-STS", mta_sts_domain)}
            mta_sts_dns_ok = None  # Stop verdere verwerking

        if mta_sts_dns_ok is not None:
            try:
                well_known_url = f"https://{domain}/.well-known/mta-sts.txt"
                fallback_url = f"https://mta-sts.{domain}/.well-known/mta-sts.txt"
                r = requests.get(well_known_url, timeout=5)
                mta_sts_http_ok = r.status_code == 200
                if not mta_sts_http_ok:
                    try:
                        r2 = requests.get(fallback_url, timeout=5)
                        mta_sts_http_ok = r2.status_code == 200
                    except:
                        mta_sts_http_ok = False
            except:
                mta_sts_http_ok = False

            # STRIKTE VALIDATIE: beide moeten slagen
            mta_sts_valid = mta_sts_dns_ok and mta_sts_http_ok
            results['MTA-STS'] = {
                "status": mta_sts_valid,
                "value": f"DNS: {mta_sts_dns_ok}, HTTP: {mta_sts_http_ok}"
            }
    except Exception as e:
        results['MTA-STS'] = {"status": False, "value": str(e)}

    # DNSSEC lookup
    try:
        ds_records = dns.resolver.resolve(domain, 'DS')
        dnssec_valid = len(ds_records) > 0
        ds_values = [str(r) for r in ds_records]
        results['DNSSEC'] = {"status": dnssec_valid, "value": ds_values}
    except (dns.resolver.NoAnswer, dns.resolver.NXDOMAIN):
        results['DNSSEC'] = {"status": False, "value": record_not_found("DNSSEC", domain)}
    except Exception as e:
        results['DNSSEC'] = {"status": False, "value": str(e)}

    # NS lookup
    try:
        ns_records = dns.resolver.resolve(domain, 'NS')
        ns_list = [str(r.target) for r in ns_records]
        results['NS'] = ns_list
    except:
        results['NS'] = []

    # WHOIS lookup
    try:
        whois_data = whois.whois(domain)
        results['WHOIS'] = {
            "registrar": whois_data.registrar,
            "creation_date": str(whois_data.creation_date)
        }
    except Exception as e:
        results['WHOIS'] = {"error": str(e)}

    return func.HttpResponse(json.dumps(results), mimetype="application/json")
