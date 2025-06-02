import azure.functions as func

app = func.FunctionApp()

@app.route(route="ping")
def ping(req: func.HttpRequest) -> func.HttpResponse:
    return func.HttpResponse("pong")
