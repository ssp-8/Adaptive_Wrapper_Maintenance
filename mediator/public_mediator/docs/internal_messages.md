# Internal Message Specification: Mediator Communication

This document defines the **Internal Message Format**—the standardized JSON object passed between the **Public Mediator Service** (which handles external client requests) and the **Internal Mediator/Query Translator Service**.

The primary purpose of this message is to abstract the complexities of the client's HTTP request (URL query parameters, headers) into a clean, singular payload. This allows the Internal Mediator to efficiently perform **query translation** (to the Common Query Language or CQL), **decomposition**, and **routing**.

---

## Internal Message Schema

The internal message structure serves as a clean, reliable contract for all data flowing between the two Mediator stages.

```json
{
  "http_method": "GET|POST|PUT|DELETE",
  "entity": "User|Article|UserAction, etc.",
  "query": "firstName='Sumeet' AND age>25",
  "sort": "price:DESC",
  "limit": "100",
  "payload": "{ 'firstName': 'Sumeet', 'age': 26 }",
  "req_meta": {
    "req_ip": "IP address of the requester",
    "req_device_type": "Device type of the requester",
    "req_browser": "Browser info of the requester",
    "req_user_token": "Authentication token of the requester"
  }
}
```
