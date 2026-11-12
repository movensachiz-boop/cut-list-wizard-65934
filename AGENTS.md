# Project rules

- License-scoped client notices mount inside LicenseGate only after successful validation; recipient rules and acknowledgement guards live in a tested helper so unrelated customers are not interrupted.
- Downloadable notice images use Lovable Assets pointers; acknowledgement follows a successful file fetch and browser download request, not a claim that the browser has saved the file.
- License validation returns a global access lock when every existing license is suspended; the gate checks this without a stored key so a cleared browser cannot miss the denial screen.