"""Faux serveur de l'API Telegram pour tester le bot en local."""
import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

CALLS = []


class H(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def _send(self, obj, raw=None):
        body = raw if raw is not None else json.dumps(obj).encode()
        self.send_response(200)
        self.send_header("content-type", "application/json")
        self.send_header("content-length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == "/calls":
            return self._send(CALLS)
        if self.path == "/reset":
            CALLS.clear()
            return self._send({"ok": True})
        if self.path.startswith("/file/"):
            if self.path.endswith(".csv"):
                return self._send(None, b"telephone;nom;formule;fin\n0505050505;Diallo C.;annee;2027-03-31\n")
            return self._send(None, b"FAKEAUDIO")
        self._send({"ok": False})

    def do_POST(self):
        n = int(self.headers.get("content-length", 0))
        body = json.loads(self.rfile.read(n) or b"{}")
        method = self.path.rsplit("/", 1)[-1]
        CALLS.append({"method": method, "body": body})
        result = True
        if method == "createChatInviteLink":
            result = {"invite_link": "https://t.me/+INVITE" + str(len(CALLS))}
        elif method == "getChatMember":
            result = {"status": "creator" if body.get("user_id") == 1 else "member", "user": {"id": body.get("user_id")}}
        elif method == "getFile":
            fid = body.get("file_id", "")
            result = {"file_path": "docs/liste.csv" if fid == "CSV1" else "voice/f.oga"}
        elif method == "sendMessage":
            result = {"message_id": len(CALLS)}
        self._send({"ok": True, "result": result})


ThreadingHTTPServer(("127.0.0.1", 8789), H).serve_forever()
