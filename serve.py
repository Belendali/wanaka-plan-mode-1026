import http.server, socketserver, os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(('127.0.0.1', 8468), http.server.SimpleHTTPRequestHandler) as h:
    h.serve_forever()
