"""Local preview server for PickColor (development only; not part of the site).

Why not plain `python -m http.server`?
  * It serves whatever folder the terminal is in, so starting it from the wrong
    folder gives "404 File not found" or a different copy of the site.
  * It sends no Cache-Control header, so browsers may keep showing an old
    version of index.html, CSS or JS after you change them.

This script always serves the project folder (the parent of tools/), from any
working directory, and tells the browser not to cache anything.

Usage (from anywhere):
    python tools/serve.py          # http://localhost:8000/
    python tools/serve.py 8080     # another port
"""

import functools
import http.server
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    handler = functools.partial(NoCacheHandler, directory=str(ROOT))
    with http.server.ThreadingHTTPServer(("127.0.0.1", port), handler) as server:
        print(f"Serving {ROOT} at http://localhost:{port}/ (no caching). Press Ctrl+C to stop.")
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print("\nStopped.")


if __name__ == "__main__":
    main()
