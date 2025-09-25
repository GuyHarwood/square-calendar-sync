# Architecture

```mermaid
graph TB
    %% Frontend Layer
    subgraph "Vercel"
        UI["React SSR App<br/>(Next.js)"]
    end

    %% Backend Infrastructure
    subgraph "Supabase"
        DB[(PostgreSQL Database)]
        RT[Real-time Engine<br/>Channels & Triggers]
        API[Supabase API<br/>REST/GraphQL]
        AUTH[Authentication]
    end

    %% Backend Services
    subgraph "Backend Services"
        SVC1[Calendar Sync Service]
        SVC2[Notification Service]
        SVC4[Appointment Processing Service]
    end

    %% User Interactions
    USER[Users] --> UI

    %% Frontend to Backend
    UI --> API
    UI --> AUTH
    UI <--> RT

    %% API to Database
    API --> DB
    AUTH --> DB

    %% Database Events & Triggers
    DB -.->|Database Events| RT
    RT -.->|Channel Events| SVC1
    RT -.->|Channel Events| SVC2
    RT -.->|Channel Events| SVC4

    %% Services back to Database
    SVC1 --> API
    SVC2 --> API
    SVC4 --> API

    %% External Integrations
    SVC1 --> ICAL[Apple iCal]
    SVC3 --> SQUARE[Square API]
    SVC2 --> EMAIL[Email Service]

    %% Styling
    %% classDef frontend fill:#e1f5fe
    %% classDef backend fill:#f3e5f5
    %% classDef service fill:#e8f5e8
    %% classDef external fill:#fff3e0

    class UI frontend
    class DB,RT,API,AUTH backend
    class SVC1,SVC2,SVC3,SVC4 service
    class ICAL,SQUARE,EMAIL external
```

## Architecture Overview

- **Frontend**: Server-side rendered React app hosted on Vercel
- **Backend**: Supabase providing database, real-time channels, and API
- **Services**: Event-driven microservices listening to database changes via Supabase channels
- **Integrations**: External services for calendar sync, payments, and notifications
