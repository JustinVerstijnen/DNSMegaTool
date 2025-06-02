import azure.functions as func

app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)

@app.route(route="dnsmegatool_api")
def ping(req: func.HttpRequest) -> func.HttpResponse:
    return func.HttpResponse("Hoi!")
