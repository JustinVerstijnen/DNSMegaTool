
import azure.functions as func
import logging
import os
from jinja2 import Environment, FileSystemLoader
from dns_utils import get_txt_record, get_ns_servers, get_mx_record, get_ds_record, check_dnskey_exists

app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)

# Jinja2 setup
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
templates_dir = os.path.join(BASE_DIR, 'templates')
env = Environment(loader=FileSystemLoader(templates_dir))

@app.route(route="/", methods=["GET"])
def main(req: func.HttpRequest) -> func.HttpResponse:
    domain = req.params.get("domain")
    context = { "domain": None }

    if domain:
        context.update({
            "domain": domain,
            "txt": get_txt_record(domain),
            "ns": get_ns_servers(domain),
            "mx": get_mx_record(domain),
            "ds": get_ds_record(domain),
            "dnskey": check_dnskey_exists(domain)
        })

    template = env.get_template("main.html")
    rendered_html = template.render(context)
    return func.HttpResponse(rendered_html, mimetype="text/html")

# Static file handler (voor CSS)
@app.route(route="/static/{filename}", methods=["GET"])
def static_files(req: func.HttpRequest) -> func.HttpResponse:
    filename = req.route_params.get("filename")
    static_path = os.path.join(BASE_DIR, 'static', filename)

    if not os.path.exists(static_path):
        return func.HttpResponse("Not Found", status_code=404)

    with open(static_path, "r") as f:
        content = f.read()

    return func.HttpResponse(content, mimetype="text/css")
