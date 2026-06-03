#!/usr/bin/env python3
"""Serve the bunker calculator web app locally."""

import http.server
import socketserver
from pathlib import Path

WEB_DIR = Path(__file__).resolve().parent.parent / "web"
PORT = 8080


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(WEB_DIR), **kwargs)


if __name__ == "__main__":
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Bunker calculator: http://localhost:{PORT}")
        httpd.serve_forever()
