# System Architecture

This document describes the platform at a high level. The diagrams use Mermaid.js.

## System context

```mermaid
flowchart LR
    Customer[Customer]
    Retail[Retail Partner]
    Admin[Administrator]
    Frontend[React and Vite Frontend]
    API[Node.js and Express API]
    Database[(MySQL Database)]

    Customer --> Frontend
    Retail --> Frontend
    Admin --> Frontend
    Frontend -->|HTTP API requests| API
    API -->|Read and write data| Database
```

## Core domain relationships

The following is a conceptual ERD of the platform's principal records. It is not a migration specification; confirm fields and relationships against the current database schema before implementation.

```mermaid
erDiagram
    USER ||--o{ PRODUCT : lists
    USER ||--o{ ORDER : places
    PRODUCT ||--o{ VERIFICATION : receives
    PRODUCT ||--o{ ORDER_ITEM : appears_in
    ORDER ||--|{ ORDER_ITEM : contains
    ORDER ||--o{ DELIVERY_UPDATE : tracks
    USER ||--o{ COMPLAINT : submits

    USER {
        int id
        string role
    }
    PRODUCT {
        int id
        int seller_id
        string status
    }
    VERIFICATION {
        int id
        int product_id
        int reviewer_id
        string status
    }
    ORDER {
        int id
        int customer_id
        string status
    }
    ORDER_ITEM {
        int id
        int order_id
        int product_id
    }
    DELIVERY_UPDATE {
        int id
        int order_id
        string status
    }
    COMPLAINT {
        int id
        int submitted_by
        string status
    }
```

## Main request flow

1. A customer, retail partner, or administrator uses the React frontend.
2. The frontend sends requests to the Node.js and Express API.
3. The API applies authentication, authorization, validation, and business rules.
4. The API reads or writes platform data in MySQL and returns a response to the frontend.
