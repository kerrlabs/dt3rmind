# What your app needs to do to run on our platform

**For our first early adopter. Written to be handed to an AI coding assistant.**

Paste this into your assistant's context before you start building. It is only the
contract your container has to meet. We handle getting it onboarded and deployed, so
nothing here asks you to run platform commands.

> **This platform is new and this document will change.** If something here turns out
> to be wrong, that is our bug and we want to hear about it.

---

## What you get, free

- **A URL**: `https://<your-app>.internal.netsmartdev.com`
- **Login already solved.** Okta sits in front of your app. Only authenticated
  Netsmart staff reach it. You write no login code, no sessions, no passwords.
- **Who the user is**, on every request (see Identity below).

## What you do not get

- **No database.** Nothing is provisioned. If you need to store data, tell us before
  you design around it.
- **No local disk.** Anything written to the filesystem is gone when your app
  restarts. This is the mistake that catches people hardest.
- **No background jobs, cron or timers.** Your app is not running when nobody is
  using it, so nothing scheduled inside it fires.
- **One container serves everyone.** No autoscaling yet.

---

## The thing that will surprise you: your app sleeps

After about 20 minutes with no requests, we shut your app down completely. The next
visitor gets a "waking up" page for roughly a minute, then lands on your app.

That is the point of the platform. Idle tools cost nothing.

**Three things that follow:**

1. **Start from nothing, every time.** No warm caches, no state carried between
   runs, no one-time setup.
2. **Expect to be killed**, with about 25 seconds of notice. Handle `SIGTERM`:
   finish in-flight requests and exit. Most web servers do this already.
3. **Nothing on local disk survives.**

### The one piece of platform-specific code you must write

Only applies if your app has a frontend that calls its own backend.

> If a `fetch` returns **HTTP 503** with a JSON body containing
> `{"status": "waking"}`, your backend slept underneath the open page. Do not show
> an error. Call `location.reload()`.

Reloading makes the browser do a normal page request, which we answer with the
waking page; it waits and then lands the user on your app. Without this, a tab left
open overnight shows a broken error the next morning.

```js
async function apiFetch(path, options) {
  const res = await fetch(path, options);
  if (res.status === 503) {
    let body = null;
    try { body = await res.clone().json(); } catch { /* not the waking shape */ }
    if (body && body.status === "waking") {
      location.reload();
      return null;
    }
  }
  return res;
}
```

Use it for **every** call your frontend makes to your own backend.

---

## The contract

Seven requirements. Your assistant can satisfy all of them.

### 1. Listen on the port from `APP_PORT`

**You choose the port.** Tell us what it is and we configure the platform around it.
Your container then reads it back from the `APP_PORT` environment variable, so there
is exactly one place the number lives and it cannot drift.

```python
port = int(os.environ["APP_PORT"])
```

**Pick something above 1024**, because your container runs as a non-root user and
cannot bind to low ports. 8000 or 8080 are fine.

### 2. Bind to `127.0.0.1` or `0.0.0.0`, either works

A sidecar container runs alongside your app inside the same task and shares its
network namespace, so `127.0.0.1` reaches you. Binding to localhost is slightly
better, because then nothing outside the task can reach your app directly at all.

### 3. Run as a non-root user

Set a `USER` in your Dockerfile. Ours use UID `10001`. This is why requirement 1
needs a port above 1024.

```dockerfile
USER 10001:10001
```

### 4. Answer a health check

Pick a path, return **HTTP 200** when your app is genuinely ready to serve, and tell
us what the path is. `/healthz` is the usual choice; the scaffold uses
`/api/healthz` because everything it serves lives under `/api`.

Return 200 only when you can actually handle requests. If you answer 200 while still
starting up, the platform sends real users to an app that is not ready.

### 5. Serve nothing under `/_iavm/`

That prefix is the platform's. Your own route there will break your app's health
checking and its ability to sleep.

### 6. Handle `SIGTERM` and exit promptly

Drain in-flight requests, then exit, within about 25 seconds.

### 7. Build for ARM64

We run on AWS Graviton, not x86. On an Apple Silicon Mac you are already on ARM. On
an Intel machine, be explicit:

```dockerfile
# or: podman build --platform linux/arm64 ...
```

We check this when we onboard your image and will tell you if it is wrong.

---

## Identity: who is using your app

Okta authenticates every request before it reaches you. You receive headers:

| Header | Contains |
|---|---|
| `x-amzn-oidc-identity` | The user's unique Okta ID. Stable forever. **Use this.** |
| `x-amzn-oidc-data` | A token whose payload carries `email` and `sub` |

**You get exactly two useful facts: the user's email and their unique ID.**

**You do not get group membership.** If your tool needs "admins can do X," you will
have to keep your own list. Talk to us first, because we are solving this at the
platform level and you should not solve it twice.

Store the **ID**, never the email, when recording who did something. Email addresses
get reassigned when people leave.

```python
user_id = request.headers["x-amzn-oidc-identity"]
```

You do not need to verify anything. Two things stand between the public internet and
your container, and both are ours to run: only our load balancer can reach your
container, and it does not forward a request until Okta has authenticated the user. On
some apps a platform sidecar also checks and rewrites these identity headers before your
app sees them, so they are verified for you. Either way the rule for you is the same:
read the headers, trust them, write no verification code.

---

## A starting point, if you want one

`scaffold/` in this repository is a working app that already satisfies six of the
seven: React frontend, Python FastAPI backend, one container, the waking rule
handled, a health endpoint at `/api/healthz`, non-root as UID 10001, and the port
read from `APP_PORT`.

The seventh, ARM64, depends on where you build rather than on the scaffold. On an
Apple Silicon Mac you get it automatically. On an Intel machine, pass
`--platform linux/arm64` to your build.

```bash
cp -r scaffold/ ~/my-tool
```

You are equally welcome to use any language or framework. Anything that meets the
seven requirements works, and that path is not second class. You just write the
waking wrapper yourself.

---

## When something goes wrong

| What you see | Almost always means |
|---|---|
| Stuck on "waking up" forever | Your health check is not answering 200. Wrong port, wrong health path, or answering before ready. |
| Container will not start | Built for x86 instead of ARM64, or trying to bind a port below 1024 as a non-root user. |
| Worked yesterday, broken today | You stored something on local disk. It slept. |
| Frontend errors after a tab sat open | The 503 waking rule is not implemented. |
| Health checks pass but the app misbehaves | Something of yours is served under `/_iavm/`. |
| Requests cut off during a restart | `SIGTERM` is not handled. |

**Tell us when you are stuck.** We can see the container logs, whether it started,
and whether it ever answered a health check. Do not burn an afternoon guessing.

---

## A prompt for your assistant

```
I am building an internal web tool to run on the Internal App Vending Machine.
Read the contract above, then build to it:

- Read the listening port from the APP_PORT environment variable; do not hardcode it
- Bind 127.0.0.1 (a sidecar in the same network namespace proxies to us)
- Run as non-root (USER 10001:10001); the port must be above 1024
- Serve a health endpoint returning 200 only when genuinely ready
- Serve nothing under /_iavm/
- Store nothing on local disk; the filesystem does not survive a restart
- Handle SIGTERM by draining and exiting within 25 seconds
- Build the container for linux/arm64
- If there is a frontend calling our own backend, route every call through a wrapper
  that calls location.reload() on HTTP 503 with body {"status":"waking"}
- Identify the user from the x-amzn-oidc-identity header; write no login code
- Assume no database and no group or role information

Then build: <describe your tool>
```

---

## Tell us early if any of these apply

They change what you should build:

- **You need to store data.** The big one. There is no database yet.
- **You need to reach an existing system**, a database, API or file share. That needs
  network work from us, and network access is not the same as permission to read the
  data. Both have to be arranged.
- **You need roles or permissions** beyond "any logged-in staff member."
- **Waiting a minute for the app to wake** is a problem for your users.
- **You expect heavy concurrent use.**

---

## What we want back

You are the first app on this platform. Most useful to us:

- Anything that surprised you, especially where this document was wrong.
- Where you or your assistant got stuck, and for how long.
- Anything you expected to exist and did not.

Blunt beats polite. The sleeping behavior is unusual and we want to know where it
gets in your way.

---

**Version**: 2026-10-21. Early, and expected to change.
